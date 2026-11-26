/**
 * Parcours apprenant : progression, contenu des leçons, quiz, devoirs et certificats.
 * Tout passe par les fonctions et les règles RLS existantes de la base :
 *  - record_lesson_progress : valide une leçon (pas les quiz ni les devoirs) et réévalue le certificat ;
 *  - get_quiz / submit_quiz_attempt : un quiz réussi valide sa leçon ;
 *  - save_assignment_draft / submit_assignment : la remise valide la leçon ;
 *  - issue_certificate : délivre le certificat si toutes les leçons sont terminées, le quiz final
 *    réussi et le nom du profil renseigné (sinon erreur criteria_not_met / profile_incomplete).
 */
import { supabase, storageUrl } from './supabase';

export interface LessonRef { id: string; title: string; type: string; duration_minutes: number; position: number; is_preview: boolean }
export interface ModuleRef { id: string; title: string; summary: string; position: number; lessons: LessonRef[] }
export interface LearnCourse { id: string; slug: string; title: string; certificate_enabled: boolean; modules: ModuleRef[] }

export async function getLearnCourse(slug: string): Promise<LearnCourse | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('id, slug, teaching_language, certificate_enabled, course_translations(title, language), modules(id, title, summary, position, is_published, lessons(id, title, type, duration_minutes, position, is_preview, is_published))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d: any = data;
  const t = d.course_translations?.find((x: any) => x.language === 'fr') ?? d.course_translations?.[0];
  return {
    id: d.id, slug: d.slug, title: t?.title ?? d.slug, certificate_enabled: d.certificate_enabled,
    modules: (d.modules ?? []).filter((m: any) => m.is_published).sort((a: any, b: any) => a.position - b.position)
      .map((m: any) => ({ ...m, lessons: (m.lessons ?? []).filter((l: any) => l.is_published).sort((a: any, b: any) => a.position - b.position) })),
  };
}

