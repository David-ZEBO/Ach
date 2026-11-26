import { supabase } from './supabase';

export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface CourseSummary {
  id: string;
  slug: string;
  category_slug: string | null;
  level: Level;
  teaching_language: string;
  price_amount: number;
  currency: string;
  duration_minutes: number;
  cover_path: string | null;
  is_featured: boolean;
  is_demo: boolean;
  title: string;
  subtitle: string;
  short_description: string;
  lesson_count: number;
  total_count: number;
}

export interface Category { slug: string; name: string; description: string }

export interface CourseDetail {
  id: string;
  slug: string;
  level: Level;
  price_amount: number;
  currency: string;
  duration_minutes: number;
  cover_path: string | null;
  instructor_name: string | null;
  certificate_enabled: boolean;
  category: Category | null;
  t: {
    title: string; subtitle: string; short_description: string; description: string;
    objectives: string[]; audience: string[]; prerequisites: string[]; instructor_bio: string;
  } | null;
  modules: { id: string; title: string; summary: string; position: number; lessons: { id: string; title: string; duration_minutes: number; is_preview: boolean; position: number }[] }[];
  /** Non vide si le cours est une unité d'enseignement d'un ou plusieurs programmes universitaires. */
  programmes: { slug: string; name: string; semester: number; credits: number }[];
}

export interface FaqItem { id: string; question: string; answer: string }

/**
 * Toutes les formations publiées sont publiques, y compris celles marquées is_demo (choix de l'ACH).
 * Passer à false pour masquer les formations de démonstration du site public.
 */
export const SHOW_DEMO_COURSES = true;

/**
 * Un cours rattaché à un programme (table programme_units) est une unité d'enseignement universitaire :
 * la base refuse l'inscription directe (private.is_university_course). Il n'apparaît donc pas dans le
 * catalogue des formations, mais dans la maquette de son programme.
 */
let unitIdsPromise: Promise<Set<string>> | null = null;
export function universityCourseIds(): Promise<Set<string>> {
  unitIdsPromise ??= (async () => {
    const { data, error } = await supabase.from('programme_units').select('course_id');
    if (error) { unitIdsPromise = null; throw error; }
    return new Set((data ?? []).map((r) => r.course_id as string));
  })();
  return unitIdsPromise;
}

/** Catalogue des formations (hors unités d'enseignement des programmes universitaires). */
export async function searchCourses(opts: { query?: string; category?: string; level?: Level; limit?: number; offset?: number } = {}) {
  const [res, units] = await Promise.all([
    supabase.rpc('catalog_search', {
      p_lang: 'fr',
      p_query: opts.query || null,
      p_category: opts.category || null,
      p_level: opts.level || null,
      p_limit: 100,
      p_offset: 0,
    }),
    universityCourseIds(),
  ]);
  if (res.error) throw res.error;
  const rows = ((res.data ?? []) as CourseSummary[]).filter((c) => !units.has(c.id) && (SHOW_DEMO_COURSES || !c.is_demo));
  const offset = opts.offset ?? 0;
  return rows.slice(offset, offset + (opts.limit ?? 48));
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('slug, position, category_translations(name, description, language)')
    .eq('is_active', true)
    .order('position');
  if (error) throw error;
  return (data ?? []).map((c: any) => {
    const t = (c.category_translations ?? []).find((x: any) => x.language === 'fr') ?? c.category_translations?.[0];
    return { slug: c.slug, name: t?.name ?? c.slug, description: t?.description ?? '' };
  });
}

