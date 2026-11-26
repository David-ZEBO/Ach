/**
 * Administration des formations. N'utilise que l'existant de la base :
 * - admin_course_overview / admin_create_course / admin_reorder_modules / admin_reorder_lessons / admin_save_quiz ;
 * - écritures directes autorisées par RLS pour un administrateur (courses, course_translations, modules,
 *   lessons, lesson_contents, assignments) ;
 * - buckets course-covers (couvertures) et course-materials (documents, dossier = id du cours).
 */
import { supabase } from './supabase';
import type { Level } from './api';

export type LessonType = 'text' | 'video' | 'document' | 'link' | 'presentation' | 'audio' | 'quiz' | 'assignment';
export const CHAPTER_TYPES: { v: LessonType; l: string }[] = [
  { v: 'text', l: 'Lecture' }, { v: 'video', l: 'Vidéo' }, { v: 'document', l: 'Document' }, { v: 'link', l: 'Ressource en ligne' }, { v: 'presentation', l: 'Présentation' }, { v: 'audio', l: 'Audio' },
];

export interface AdminCourseRow { id: string; slug: string; status: 'draft' | 'published' | 'archived'; is_demo: boolean; category_slug: string | null; price_amount: number; currency: string; title: string; module_count: number; lesson_count: number; enrollment_count: number; updated_at: string }

export async function listAdminCourses(): Promise<AdminCourseRow[]> {
  const { data, error } = await supabase.rpc('admin_course_overview');
  if (error) throw error;
  return (data ?? []) as AdminCourseRow[];
}

export const slugify = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

export async function createCourse(i: { slug: string; title: string; subtitle: string; short_description: string; category_id: string | null; level: Level; price_amount: number; currency: string; duration_minutes: number; certificate_enabled: boolean; parts: string[] }) {
  const { data, error } = await supabase.rpc('admin_create_course', {
    p_slug: i.slug, p_teaching_language: 'fr', p_category_id: i.category_id, p_level: i.level, p_price_amount: i.price_amount, p_currency: i.currency,
    p_duration_minutes: i.duration_minutes, p_instructor_name: '', p_is_featured: false, p_certificate_enabled: i.certificate_enabled, p_require_all_lessons: true,
    p_trailer_provider: null, p_trailer_ref: null, p_title: i.title, p_subtitle: i.subtitle, p_short_description: i.short_description, p_modules: i.parts,
  });
  if (error) throw error;
  return data as string;
}

export async function listCategoryOptions() {
  const { data, error } = await supabase.from('categories').select('id, slug, category_translations(name, language)').order('position');
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ id: c.id as string, name: (c.category_translations?.find((t: any) => t.language === 'fr')?.name ?? c.slug) as string }));
}

export interface AdminLesson { id: string; module_id: string; title: string; type: LessonType; position: number; duration_minutes: number; is_preview: boolean; is_published: boolean }
export interface AdminModule { id: string; title: string; summary: string; position: number; is_published: boolean; lessons: AdminLesson[] }
export interface AdminCourse {
  id: string; slug: string; status: string; is_demo: boolean; category_id: string | null; level: Level; price_amount: number; currency: string; duration_minutes: number;
  cover_path: string | null; certificate_enabled: boolean; instructor_name: string | null; review_requested_at: string | null;
  t: { title: string; subtitle: string; short_description: string; description: string; objectives: string[]; audience: string[]; prerequisites: string[]; instructor_bio: string };
  modules: AdminModule[]; finalQuizId: string | null; isUniversity: boolean;
}

