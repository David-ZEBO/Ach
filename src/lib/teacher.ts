/**
 * Espace professeur (migration 20261126180000_espace_professeur.sql).
 * Tout est validé par un administrateur : demande -> rôle « instructor » (et faculté pour l'université),
 * cours créés en brouillon -> soumis -> publiés par l'admin.
 */
import { supabase } from './supabase';
import type { Level } from './api';

export type TeacherKind = 'trainer' | 'university';
export interface TeacherApplication { id: string; kind: TeacherKind; faculty_id: string | null; expertise: string; motivation: string; cv_path: string | null; cv_name: string | null; status: 'pending' | 'approved' | 'rejected' | 'withdrawn'; admin_message: string; created_at: string; reviewed_at: string | null; faculty?: string; user_id?: string }
export interface TeacherStatus { isInstructor: boolean; faculties: { id: string; name: string }[]; applications: TeacherApplication[] }

const ok = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw r.error; return r.data; };
const frName = (arr: any[] | undefined) => arr?.find((t: any) => t.language === 'fr')?.name ?? arr?.[0]?.name ?? '';

export async function teacherStatus(userId: string): Promise<TeacherStatus> {
  const [roles, fac, apps] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userId),
    supabase.from('faculty_teachers').select('faculty_id, faculties(faculty_translations(name, language))').eq('user_id', userId),
    supabase.from('teacher_applications').select('id, kind, faculty_id, expertise, motivation, cv_path, cv_name, status, admin_message, created_at, reviewed_at, faculties(faculty_translations(name, language))').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  return {
    isInstructor: (ok(roles) as any[]).some((r) => r.role === 'instructor'),
    faculties: (ok(fac) as any[]).map((f) => ({ id: f.faculty_id, name: frName(f.faculties?.faculty_translations) })),
    applications: (ok(apps) as any[]).map((a) => ({ ...a, faculty: frName(a.faculties?.faculty_translations) })),
  };
}

export async function submitTeacherApplication(userId: string, i: { kind: TeacherKind; faculty_id: string | null; expertise: string; motivation: string; cv: File | null }) {
  let cv_path: string | null = null, cv_name: string | null = null;
  if (i.cv) {
    if (i.cv.size > 10 * 1024 * 1024) throw new Error('Le CV ne doit pas dépasser 10 Mo.');
    cv_path = `${userId}/${Date.now()}-${i.cv.name.replace(/[^\w.\-]+/g, '_')}`;
    ok(await supabase.storage.from('teacher-cvs').upload(cv_path, i.cv, { contentType: i.cv.type || 'application/pdf' }));
    cv_name = i.cv.name;
  }
  ok(await supabase.from('teacher_applications').insert({ kind: i.kind, faculty_id: i.faculty_id, expertise: i.expertise, motivation: i.motivation, cv_path, cv_name }));
}

export async function cvUrl(path: string) {
  const { data, error } = await supabase.storage.from('teacher-cvs').createSignedUrl(path, 600);
  if (error) throw error; return data.signedUrl;
}

export async function listFaculties() {
  const rows = ok(await supabase.from('faculties').select('id, faculty_translations(name, language)').eq('is_published', true).order('position')) as any[];
  return rows.map((f) => ({ id: f.id as string, name: frName(f.faculty_translations) as string }));
}

