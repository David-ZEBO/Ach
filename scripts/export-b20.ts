// Exporte le catalogue B20 au format des tables courses / course_translations / modules.
import { B20, B20_PRINCIPLES } from './b20-source.ts';

const COVER: Record<string, string> = {
  leadership: '/images/photos/courses/leadership.webp',
  entrepreneurship: '/images/photos/courses/entreprise.webp',
  marketing: '/images/photos/courses/marketing-digital.webp',
  finance: '/images/photos/courses/comptabilite.webp',
  'human-resources': '/images/photos/courses/ressources-humaines.webp',
  projets: '/images/photos/professionals-meeting.webp',
  developpement: '/images/photos/online-learner.webp',
};
const CATEGORY: Record<string, string> = { projets: 'project-management', developpement: 'professional-development' };

const short = (s: string) => (s.length <= 300 ? s : s.slice(0, s.lastIndexOf(' ', 297)) + '…');

const rows = B20.map((c) => ({
  slug: c.slug,
  category: CATEGORY[c.domain] ?? c.domain,
  duration_minutes: c.hours * 60,
  cover_path: COVER[c.domain],
  title: c.title,
  subtitle: c.tagline ?? '',
  short_description: short(c.pertinence[0]),
  description: [
    ...c.pertinence,
    `Méthodologie\n${c.method}`,
    `Durée : ${c.hours} heures. Mode d’étude : présentiel.`,
    `Principes de la formation\n${B20_PRINCIPLES.map((p) => `• ${p}`).join('\n')}`,
  ].join('\n\n'),
  objectives: c.objectives,
  audience: c.audience,
  modules: c.modules.map((m) => (typeof m === 'string' ? { title: m, summary: '' } : { title: m.title, summary: m.items.map((i) => `• ${i}`).join('\n') })),
}));
console.log(JSON.stringify(rows));
