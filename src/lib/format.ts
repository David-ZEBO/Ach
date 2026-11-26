import type { Level } from './api';

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const PROGRAMME_LEVEL: Record<string, string> = {
  certificate: 'Certificat universitaire',
  bachelor: 'Licence',
  master: 'Master',
  doctorate: 'Doctorat',
};

export const PROGRAMME_STATUS: Record<string, { label: string; tone: 'open' | 'soon' | 'closed' }> = {
  open: { label: 'Candidatures ouvertes', tone: 'open' },
  planned: { label: 'Ouverture prochaine', tone: 'soon' },
  closed: { label: 'Candidatures fermées', tone: 'closed' },
};

export const DOCUMENT_LABEL: Record<string, string> = {
  identity: 'Pièce d’identité', diploma: 'Dernier diplôme', transcript: 'Relevé de notes', photo: 'Photo d’identité',
  cv: 'Curriculum vitae', recommendation: 'Lettre de recommandation', motivation_letter: 'Lettre de motivation',
};

export function formatMonths(m: number | null): string {
  if (!m) return 'Durée à préciser';
  if (m % 12 === 0) return `${m / 12} an${m / 12 > 1 ? 's' : ''}`;
  return `${m} mois`;
}

export function formatDuration(minutes: number): string {
  if (!minutes) return 'Durée à préciser';
  const h = Math.round(minutes / 60);
  return h < 1 ? `${minutes} min` : `${h} h`;
}

/** Les montants sont stockés en unités mineures (centimes). */
export function formatPrice(amount: number, currency: string): string {
  if (!amount) return 'Gratuit';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100);
}
