import { storageUrl } from './supabase';

/**
 * Les formations existantes référencent des images de l'ancien site (/images/photos/...webp)
 * qui n'existent plus. On les fait correspondre aux photos du nouveau site, sans toucher aux données.
 */
const LEGACY: Record<string, string> = {
  '/images/photos/colleagues-laptop.webp': '/images/photos/cmk.jpg',
  '/images/photos/team-discussion.webp': '/images/photos/mlr.jpg',
  '/images/photos/online-learner.webp': '/images/photos/stn.jpg',
  '/images/photos/professionals-meeting.webp': '/images/photos/seg.jpg',
  '/images/photos/about-team.webp': '/images/photos/b3.jpg',
  '/images/photos/courses/comptabilite.webp': '/images/photos/seg.jpg',
  '/images/photos/courses/airtable.webp': '/images/photos/stn.jpg',
  '/images/photos/courses/web-ia.webp': '/images/photos/stn.jpg',
  '/images/photos/courses/leadership.webp': '/images/photos/mlr.jpg',
  '/images/photos/courses/entreprise.webp': '/images/photos/b3.jpg',
  '/images/photos/courses/ressources-humaines.webp': '/images/photos/cmk.jpg',
  '/images/photos/courses/marketing-digital.webp': '/images/photos/cmk.jpg',
};

const BY_CATEGORY: Record<string, string> = {
  marketing: '/images/photos/cmk.jpg',
  entrepreneurship: '/images/photos/b3.jpg',
  technology: '/images/photos/stn.jpg',
  leadership: '/images/photos/mlr.jpg',
  finance: '/images/photos/seg.jpg',
  'human-resources': '/images/photos/cmk.jpg',
};

export function facultyImage(path: string | null | undefined): string {
  return (path && LEGACY[path.replace(/\.(jpg|png)$/, '.webp')]) || '/images/photos/b2.jpg';
}

export function coverImage(path: string | null | undefined, categorySlug?: string | null): string {
  if (path) {
    if (LEGACY[path]) return LEGACY[path];
    if (path.startsWith('/')) return path;
    if (path.startsWith('http')) return path;
    return storageUrl('course-covers', path);
  }
  return (categorySlug && BY_CATEGORY[categorySlug]) || '/images/photos/b2.jpg';
}
