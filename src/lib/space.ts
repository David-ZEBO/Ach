/**
 * Salle virtuelle d'un cours : classes virtuelles (calendar_events « live »), échéances (« exam »),
 * annonces, forum, participants et notes. Uniquement les fonctions et règles RLS existantes :
 * get_course_space, list_discussions, get_discussion, moderate_discussion, get_course_participants, get_my_grades.
 */
import { supabase } from './supabase';

const ok = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw r.error; return r.data; };

/**
 * Droits sur l'espace du cours. La salle virtuelle n'existe que pour un cours universitaire et n'est
 * ouverte qu'aux étudiants d'un programme de la même faculté, aux formateurs du cours et à l'administration
 * (fonction virtual_room_access, et politiques restrictives côté base).
 */
export async function courseAccess(courseId: string): Promise<{ can_manage: boolean; is_enrolled: boolean; is_university: boolean; room: boolean }> {
  const [d, r] = await Promise.all([supabase.rpc('get_course_space', { p_course_id: courseId }), supabase.rpc('virtual_room_access', { p_course_id: courseId })]);
  const s = ok(d) as any, v = ok(r) as any;
  return { can_manage: !!s?.can_manage, is_enrolled: !!s?.is_enrolled, is_university: !!v?.is_university, room: !!v?.allowed };
}

/* ---------- Classes virtuelles et échéances ---------- */
export interface CalEvent { id: string; course_id: string | null; title: string; description: string; kind: 'live' | 'exam' | 'academic' | 'other'; starts_at: string; ends_at: string | null; location: string }
export async function listEvents(courseId: string): Promise<CalEvent[]> {
  return ok(await supabase.from('calendar_events').select('id, course_id, title, description, kind, starts_at, ends_at, location').eq('course_id', courseId).order('starts_at')) as CalEvent[];
}
export async function saveEvent(courseId: string, e: Partial<CalEvent> & { title: string; starts_at: string }) {
  const row = { course_id: courseId, title: e.title, description: e.description ?? '', kind: e.kind ?? 'live', starts_at: e.starts_at, ends_at: e.ends_at || null, location: e.location ?? '' };
  if (e.id) ok(await supabase.from('calendar_events').update(row).eq('id', e.id));
  else ok(await supabase.from('calendar_events').insert(row));
}
export async function deleteEvent(id: string) { ok(await supabase.from('calendar_events').delete().eq('id', id)); }

/** Salle de visioconférence Jitsi Meet (gratuite, sans compte) au nom de l'Académie. */
export function jitsiRoom(courseSlug: string) {
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
  return `https://meet.jit.si/ACH-${courseSlug.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${rnd}`;
}
export const isUrl = (s: string) => /^https:\/\/\S+$/.test(s.trim());

/** État d'une séance : la salle ouvre 15 minutes avant le début. */
export function liveState(e: CalEvent, now = Date.now()): 'upcoming' | 'open' | 'live' | 'ended' {
  const start = new Date(e.starts_at).getTime();
  const end = e.ends_at ? new Date(e.ends_at).getTime() : start + 60 * 60 * 1000;
  if (now > end) return 'ended';
  if (now >= start) return 'live';
  if (now >= start - 15 * 60 * 1000) return 'open';
  return 'upcoming';
}

/* ---------- Annonces ---------- */
export interface Announcement { id: string; title: string; body: string; published_at: string; author_id: string | null }
export async function listAnnouncements(courseId: string): Promise<Announcement[]> {
  return ok(await supabase.from('announcements').select('id, title, body, published_at, author_id').eq('course_id', courseId).eq('is_published', true).order('published_at', { ascending: false })) as Announcement[];
}
export async function postAnnouncement(courseId: string, userId: string, title: string, body: string) {
  ok(await supabase.from('announcements').insert({ course_id: courseId, author_id: userId, title, body }));
}
export async function deleteAnnouncement(id: string) { ok(await supabase.from('announcements').delete().eq('id', id)); }

/* ---------- Forum ---------- */
export interface DiscussionRow { id: string; title: string; author: string; is_pinned: boolean; is_locked: boolean; is_hidden: boolean; reply_count: number; last_post_at: string; created_at: string }
export interface Post { id: string; parent_id: string | null; author_id: string; author: string; body: string; is_hidden: boolean; created_at: string }
export interface Discussion extends DiscussionRow { body: string; author_id: string; can_moderate: boolean; can_post: boolean; posts: Post[] }
export async function listDiscussions(courseId: string): Promise<DiscussionRow[]> {
  return (ok(await supabase.rpc('list_discussions', { p_course_id: courseId, p_lesson_id: null })) ?? []) as DiscussionRow[];
}
export async function getDiscussion(id: string): Promise<Discussion> { return ok(await supabase.rpc('get_discussion', { p_discussion_id: id })) as Discussion; }
export async function createDiscussion(courseId: string, userId: string, title: string, body: string) {
  return ok(await supabase.from('discussions').insert({ course_id: courseId, author_id: userId, title, body }).select('id').single()) as { id: string };
}
export async function replyDiscussion(d: { id: string; course_id: string }, userId: string, body: string, parentId: string | null) {
  ok(await supabase.from('discussion_posts').insert({ discussion_id: d.id, course_id: d.course_id, author_id: userId, body, parent_id: parentId }));
}
export async function moderate(id: string, f: { pinned?: boolean; locked?: boolean; hidden?: boolean }) {
  ok(await supabase.rpc('moderate_discussion', { p_discussion_id: id, p_pinned: f.pinned ?? null, p_locked: f.locked ?? null, p_hidden: f.hidden ?? null }));
}

/* ---------- Participants et notes ---------- */
export interface Participants { teachers: { user_id: string; name: string; role: string; email?: string }[]; students: { user_id: string; name: string; email?: string; enrolled_at?: string; last_access_at?: string | null; completed_lessons?: number }[]; total_lessons: number; can_manage: boolean }
export async function participants(courseId: string) { return ok(await supabase.rpc('get_course_participants', { p_course_id: courseId })) as Participants; }
export interface Grades { grading_method: string; pass_mark: number; final_percent: number | null; items: { id: string; title: string; source: string; max_points: number; weight: number; state: 'released' | 'pending' | 'not_graded'; points: number | null; feedback: string | null }[] }
export async function myGrades(courseId: string) { return ok(await supabase.rpc('get_my_grades', { p_course_id: courseId })) as Grades; }
