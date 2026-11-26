import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { authMessage, useAuth } from '../lib/auth';
import { usePageMeta } from '../lib/hooks';

type Mode = 'connexion' | 'inscription' | 'oubli';

export default function Connexion() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>((params.get('mode') as Mode) || 'connexion');
  const retour = params.get('retour') || '/mon-compte';
  const { session } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState({ first: '', last: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  usePageMeta(mode === 'inscription' ? 'Créer un compte' : 'Se connecter');

  useEffect(() => { if (session && mode !== 'oubli') navigate(retour, { replace: true }); }, [session, mode, retour, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      if (mode === 'connexion') {
        const { error } = await supabase.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
        if (error) throw error;
      } else if (mode === 'inscription') {
        if (v.password.length < 8) throw new Error('Password should be at least 8 characters');
        const { data, error } = await supabase.auth.signUp({
          email: v.email.trim(), password: v.password,
          options: { data: { first_name: v.first.trim(), last_name: v.last.trim() }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) setMsg({ ok: true, text: 'Compte créé. Confirmez votre adresse grâce au lien envoyé par e-mail, puis connectez-vous.' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(v.email.trim(), { redirectTo: `${location.origin}/reset-password` });
        if (error) throw error;
        setMsg({ ok: true, text: 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.' });
      }
    } catch (err) { setMsg({ ok: false, text: authMessage(err) }); }
    finally { setBusy(false); }
  }

  const title = mode === 'connexion' ? 'Se connecter' : mode === 'inscription' ? 'Créer mon compte apprenant' : 'Mot de passe oublié';
  return (
    <section className="auth-split">
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual-in">
          <span className="eyebrow" style={{ color: '#FF8A8F' }}>Académie du Capital Humain</span>
          <p className="auth-quote">« Le capital humain, socle de toute création des valeurs. »</p>
          <ul>
            <li>Suivez vos formations et votre progression</li>
            <li>Passez vos quiz et remettez vos devoirs</li>
            <li>Téléchargez vos certificats</li>
          </ul>
        </div>
      </div>
      <div className="auth-panel">
      <form className="form-card form" onSubmit={onSubmit} noValidate>
        <Link to="/" className="auth-logo" aria-label="Retour à l’accueil"><img src="/images/logo-ach.jpg" alt="ACH, Académie du Capital Humain" width={670} height={278} /></Link>
        <h1 style={{ fontSize: '1.45rem' }}>{title}</h1>
        <p style={{ color: 'var(--muted)', marginTop: -6 }}>{mode === 'connexion' ? 'Heureux de vous revoir. Connectez-vous pour reprendre vos formations.' : mode === 'inscription' ? 'Créez votre compte gratuit pour vous inscrire aux formations.' : 'Indiquez votre adresse : nous vous envoyons un lien pour choisir un nouveau mot de passe.'}</p>
        {mode === 'inscription' && (
          <div className="row2">
            <div className="field"><label htmlFor="u-fn">Prénom</label><input id="u-fn" autoComplete="given-name" maxLength={80} value={v.first} onChange={(e) => setV({ ...v, first: e.target.value })} required /></div>
            <div className="field"><label htmlFor="u-ln">Nom</label><input id="u-ln" autoComplete="family-name" maxLength={80} value={v.last} onChange={(e) => setV({ ...v, last: e.target.value })} required /></div>
          </div>
        )}
        <div className="field"><label htmlFor="u-em">Adresse e-mail</label><input id="u-em" type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required /></div>
        {mode !== 'oubli' && <div className="field"><label htmlFor="u-pw">Mot de passe</label><input id="u-pw" type="password" autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'} minLength={8} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} required />{mode === 'inscription' && <span className="hint">8 caractères minimum.</span>}</div>}
        {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.text}</p>}
        <button className="btn btn-red" disabled={busy}>{busy ? 'Patientez…' : mode === 'connexion' ? 'Se connecter' : mode === 'inscription' ? 'Créer mon compte' : 'Recevoir le lien'}</button>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)' }}>
          {mode === 'connexion' && <>Pas encore de compte ? <button type="button" className="linkbtn" onClick={() => setMode('inscription')}>Créer un compte</button> · <button type="button" className="linkbtn" onClick={() => setMode('oubli')}>Mot de passe oublié</button></>}
          {mode !== 'connexion' && <>Déjà inscrit ? <button type="button" className="linkbtn" onClick={() => setMode('connexion')}>Se connecter</button></>}
        </p>
        <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>En créant un compte, vous acceptez la <Link to="/confidentialite">politique de confidentialité</Link>.</p>
      </form>
      </div>
    </section>
  );
}
