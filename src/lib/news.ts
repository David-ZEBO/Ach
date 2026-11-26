/** Actualités publiques (table news, migration 20261126200000_actualites.sql). */
import { supabase } from './supabase';

export type NewsCategory = 'actualite' | 'evenement' | 'annonce' | 'publication' | 'opportunite';
export const NEWS_CATEGORY: Record<NewsCategory, string> = {
  actualite: 'Actualité', evenement: 'Événement', annonce: 'Annonce', publication: 'Publication', opportunite: 'Opportunité',
};
export interface News {
  id: string; slug: string; title: string; category: NewsCategory; excerpt: string; body: string; cover_url: string | null;
  event_date: string | null; event_location: string; is_published: boolean; published_at: string; updated_at: string;
}
const FIELDS = 'id, slug, title, category, excerpt, body, cover_url, event_date, event_location, is_published, published_at, updated_at';
const ok = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw r.error; return r.data; };

/** Actualités visibles (le visiteur ne reçoit que les publiées : règle RLS). */
export async function listNews(o: { category?: string; limit?: number; excludeId?: string } = {}): Promise<News[]> {
  let q = supabase.from('news').select(FIELDS).eq('is_published', true).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(o.limit ?? 50);
  if (o.category) q = q.eq('category', o.category);
  if (o.excludeId) q = q.neq('id', o.excludeId);
  return ok(await q) as News[];
}
export async function getNews(slug: string): Promise<News | null> {
  return ok(await supabase.from('news').select(FIELDS).eq('slug', slug).maybeSingle()) as News | null;
}

/* ---------- Administration ---------- */
export async function listAllNews(): Promise<News[]> {
  return ok(await supabase.from('news').select(FIELDS).order('published_at', { ascending: false }).limit(300)) as News[];
}
export async function saveNews(n: Partial<News> & { title: string; slug: string }) {
  const row = {
    slug: n.slug, title: n.title, category: n.category ?? 'actualite', excerpt: n.excerpt ?? '', body: n.body ?? '', cover_url: n.cover_url || null,
    event_date: n.event_date || null, event_location: n.event_location ?? '', is_published: !!n.is_published, published_at: n.published_at || new Date().toISOString(),
  };
  if (n.id) return ok(await supabase.from('news').update(row).eq('id', n.id).select('id').single()) as { id: string };
  return ok(await supabase.from('news').insert(row).select('id').single()) as { id: string };
}
export async function deleteNews(id: string) { ok(await supabase.from('news').delete().eq('id', id)); }
export async function uploadNewsImage(file: File) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Formats acceptés : PNG, JPEG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('L’image ne doit pas dépasser 5 Mo.');
  const path = `news/${Date.now()}.${file.type.split('/')[1].replace('jpeg', 'jpg')}`;
  ok(await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type }));
  return supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl;
}

export const newsDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
export const NEWS_FALLBACK: Record<NewsCategory, string> = {
  actualite: '/images/photos/mlr.jpg', evenement: '/images/photos/b3-large.jpg', annonce: '/images/photos/seg.jpg', publication: '/images/photos/b1.jpg', opportunite: '/images/photos/cmk.jpg',
};