export async function getCourse(slug: string): Promise<CourseDetail | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(`id, slug, level, price_amount, currency, duration_minutes, cover_path, instructor_name, certificate_enabled, is_demo,
      categories(slug, category_translations(name, description, language)),
      course_translations(language, title, subtitle, short_description, description, objectives, audience, prerequisites, instructor_bio),
      modules(id, title, summary, position, is_published, lessons(id, title, duration_minutes, is_preview, position, is_published))`)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d: any = data;
  if (d.is_demo && !SHOW_DEMO_COURSES) return null;
  // Programmes dont ce cours est une unité d'enseignement (inscription via candidature, pas en direct).
  const { data: units } = await supabase
    .from('programme_units')
    .select('semester, credits, programmes(slug, programme_translations(name, language))')
    .eq('course_id', d.id);
  d.programmes = (units ?? []).map((u: any) => ({
    slug: u.programmes?.slug,
    name: u.programmes?.programme_translations?.find((x: any) => x.language === 'fr')?.name ?? u.programmes?.slug,
    semester: u.semester, credits: u.credits,
  })).filter((p: any) => p.slug);
  const ct = d.categories?.category_translations?.find((x: any) => x.language === 'fr');
  const t = d.course_translations?.find((x: any) => x.language === 'fr') ?? d.course_translations?.[0] ?? null;
  return {
    ...d,
    category: d.categories ? { slug: d.categories.slug, name: ct?.name ?? d.categories.slug, description: ct?.description ?? '' } : null,
    t,
    modules: (d.modules ?? [])
      .filter((m: any) => m.is_published)
      .sort((a: any, b: any) => a.position - b.position)
      .map((m: any) => ({ ...m, lessons: (m.lessons ?? []).filter((l: any) => l.is_published).sort((a: any, b: any) => a.position - b.position) })),
  };
}

export async function listFaq(): Promise<FaqItem[]> {
  const { data, error } = await supabase
    .from('faq_items')
    .select('id, position, faq_item_translations(question, answer, language)')
    .eq('is_published', true)
    .order('position');
  if (error) throw error;
  return (data ?? []).flatMap((f: any) => {
    const t = f.faq_item_translations?.find((x: any) => x.language === 'fr');
    return t ? [{ id: f.id, question: t.question, answer: t.answer }] : [];
  });
}

