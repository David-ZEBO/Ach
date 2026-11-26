import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthState = { session: Session | null; ready: boolean };
const Ctx = createContext<AuthState>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false });
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setState({ session, ready: true }));
    return () => data.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

/** Messages d'erreur Supabase compréhensibles par un utilisateur. */
export function authMessage(err: unknown): string {
  const m = (err as { message?: string })?.message ?? '';
  if (/invalid login credentials/i.test(m)) return 'Adresse e-mail ou mot de passe incorrect.';
  if (/email not confirmed/i.test(m)) return 'Confirmez d’abord votre adresse e-mail grâce au lien reçu.';
  if (/already registered/i.test(m)) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  if (/password should be at least/i.test(m)) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (/rate limit/i.test(m)) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (/row-level security|42501/i.test(m)) return 'Cette action n’est pas autorisée pour votre compte.';
  return m || 'Une erreur est survenue. Réessayez.';
}