export interface TeacherCourse { id: string; slug: string; status: string; review_requested_at: string | null; title: string; university: boolean; updated_at: string }
export async function myCourses(userId: string): Promise<TeacherCourse[]> {
  const rows = ok(await supabase.from('course_instructors').select('courses(id, slug, status, review_requested_at, updated_at, course_translations(title, language))').eq('user_id', userId)) as any[];
  const courses = rows.map((r) => r.courses).filter(Boolean);
  const ids = courses.map((c: any) => c.id);
  const units = ids.length ? (ok(await supabase.from('programme_units').select('course_id').in('course_id', ids)) as any[]) : [];
  const uni = new Set(units.map((u) => u.course_id));
  return courses.map((c: any) => ({ id: c.id, slug: c.slug, status: c.status, review_requested_at: c.review_requested_at, updated_at: c.updated_at, title: c.course_translations?.find((t: any) => t.language === 'fr')?.title ?? c.slug, university: uni.has(c.id) }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function programmesOfFaculties(facultyIds: string[]) {
  if (!facultyIds.length) return [];
  const rows = ok(await supabase.from('programmes').select('id, faculty_id, level, programme_translations(name, language)').in('faculty_id', facultyIds).order('position')) as any[];
  return rows.map((p) => ({ id: p.id as string, faculty_id: p.faculty_id as string, level: p.level as string, name: frName(p.programme_translations) as string }));
}

export async function teacherCreateCourse(i: { title: string; subtitle: string; short_description: string; category_id: string | null; level: Level; duration_minutes: number; parts: string[]; programme_id?: string | null; semester?: number | null; credits?: number }) {
  return ok(await supabase.rpc('instructor_create_course', {
    p_title: i.title, p_subtitle: i.subtitle, p_short_description: i.short_description, p_category_id: i.category_id, p_level: i.level,
    p_duration_minutes: i.duration_minutes, p_modules: i.parts, p_programme_id: i.programme_id ?? null, p_semester: i.semester ?? null, p_credits: i.credits ?? 0,
  })) as string;
}
export async function teacherUpdateCourse(courseId: string, f: { category_id: string | null; level: Level; duration_minutes: number; cover_path: string | null; instructor_name: string | null }) {
  ok(await supabase.rpc('instructor_update_course', { p_course_id: courseId, p_category_id: f.category_id, p_level: f.level, p_duration_minutes: f.duration_minutes, p_cover_path: f.cover_path, p_instructor_name: f.instructor_name }));
}
export async function submitForReview(courseId: string) { ok(await supabase.rpc('instructor_submit_course', { p_course_id: courseId })); }

/* ---------- Administration ---------- */
export async function listTeacherApplications(status: string) {
  let q = supabase.from('teacher_applications').select('id, user_id, kind, faculty_id, expertise, motivation, cv_path, cv_name, status, admin_message, created_at, reviewed_at, faculties(faculty_translations(name, language))').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const rows = ok(await q) as any[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const profiles = ids.length ? (ok(await supabase.from('profiles').select('id, first_name, last_name, email').in('id', ids)) as any[]) : [];
  return rows.map((r) => {
    const p = profiles.find((x) => x.id === r.user_id);
    return { ...r, faculty: frName(r.faculties?.faculty_translations), name: p ? `${p.first_name} ${p.last_name}`.trim() || p.email : '—', email: p?.email ?? '' } as TeacherApplication & { name: string; email: string };
  });
}
export async function decideTeacherApplication(id: string, approve: boolean, message: string) {
  ok(await supabase.rpc('admin_decide_teacher_application', { p_application_id: id, p_approve: approve, p_message: message }));
}
export async function coursesToReview(): Promise<Set<string>> {
  const rows = ok(await supabase.from('courses').select('id').not('review_requested_at', 'is', null).eq('status', 'draft')) as any[];
  return new Set(rows.map((r) => r.id));
}

export const TEACHER_ERRORS: Record<string, string> = {
  teacher_applications_one_pending: 'Vous avez déjà une demande en attente pour ce type d’enseignement.',
  teacher_applications_university_check: 'Une demande universitaire nécessite une faculté et un CV.',
  not_faculty_teacher: 'Vous n’êtes pas encore admis comme professeur dans cette faculté.',
  not_draft: 'Ce cours est publié : seule l’administration peut modifier ses caractéristiques.',
  course_empty: 'Ajoutez au moins un chapitre avant de soumettre le cours.',
  invalid_semester: 'Choisissez un semestre entre 1 et 12.',
  forbidden: 'Action réservée aux formateurs validés par l’administration.',
};
export function teacherError(e: unknown) {
  const m = (e as { message?: string })?.message ?? '';
  const k = Object.keys(TEACHER_ERRORS).find((x) => m.includes(x));
  return k ? TEACHER_ERRORS[k] : m || 'Une erreur est survenue.';
}