export async function getAdminCourse(id: string): Promise<AdminCourse | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, slug, status, is_demo, category_id, level, price_amount, currency, duration_minutes, cover_path, certificate_enabled, instructor_name, review_requested_at, course_translations(language, title, subtitle, short_description, description, objectives, audience, prerequisites, instructor_bio), modules(id, title, summary, position, is_published, lessons(id, module_id, title, type, position, duration_minutes, is_preview, is_published))')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d: any = data;
  const { data: fq } = await supabase.from('quizzes').select('id').eq('course_id', id).eq('is_final', true).is('lesson_id', null).limit(1).maybeSingle();
  const { count: units } = await supabase.from('programme_units').select('course_id', { count: 'exact', head: true }).eq('course_id', id);
  const t = d.course_translations?.find((x: any) => x.language === 'fr') ?? { title: '', subtitle: '', short_description: '', description: '', objectives: [], audience: [], prerequisites: [], instructor_bio: '' };
  return {
    ...d, t, finalQuizId: fq?.id ?? null, isUniversity: (units ?? 0) > 0,
    modules: (d.modules ?? []).sort((a: any, b: any) => a.position - b.position).map((m: any) => ({ ...m, lessons: (m.lessons ?? []).sort((a: any, b: any) => a.position - b.position) })),
  };
}

const ok = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw r.error; return r.data; };