/** Paramètres publics administrables (table site_settings, is_public = true). */
export async function getPublicSettings(prefix: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('site_settings').select('key, value').like('key', `${prefix}%`);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export type ContactSubject = 'course' | 'enrollment' | 'organization' | 'other';

/** Fonction existante côté base, ouverte aux visiteurs (contrôles et limites faits en SQL). */
export async function submitContact(input: { name: string; email: string; subject: ContactSubject; message: string }) {
  const { error } = await supabase.rpc('submit_contact_message', {
    p_name: input.name, p_email: input.email, p_subject: input.subject, p_message: input.message, p_language: 'fr',
  });
  if (error) throw error;
}

export type ProgrammeLevel = 'certificate' | 'bachelor' | 'master' | 'doctorate';
export type ProgrammeStatus = 'planned' | 'open' | 'closed';

export interface Programme {
  id: string; slug: string; level: ProgrammeLevel; status: ProgrammeStatus; duration_months: number | null;
  name: string; summary: string; faculty: string; faculty_slug: string; is_demo: boolean; is_provisional: boolean;
}

/** Règle de la base (private.programme_accepts_applications) : candidature possible tant que le programme n'est pas fermé. */
export const acceptsApplications = (p: { status: ProgrammeStatus }) => p.status !== 'closed';

const PROG_BASE = 'id, slug, level, status, duration_months, position, is_demo, is_provisional, programme_translations(name, summary, description, language)';
const PROG_FIELDS = `${PROG_BASE}, faculties(slug, faculty_translations(name, language))`;
const fr = (arr: any[] | undefined) => arr?.find((x: any) => x.language === 'fr') ?? arr?.[0];

function toProgramme(p: any): Programme {
  const t = fr(p.programme_translations);
  return {
    id: p.id, slug: p.slug, level: p.level, status: p.status, duration_months: p.duration_months, is_demo: p.is_demo, is_provisional: p.is_provisional,
    name: t?.name ?? p.slug, summary: t?.summary ?? '', faculty: fr(p.faculties?.faculty_translations)?.name ?? '', faculty_slug: p.faculties?.slug ?? '',
  };
}

export async function listProgrammes(): Promise<Programme[]> {
  const { data, error } = await supabase.from('programmes').select(PROG_FIELDS).eq('is_published', true).order('position');
  if (error) throw error;
  return (data ?? []).map(toProgramme);
}

export interface Faculty { id: string; slug: string; name: string; tagline: string; description: string; image_path: string | null; is_provisional: boolean; programmes: Programme[] }

export async function listFaculties(): Promise<Faculty[]> {
  const [fac, progs] = await Promise.all([
    supabase.from('faculties').select('id, slug, image_path, is_provisional, position, faculty_translations(name, tagline, description, language)').eq('is_published', true).order('position'),
    listProgrammes(),
  ]);
  if (fac.error) throw fac.error;
  return (fac.data ?? []).map((f: any) => {
    const t = fr(f.faculty_translations);
    return { id: f.id, slug: f.slug, image_path: f.image_path, is_provisional: f.is_provisional, name: t?.name ?? f.slug, tagline: t?.tagline ?? '', description: t?.description ?? '', programmes: progs.filter((p) => p.faculty_slug === f.slug) };
  });
}

export interface ProgrammeDetail extends Programme {
  description: string; teaching_language: string; authorization_reference: string | null;
  application_fee_amount: number; application_fee_currency: string; application_fee_instructions: string; required_documents: string[];
  faculty_tagline: string;
  units: { semester: number; position: number; credits: number; is_mandatory: boolean; course_slug: string; title: string; duration_minutes: number }[];
}

export async function getProgramme(slug: string): Promise<ProgrammeDetail | null> {
  const { data, error } = await supabase
    .from('programmes')
    .select(`${PROG_BASE}, teaching_language, authorization_reference, application_fee_amount, application_fee_currency, application_fee_instructions, required_documents,
      faculties(slug, faculty_translations(name, tagline, language)),
      programme_units(semester, position, credits, is_mandatory, courses(slug, duration_minutes, course_translations(title, language)))`)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p: any = data;
  return {
    ...toProgramme(p),
    description: fr(p.programme_translations)?.description ?? '',
    faculty_tagline: fr(p.faculties?.faculty_translations)?.tagline ?? '',
    teaching_language: p.teaching_language, authorization_reference: p.authorization_reference,
    application_fee_amount: p.application_fee_amount, application_fee_currency: p.application_fee_currency,
    application_fee_instructions: p.application_fee_instructions, required_documents: p.required_documents ?? [],
    units: (p.programme_units ?? [])
      .map((u: any) => ({ semester: u.semester, position: u.position, credits: u.credits, is_mandatory: u.is_mandatory, course_slug: u.courses?.slug, title: fr(u.courses?.course_translations)?.title ?? u.courses?.slug ?? 'Unité d’enseignement', duration_minutes: u.courses?.duration_minutes ?? 0 }))
      .sort((a: any, b: any) => a.semester - b.semester || a.position - b.position),
  };
}

export type EducationLevel = 'secondary' | 'bac' | 'bachelor' | 'master' | 'doctorate' | 'other';

/** Dépôt de candidature : mêmes colonnes et mêmes règles RLS que le système existant. */
export async function submitApplication(input: {
  programme_id: string; first_name: string; last_name: string; phone: string; country: string; city: string;
  education_level: EducationLevel; motivation: string;
}) {
  const { data, error } = await supabase.from('programme_applications').insert(input).select('id').single();
  if (error) throw error;
  return data;
}

export async function enrollFreeCourse(courseId: string) {
  const { error } = await supabase.rpc('enroll_free_course', { p_course_id: courseId });
  if (error) throw error;
}

export async function verifyCode(code: string) {
  const fn = /^ACH-DIP-/i.test(code) ? 'verify_diploma' : 'verify_certificate';
  const { data, error } = await supabase.rpc(fn, { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  return data as Record<string, unknown> | null;
}