export async function getEnrollment(userId: string, courseId: string) {
  const { data, error } = await supabase.from('enrollments').select('id, status').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCompletedLessons(userId: string, courseId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('lesson_progress').select('lesson_id, completed_at').eq('user_id', userId).eq('course_id', courseId);
  if (error) throw error;
  return new Set((data ?? []).filter((r) => r.completed_at).map((r) => r.lesson_id as string));
}

export interface Progress { total_lessons: number; completed_lessons: number; percent: number; last_lesson_id: string | null }
export async function getProgress(courseId: string): Promise<Progress> {
  const { data, error } = await supabase.rpc('get_course_progress', { p_course_id: courseId });
  if (error) throw error;
  return data as Progress;
}

export interface LessonContent { body: string; video_provider: string | null; video_ref: string | null; document_path: string | null; external_url: string | null; media_path: string | null; resources: { title?: string; label?: string; url?: string; path?: string }[] }
export async function getLessonContent(lessonId: string): Promise<LessonContent | null> {
  const { data, error } = await supabase.from('lesson_contents').select('body, video_provider, video_ref, document_path, external_url, media_path, resources').eq('lesson_id', lessonId).maybeSingle();
  if (error) throw error;
  return data as LessonContent | null;
}

/** Lien temporaire vers un fichier privé du cours (bucket course-materials). */
export async function materialUrl(path: string): Promise<string> {
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await supabase.storage.from('course-materials').createSignedUrl(path, 3600);
  if (error) return storageUrl('course-materials', path);
  return data.signedUrl;
}

export async function completeLesson(lessonId: string): Promise<Progress> {
  const { data, error } = await supabase.rpc('record_lesson_progress', { p_lesson_id: lessonId, p_completed: true });
  if (error) throw error;
  return data as Progress;
}

export async function viewLesson(lessonId: string) {
  await supabase.rpc('record_lesson_progress', { p_lesson_id: lessonId, p_completed: false });
}

/* ---------- Quiz ---------- */
export interface QuizQuestion { id: string; kind: 'single' | 'multiple' | 'true_false' | 'short_answer'; prompt: string; options: { id: string; text: string }[] | null; allow_multiple: boolean; points: number }
export interface Quiz { id: string; title: string; pass_percent: number; max_attempts: number | null; is_final: boolean; attempts_used: number; best_score: number | null; passed: boolean; pending_review: boolean; questions: QuizQuestion[] }
export interface QuizResult { score_percent?: number; passed?: boolean; pending_review?: boolean; feedback?: { question_id: string; correct: boolean | null; correct_option_ids: string[] | null; explanation: string }[]; [k: string]: unknown }

export async function findQuiz(courseId: string, opts: { lessonId?: string; final?: boolean }): Promise<string | null> {
  let q = supabase.from('quizzes').select('id').eq('course_id', courseId);
  q = opts.lessonId ? q.eq('lesson_id', opts.lessonId) : q.eq('is_final', true).is('lesson_id', null);
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  return (data?.id as string) ?? null;
}
export async function getQuiz(id: string): Promise<Quiz> {
  const { data, error } = await supabase.rpc('get_quiz', { p_quiz_id: id });
  if (error) throw error;
  return data as Quiz;
}
export async function submitQuiz(id: string, answers: Record<string, string[] | string>): Promise<QuizResult> {
  const { data, error } = await supabase.rpc('submit_quiz_attempt', { p_quiz_id: id, p_answers: answers });
  if (error) throw error;
  return data as QuizResult;
}

/* ---------- Devoirs ---------- */
export interface Assignment { id: string; title: string; instructions: string; due_at: string | null; submission_types: string[]; max_file_mb: number }
export interface Submission { id: string; status: 'draft' | 'submitted' | 'graded'; body: string; file_name: string | null; submitted_at: string | null }
export async function getAssignment(lessonId: string): Promise<{ a: Assignment | null; s: Submission | null }> {
  const { data: a, error } = await supabase.from('assignments').select('id, title, instructions, due_at, submission_types, max_file_mb').eq('lesson_id', lessonId).maybeSingle();
  if (error) throw error;
  if (!a) return { a: null, s: null };
  const { data: s } = await supabase.from('assignment_submissions').select('id, status, body, file_name, submitted_at').eq('assignment_id', a.id).maybeSingle();
  return { a: a as Assignment, s: (s as Submission) ?? null };
}
export async function submitAssignment(assignmentId: string, userId: string, body: string, file?: File | null) {
  let path: string | null = null, name: string | null = null;
  if (file) {
    // Chemin attendu par les règles du bucket : <devoir>/<apprenant>/<fichier>
    path = `${assignmentId}/${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    const up = await supabase.storage.from('assignment-submissions').upload(path, file, { upsert: false });
    if (up.error) throw up.error;
    name = file.name;
  }
  const d = await supabase.rpc('save_assignment_draft', { p_assignment_id: assignmentId, p_body: body, p_file_path: path, p_file_name: name });
  if (d.error) throw d.error;
  const s = await supabase.rpc('submit_assignment', { p_assignment_id: assignmentId });
  if (s.error) throw s.error;
}

/* ---------- Certificats ---------- */
export interface Certificate { id: string; course_id: string; code: string; learner_name: string; course_title: string; issued_at: string; status: string }
export async function listMyCertificates(): Promise<Certificate[]> {
  const { data, error } = await supabase.from('certificates').select('id, course_id, code, learner_name, course_title, issued_at, status').order('issued_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Certificate[];
}
export async function issueCertificate(courseId: string): Promise<Certificate> {
  const { data, error } = await supabase.rpc('issue_certificate', { p_course_id: courseId });
  if (error) throw error;
  return data as Certificate;
}

/** PDF généré par la fonction serveur « certificate-pdf » (modèle des diplômes). Les certificats de formation utilisent lib/certificate.ts. */
export async function downloadCertificatePdf(code: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/certificate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ code, lang: 'fr' }),
  });
  if (!res.ok) throw new Error(`Le certificat n’a pas pu être généré (${res.status}).`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = `certificat-${code}.pdf`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const CERT_ERRORS: Record<string, string> = {
  criteria_not_met: 'Terminez toutes les leçons et réussissez l’examen final pour obtenir votre certificat.',
  profile_incomplete: 'Renseignez votre prénom et votre nom dans votre profil : ils seront imprimés sur le certificat.',
  certificate_disabled: 'Cette formation ne délivre pas de certificat.',
  certificate_revoked: 'Le certificat de cette formation a été révoqué. Contactez l’Académie.',
  forbidden: 'Vous devez être inscrit à cette formation.',
};
export const LEARN_ERRORS: Record<string, string> = {
  ...CERT_ERRORS,
  max_attempts_reached: 'Vous avez utilisé toutes vos tentatives pour ce quiz.',
  deadline_passed: 'La date limite de remise est dépassée.',
  submission_empty: 'Votre devoir est vide : rédigez une réponse ou joignez un fichier.',
  already_submitted: 'Ce devoir a déjà été remis.',
  lesson_requires_quiz: 'Cette leçon se valide en réussissant son quiz.',
  lesson_requires_submission: 'Cette leçon se valide en remettant le devoir.',
};
export function learnError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? '';
  const key = Object.keys(LEARN_ERRORS).find((k) => m.includes(k));
  return key ? LEARN_ERRORS[key] : m || 'Une erreur est survenue.';
}