export async function updateCourse(id: string, fields: Partial<Pick<AdminCourse, 'category_id' | 'level' | 'price_amount' | 'currency' | 'duration_minutes' | 'cover_path' | 'certificate_enabled' | 'status' | 'slug' | 'instructor_name' | 'review_requested_at'>>) {
  ok(await supabase.from('courses').update(fields).eq('id', id));
}
export async function saveTranslation(courseId: string, t: AdminCourse['t']) {
  ok(await supabase.from('course_translations').upsert({ course_id: courseId, language: 'fr', ...t }, { onConflict: 'course_id,language' }));
}
export async function uploadCover(courseId: string, file: File) {
  if (!/^image\//.test(file.type)) throw new Error('Choisissez une image (PNG, JPEG ou WebP).');
  const path = `${courseId}/${Date.now()}.${file.name.split('.').pop()?.toLowerCase() || 'jpg'}`;
  ok(await supabase.storage.from('course-covers').upload(path, file, { contentType: file.type }));
  return path;
}

/* ---------- Plan : parties et chapitres ---------- */
export async function addModule(courseId: string, title: string, position: number) {
  return ok(await supabase.from('modules').insert({ course_id: courseId, title, position }).select('id').single());
}
export async function updateModule(id: string, fields: Partial<Pick<AdminModule, 'title' | 'summary' | 'is_published'>>) { ok(await supabase.from('modules').update(fields).eq('id', id)); }
export async function deleteModule(id: string) { ok(await supabase.from('modules').delete().eq('id', id)); }
export async function reorderModules(courseId: string, ids: string[]) { ok(await supabase.rpc('admin_reorder_modules', { p_course_id: courseId, p_module_ids: ids })); }

export async function addLesson(courseId: string, moduleId: string, title: string, type: LessonType, position: number) {
  return ok(await supabase.from('lessons').insert({ course_id: courseId, module_id: moduleId, title, type, position }).select('id').single()) as { id: string };
}
export async function updateLesson(id: string, fields: Partial<Pick<AdminLesson, 'title' | 'type' | 'duration_minutes' | 'is_preview' | 'is_published'>>) { ok(await supabase.from('lessons').update(fields).eq('id', id)); }
export async function deleteLesson(id: string) { ok(await supabase.from('lessons').delete().eq('id', id)); }
export async function reorderLessons(moduleId: string, ids: string[]) { ok(await supabase.rpc('admin_reorder_lessons', { p_module_id: moduleId, p_lesson_ids: ids })); }

/* ---------- Contenu d'un chapitre ---------- */
export interface ContentForm { body: string; video_provider: string; video_ref: string; document_path: string; external_url: string }
export async function getContent(lessonId: string): Promise<ContentForm> {
  const { data } = await supabase.from('lesson_contents').select('body, video_provider, video_ref, document_path, external_url').eq('lesson_id', lessonId).maybeSingle();
  return { body: data?.body ?? '', video_provider: data?.video_provider ?? '', video_ref: data?.video_ref ?? '', document_path: data?.document_path ?? '', external_url: data?.external_url ?? '' };
}
export async function saveContent(lessonId: string, c: ContentForm) {
  ok(await supabase.from('lesson_contents').upsert({
    lesson_id: lessonId, body: c.body, video_provider: c.video_provider || null, video_ref: c.video_ref.trim() || null,
    document_path: c.document_path || null, external_url: c.external_url.trim() || null,
  }, { onConflict: 'lesson_id' }));
}
export async function uploadMaterial(courseId: string, file: File) {
  if (file.size > 50 * 1024 * 1024) throw new Error('Le fichier ne doit pas dépasser 50 Mo.');
  const path = `${courseId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
  ok(await supabase.storage.from('course-materials').upload(path, file, { contentType: file.type || undefined }));
  return path;
}

/* ---------- Quiz ---------- */
export type QKind = 'single' | 'multiple' | 'true_false' | 'short_answer';
export interface QEdit { id?: string; kind: QKind; prompt: string; options: { id: string; text: string }[]; correct_option_ids: string[]; accepted_answers: string[]; explanation: string; points: number }
export interface QuizEdit { id: string | null; title: string; pass_percent: number; max_attempts: number | null; show_answers: 'never' | 'after_pass' | 'after_submit'; questions: QEdit[] }

export async function loadQuizEdit(courseId: string, opts: { lessonId?: string; final?: boolean }, fallbackTitle: string): Promise<QuizEdit> {
  let q = supabase.from('quizzes').select('id, title, pass_percent, max_attempts, show_answers').eq('course_id', courseId);
  q = opts.lessonId ? q.eq('lesson_id', opts.lessonId) : q.eq('is_final', true).is('lesson_id', null);
  const { data } = await q.limit(1).maybeSingle();
  if (!data) return { id: null, title: fallbackTitle, pass_percent: 70, max_attempts: null, show_answers: 'after_submit', questions: [] };
  const qs = ok(await supabase.from('quiz_questions').select('id, kind, prompt, options, correct_option_ids, accepted_answers, explanation, points').eq('quiz_id', data.id).order('position')) as any[];
  return { ...(data as any), questions: qs.map((x) => ({ ...x, options: x.options ?? [] })) };
}
export async function saveQuizEdit(courseId: string, q: QuizEdit, opts: { lessonId?: string; final?: boolean }) {
  const settings = { title: q.title, pass_percent: q.pass_percent, max_attempts: q.max_attempts, is_final: !!opts.final || undefined, show_answers: q.show_answers, lesson_id: opts.lessonId ?? null };
  const questions = q.questions.map((x) => ({
    id: x.id, kind: x.kind, prompt: x.prompt, points: x.points, explanation: x.explanation,
    options: x.kind === 'short_answer' ? [] : x.options, correct_option_ids: x.kind === 'short_answer' ? [] : x.correct_option_ids, accepted_answers: x.accepted_answers,
  }));
  return ok(await supabase.rpc('admin_save_quiz', { p_quiz_id: q.id, p_course_id: courseId, p_settings: settings, p_questions: questions })) as string;
}

/* ---------- Activité (devoir) ---------- */
export interface AssignmentEdit { id: string | null; title: string; instructions: string; max_points: number; submission_types: ('text' | 'file')[]; due_at: string; is_published: boolean }
export async function loadAssignmentEdit(lessonId: string, fallbackTitle: string): Promise<AssignmentEdit> {
  const { data } = await supabase.from('assignments').select('id, title, instructions, max_points, submission_types, due_at, is_published').eq('lesson_id', lessonId).maybeSingle();
  if (!data) return { id: null, title: fallbackTitle, instructions: '', max_points: 100, submission_types: ['text', 'file'], due_at: '', is_published: true };
  return { ...(data as any), due_at: data.due_at ? String(data.due_at).slice(0, 16) : '' };
}
export async function saveAssignmentEdit(courseId: string, lessonId: string, a: AssignmentEdit) {
  const row = { course_id: courseId, lesson_id: lessonId, title: a.title, instructions: a.instructions, max_points: a.max_points, submission_types: a.submission_types, due_at: a.due_at ? new Date(a.due_at).toISOString() : null, is_published: a.is_published };
  if (a.id) ok(await supabase.from('assignments').update(row).eq('id', a.id));
  else ok(await supabase.from('assignments').insert(row));
}

export function adminError(e: unknown): string {
  const m = (e as { message?: string; code?: string })?.message ?? '';
  if (/duplicate key.*slug/i.test(m)) return 'Cette adresse (slug) est déjà utilisée par une autre formation.';
  if (/foreign key/i.test(m)) return 'Impossible de supprimer : des apprenants ont déjà une progression ou des résultats liés. Masquez plutôt l’élément.';
  if (/invalid_question/.test(m)) return 'Une question est incomplète : énoncé, au moins deux choix et une bonne réponse sont obligatoires.';
  if (/row-level security|42501|forbidden/i.test(m)) return 'Action réservée aux administrateurs.';
  if (/check constraint/i.test(m)) return 'Une valeur ne respecte pas le format attendu (longueur, lien en https://, etc.).';
  return m || 'Une erreur est survenue.';
}

/* =====================================================================
   Autres sections, sur les fonctions d'administration existantes
   ===================================================================== */
export interface DashboardStats {
  learners: number; enrollments: number; confirmed_payments: number;
  courses: { published: number; draft: number; archived: number; demo: number };
  orders: { total: number; paid: number; pending: number; failed: number; refunded: number };
  revenue: { currency: string; livemode: boolean; amount: number }[];
  top_courses: { course_id: string; title: string; sales: number }[];
  recent_activity: { id: number; action: string; entity_type: string; entity_id: string | null; created_at: string; actor_email: string | null }[];
}
export async function dashboardStats() { return ok(await supabase.rpc('admin_dashboard_stats')) as DashboardStats; }

export type Role = 'learner' | 'instructor' | 'admin' | 'support';
export interface AdminUser { id: string; email: string | null; first_name: string; last_name: string; status: 'pending' | 'active' | 'suspended'; created_at: string; roles: Role[] }
export async function listUsers(o: { search?: string; role?: Role | ''; status?: string; limit?: number; offset?: number }) {
  return ok(await supabase.rpc('admin_list_users', { p_search: o.search ?? '', p_role: o.role || null, p_status: o.status || null, p_limit: o.limit ?? 25, p_offset: o.offset ?? 0 })) as { total: number; items: AdminUser[] };
}
export async function setRole(userId: string, role: Role, grant: boolean) { ok(await supabase.rpc('admin_set_role', { p_user_id: userId, p_role: role, p_grant: grant })); }
export async function setAccountStatus(userId: string, status: 'active' | 'suspended', reason = '') { ok(await supabase.rpc('admin_set_account_status', { p_user_id: userId, p_status: status, p_reason: reason })); }
export async function grantEnrollment(userId: string, courseId: string) { ok(await supabase.rpc('admin_grant_enrollment', { p_user_id: userId, p_course_id: courseId })); }
export async function revokeEnrollment(enrollmentId: string) { ok(await supabase.rpc('admin_revoke_enrollment', { p_enrollment_id: enrollmentId })); }
export async function userEnrollments(userId: string) {
  return ok(await supabase.from('enrollments').select('id, status, source, created_at, courses(slug, course_translations(title, language))').eq('user_id', userId).order('created_at', { ascending: false })) as any[];
}

export interface EnrollmentRequest { id: string; status: string; user_id: string; student: string; email: string; course_id: string; course: string; amount: number; currency: string; payment_method: string; payment_reference: string; note: string; admin_message: string; created_at: string; reviewed_at: string | null }
export async function listEnrollmentRequests(status: string | null) { return (ok(await supabase.rpc('admin_list_enrollment_requests', { p_status: status })) ?? []) as EnrollmentRequest[]; }
export async function decideEnrollmentRequest(id: string, approve: boolean, message: string) { ok(await supabase.rpc('admin_decide_enrollment_request', { p_request_id: id, p_approve: approve, p_message: message })); }

export interface AdminApplication {
  id: string; status: string; fee_status: string; first_name: string; last_name: string; phone: string; country: string; city: string; education_level: string; motivation: string;
  admin_note: string; applicant_message: string; created_at: string; dossier_submitted_at: string | null; programme: string; documents: { kind: string; file_name: string; file_path: string }[];
}
export async function listApplications(status: string) {
  let q = supabase.from('programme_applications').select('id, status, fee_status, first_name, last_name, phone, country, city, education_level, motivation, admin_note, applicant_message, created_at, dossier_submitted_at, programmes(programme_translations(name, language)), application_documents(kind, file_name, file_path)').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const rows = ok(await q) as any[];
  return rows.map((r) => ({ ...r, programme: r.programmes?.programme_translations?.find((t: any) => t.language === 'fr')?.name ?? '—', documents: r.application_documents ?? [] })) as AdminApplication[];
}
export async function processApplication(id: string, action: string, message: string, note?: string) { ok(await supabase.rpc('admin_process_application', { p_application_id: id, p_action: action, p_message: message, p_note: note ?? null })); }
export async function documentUrl(path: string) {
  const { data, error } = await supabase.storage.from('admission-documents').createSignedUrl(path, 600);
  if (error) throw error; return data.signedUrl;
}

export async function listCertificates(search: string) {
  let q = supabase.from('certificates').select('id, code, learner_name, course_title, issued_at, status, revoked_reason, course_id').order('issued_at', { ascending: false }).limit(200);
  if (search) q = q.or(`code.ilike.%${search.replace(/[%,()]/g, '')}%,learner_name.ilike.%${search.replace(/[%,()]/g, '')}%`);
  return ok(await q) as { id: string; code: string; learner_name: string; course_title: string; issued_at: string; status: string; revoked_reason: string | null; course_id: string }[];
}
export async function setCertificateStatus(id: string, revoke: boolean, reason: string) { ok(await supabase.rpc('admin_set_certificate_status', { p_certificate_id: id, p_revoke: revoke, p_reason: reason || null })); }

export async function listMessages(status: string) {
  let q = supabase.from('contact_messages').select('id, created_at, name, email, subject, message, status, handled_at').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  return ok(await q) as { id: string; created_at: string; name: string; email: string; subject: string; message: string; status: 'new' | 'read' | 'archived'; handled_at: string | null }[];
}
export async function setMessageStatus(id: string, status: 'new' | 'read' | 'archived', userId: string) {
  ok(await supabase.from('contact_messages').update({ status, handled_by: status === 'new' ? null : userId, handled_at: status === 'new' ? null : new Date().toISOString() }).eq('id', id));
}

export const RPC_ERRORS: Record<string, string> = {
  invalid_transition: 'Cette action n’est pas possible à cette étape du dossier.',
  dossier_incomplete: 'Le dossier est incomplet : des pièces obligatoires manquent.',
  fee_not_confirmed: 'Les frais de dossier ne sont pas encore confirmés.',
  message_required: 'Un message à l’attention du candidat est obligatoire.',
  last_admin: 'Impossible : il doit rester au moins un administrateur.',
};
export function rpcError(e: unknown) {
  const m = (e as { message?: string })?.message ?? '';
  const k = Object.keys(RPC_ERRORS).find((x) => m.includes(x));
  return k ? RPC_ERRORS[k] : adminError(e);
}
