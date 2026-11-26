import { getPublicSettings } from './api';
import { FOUNDER_DEFAULTS } from './content';
import { useAsync } from './hooks';

export type Founder = typeof FOUNDER_DEFAULTS;

/**
 * Contenu du fondateur : valeurs par défaut, remplacées par les clés publiques
 * de site_settings si l'administration les a renseignées (founder.intro, founder.message,
 * founder.bio, founder.photo, founder.education, founder.roles).
 */
export function useFounder(): Founder {
  const { data } = useAsync(() => getPublicSettings('founder.'), []);
  const s = data ?? {};
  const str = (k: string, d: string) => (typeof s[k] === 'string' && (s[k] as string).trim() ? (s[k] as string) : d);
  const arr = (k: string, d: string[]) => (Array.isArray(s[k]) ? (s[k] as string[]) : d);
  return {
    ...FOUNDER_DEFAULTS,
    intro: str('founder.intro', FOUNDER_DEFAULTS.intro),
    message: str('founder.message', FOUNDER_DEFAULTS.message),
    photo: str('founder.photo', FOUNDER_DEFAULTS.photo),
    education: arr('founder.education', FOUNDER_DEFAULTS.education),
    roles: arr('founder.roles', FOUNDER_DEFAULTS.roles),
  };
}
