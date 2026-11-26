import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useAsync, usePageMeta } from '../../lib/hooks';
import { listCategoryOptions } from '../../lib/admin';
import type { Level } from '../../lib/api';
import { LEVEL_LABEL, PROGRAMME_LEVEL } from '../../lib/format';
import {
  listFaculties, myCourses, programmesOfFaculties, submitTeacherApplication, teacherCreateCourse, teacherError, teacherStatus,
  type TeacherKind, type TeacherStatus,
} from '../../lib/teacher';
import { ErrorNote } from '../../components/ui';
import { TeacherShell } from './TeacherShell';
import AdminFormationEdit from '../admin/AdminFormationEdit';

const APP_STATUS: Record<string, [string, string]> = { pending: ['En attente de validation', 'soon'], approved: ['Acceptée', 'open'], rejected: ['Non retenue', 'closed'], withdrawn: ['Retirée', 'closed'] };

function useTeacher() {
  const { session } = useAuth();
  return useAsync(() => (session ? teacherStatus(session.user.id) : Promise.resolve(null)), [session?.user.id]);
}

/* ============================================================ Accueil : mes cours, ou présentation + demande */
export default function Professeur() {
  usePageMeta('Espace professeur');
  const { session } = useAuth();
  const st = useTeacher();
  const courses = useAsync(() => (session && st.data?.isInstructor ? myCourses(session.user.id) : Promise.resolve([])), [session?.user.id, st.data?.isInstructor]);

  if (st.loading) return <TeacherShell title="Espace professeur"><div className="skeleton" /></TeacherShell>;
  if (st.error) return <TeacherShell title="Espace professeur"><ErrorNote error={st.error} /></TeacherShell>;
  const s = st.data!;

  if (!s.isInstructor) {
    const pending = s.applications.find((a) => a.status === 'pending');
    return (
      <TeacherShell title="Enseigner à l’Académie du Capital Humain">
        <p className="lede" style={{ marginTop: 0 }}>Partagez vos compétences avec les apprenants de l’ACH. Toute demande est étudiée et validée par l’administration de l’Académie.</p>
        {pending && <p className="alert" style={{ background: '#FFF7EA', borderLeft: '4px solid #E8A23A', margin: '0 0 20px' }}>Votre demande « {pending.kind === 'trainer' ? 'Formateur' : `Professeur, ${pending.faculty}`} » est en attente de validation. Vous serez prévenu de la décision.</p>}
        <div className="two-ways">
          <div className="way">
            <h3>Formateur</h3>
            <p>Créez des <b>formations courtes</b> dans votre domaine d’expertise : chapitres, quiz et activités.</p>
            <ul className="list-check"><li>Demande simple : domaine et expérience</li><li>CV facultatif</li><li>Cours publiés après relecture</li></ul>
            <Link className="btn btn-navy btn-sm" to="/professeur/candidature?type=trainer">Devenir formateur</Link>
          </div>
          <div className="way uni">
            <h3>Professeur d’université</h3>
            <p>Créez des <b>unités d’enseignement</b> pour les programmes d’une faculté (licences, masters, certificats universitaires).</p>
            <ul className="list-check"><li>Demande par faculté</li><li>CV obligatoire</li><li>Validation par l’administration</li></ul>
            <Link className="btn btn-red btn-sm" to="/professeur/candidature?type=university">Postuler comme professeur</Link>
          </div>
        </div>
      </TeacherShell>
    );
  }

  const STATUS = (c: { status: string; review_requested_at: string | null }) =>
    c.status === 'published' ? ['Publié', 'open'] : c.status === 'archived' ? ['Archivé', 'closed'] : c.review_requested_at ? ['Soumis pour relecture', 'soon'] : ['Brouillon', 'closed'];
  return (
    <TeacherShell title="Mes cours">
      <div className="teacher-head">
        <div className="th-badges">
          <span className="tag-demo">Formateur validé</span>
          {s.faculties.map((f) => <span key={f.id} className="tag-demo" style={{ borderColor: 'var(--navy-2)', color: 'var(--navy-2)' }}>Professeur · {f.name}</span>)}
        </div>
        <div className="btns">
          <Link className="btn btn-red" to="/professeur/cours/nouveau?type=court">+ Formation courte</Link>
          {s.faculties.length > 0 ? <Link className="btn btn-navy" to="/professeur/cours/nouveau?type=universitaire">+ Unité universitaire</Link>
            : <Link className="btn btn-outline" to="/professeur/candidature?type=university">Enseigner à l’université</Link>}
        </div>
      </div>
      {courses.loading ? <div className="skeleton" /> : courses.error ? <ErrorNote error={courses.error} /> : courses.data!.length === 0 ? (
        <div className="empty"><strong>Vous n’avez pas encore de cours.</strong>Créez votre première formation : elle restera en brouillon jusqu’à sa relecture par l’administration.</div>
      ) : (
        <ul className="admin-list">
          {courses.data!.map((c) => {
            const [l, tone] = STATUS(c);
            return (
              <li key={c.id}><Link to={`/professeur/cours/${c.id}`}>
                <div className="al-main"><b>{c.title}</b><small>{c.university ? 'Unité d’enseignement universitaire' : 'Formation courte'} · modifié le {new Date(c.updated_at).toLocaleDateString('fr-FR')}</small></div>
                <div className="al-side"><span className={`status ${tone}`}>{l}</span></div>
              </Link></li>
            );
          })}
        </ul>
      )}
    </TeacherShell>
  );
}

/* ============================================================ Demande pour enseigner */
export function ProfesseurCandidature() {
  usePageMeta('Enseigner à l’ACH');
  const { session } = useAuth();
  const [params] = useSearchParams();
  const st = useTeacher();
  const faculties = useAsync(listFaculties, []);
  const [reload, setReload] = useState(0);
  const [v, setV] = useState({ kind: (params.get('type') === 'university' ? 'university' : 'trainer') as TeacherKind, faculty_id: '', expertise: '', motivation: '' });
  const [cv, setCv] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const s: TeacherStatus | null = st.data ?? null;
  const apps = useAsync(() => (session ? teacherStatus(session.user.id).then((x) => x.applications) : Promise.resolve([])), [session?.user.id, reload]);
  const uni = v.kind === 'university';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.expertise.trim()) { setMsg({ ok: false, t: 'Indiquez votre domaine d’expertise.' }); return; }
    if (uni && !v.faculty_id) { setMsg({ ok: false, t: 'Choisissez la faculté.' }); return; }
    if (uni && !cv) { setMsg({ ok: false, t: 'Le CV est obligatoire pour enseigner à l’université.' }); return; }
    if (cv && !/\.(pdf|docx?|PDF|DOCX?)$/.test(cv.name)) { setMsg({ ok: false, t: 'Le CV doit être au format PDF ou Word.' }); return; }
    setBusy(true); setMsg(null);
    try {
      await submitTeacherApplication(session!.user.id, { kind: v.kind, faculty_id: uni ? v.faculty_id : null, expertise: v.expertise.trim(), motivation: v.motivation.trim(), cv });
      setMsg({ ok: true, t: 'Demande envoyée. L’administration de l’Académie va l’étudier ; vous serez prévenu de sa décision.' });
      setV({ ...v, expertise: '', motivation: '' }); setCv(null); setReload((n) => n + 1);
    } catch (e2) { setMsg({ ok: false, t: teacherError(e2) }); } finally { setBusy(false); }
  }

  return (
    <TeacherShell title="Demande pour enseigner" back={{ to: '/professeur', label: 'Espace professeur' }}>
      <div className="contact-grid" style={{ alignItems: 'start' }}>
        <form className="admin-form" onSubmit={onSubmit} noValidate style={{ maxWidth: 'none' }}>
          <section className="af-section">
            <h2><span>1</span>Type d’enseignement</h2>
            <div className="choice-cards" role="radiogroup" aria-label="Type d’enseignement">
              {([['trainer', 'Formateur', 'Formations courtes, CV facultatif'], ['university', 'Professeur d’université', 'Unités d’enseignement d’une faculté, CV obligatoire']] as [TeacherKind, string, string][]).map(([k, l, d]) => (
                <label key={k} className={`choice${v.kind === k ? ' on' : ''}`}><input type="radio" name="kind" checked={v.kind === k} onChange={() => setV({ ...v, kind: k })} /><b>{l}</b><small>{d}</small></label>
              ))}
            </div>
            {uni && (
              <div className="field"><label htmlFor="t-fac">Faculté <span className="req">*</span></label>
                <select id="t-fac" value={v.faculty_id} onChange={(e) => setV({ ...v, faculty_id: e.target.value })}><option value="">Choisir une faculté…</option>{(faculties.data ?? []).map((f) => <option key={f.id} value={f.id} disabled={s?.faculties.some((x) => x.id === f.id)}>{f.name}{s?.faculties.some((x) => x.id === f.id) ? ' (déjà admis)' : ''}</option>)}</select>
              </div>
            )}
          </section>
          <section className="af-section">
            <h2><span>2</span>Votre profil</h2>
            <div className="field"><label htmlFor="t-exp">Domaine d’expertise <span className="req">*</span></label><input id="t-exp" maxLength={300} value={v.expertise} onChange={(e) => setV({ ...v, expertise: e.target.value })} placeholder="Ex. Gestion de projets de développement, 10 ans d’expérience" /></div>
            <div className="field"><label htmlFor="t-mot">Motivation et expérience d’enseignement</label><textarea id="t-mot" maxLength={3000} value={v.motivation} onChange={(e) => setV({ ...v, motivation: e.target.value })} style={{ minHeight: 140 }} /><span className="hint">{v.motivation.length} / 3 000</span></div>
            <div className="field"><label htmlFor="t-cv">CV (PDF ou Word, 10 Mo maximum){uni && <span className="req"> *</span>}</label><input id="t-cv" type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />{cv && <span className="hint">{cv.name}</span>}</div>
          </section>
          {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
          <div className="af-actions"><button className="btn btn-red" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer ma demande'}</button></div>
        </form>

        <aside className="acc-card">
          <h2>Mes demandes</h2>
          {apps.loading ? <p className="hint">Chargement…</p> : (apps.data ?? []).length === 0 ? <p className="hint">Aucune demande pour l’instant.</p> : (
            <ul className="acc-certs">{apps.data!.map((a) => (
              <li key={a.id}><b>{a.kind === 'trainer' ? 'Formateur' : `Professeur · ${a.faculty}`}</b><small>{new Date(a.created_at).toLocaleDateString('fr-FR')} · <span className={`status ${APP_STATUS[a.status][1]}`}>{APP_STATUS[a.status][0]}</span></small>{a.admin_message && <p className="req-note" style={{ marginTop: 6 }}>{a.admin_message}</p>}</li>
            ))}</ul>
          )}
        </aside>
      </div>
    </TeacherShell>
  );
}

/* ============================================================ Nouveau cours */
export function ProfesseurNouveauCours() {
  usePageMeta('Nouveau cours');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const st = useTeacher();
  const cats = useAsync(listCategoryOptions, []);
  const facIds = st.data?.faculties.map((f) => f.id) ?? [];
  const progs = useAsync(() => programmesOfFaculties(facIds), [facIds.join(',')]);
  const [type, setType] = useState<'court' | 'universitaire'>(params.get('type') === 'universitaire' ? 'universitaire' : 'court');
  const [v, setV] = useState({ title: '', subtitle: '', short_description: '', category_id: '', level: 'beginner' as Level, hours: '10', parts: 'Introduction\n', programme_id: '', semester: '1', credits: '3' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  if (st.loading) return <TeacherShell title="Nouveau cours"><div className="skeleton" /></TeacherShell>;
  if (!st.data?.isInstructor) return <TeacherShell title="Nouveau cours"><p className="alert err">La création de cours est réservée aux formateurs validés. <Link to="/professeur/candidature">Faire une demande</Link></p></TeacherShell>;
  const uni = type === 'universitaire';
  const canUni = (st.data?.faculties.length ?? 0) > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) { setErr('Le titre est obligatoire.'); return; }
    if (uni && !v.programme_id) { setErr('Choisissez le programme.'); return; }
    setBusy(true); setErr('');
    try {
      const id = await teacherCreateCourse({
        title: v.title.trim(), subtitle: v.subtitle.trim(), short_description: v.short_description.trim(), category_id: v.category_id || null, level: v.level,
        duration_minutes: Math.round(parseFloat(v.hours.replace(',', '.') || '0') * 60), parts: v.parts.split('\n').map((x) => x.trim()).filter(Boolean),
        ...(uni ? { programme_id: v.programme_id, semester: parseInt(v.semester, 10), credits: parseInt(v.credits || '0', 10) } : {}),
      });
      navigate(`/professeur/cours/${id}?onglet=plan`);
    } catch (e2) { setErr(teacherError(e2)); setBusy(false); }
  }

  return (
    <TeacherShell title="Nouveau cours" back={{ to: '/professeur', label: 'Mes cours' }}>
      <form className="admin-form" onSubmit={onSubmit} noValidate>
        <section className="af-section">
          <h2><span>1</span>Type de cours</h2>
          <div className="choice-cards" role="radiogroup" aria-label="Type de cours">
            <label className={`choice${!uni ? ' on' : ''}`}><input type="radio" name="type" checked={!uni} onChange={() => setType('court')} /><b>Formation courte</b><small>Publiée dans le catalogue des formations</small></label>
            <label className={`choice${uni ? ' on' : ''}${canUni ? '' : ' off'}`}><input type="radio" name="type" checked={uni} disabled={!canUni} onChange={() => setType('universitaire')} /><b>Unité universitaire</b><small>{canUni ? 'Rattachée à un programme de votre faculté' : 'Réservée aux professeurs admis dans une faculté'}</small></label>
          </div>
          {uni && (
            <div className="row3">
              <div className="field"><label htmlFor="c-prog">Programme <span className="req">*</span></label><select id="c-prog" value={v.programme_id} onChange={set('programme_id')}><option value="">Choisir…</option>{(progs.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({PROGRAMME_LEVEL[p.level] ?? p.level})</option>)}</select></div>
              <div className="field"><label htmlFor="c-sem">Semestre</label><select id="c-sem" value={v.semester} onChange={set('semester')}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Semestre {i + 1}</option>)}</select></div>
              <div className="field"><label htmlFor="c-cr">Crédits</label><input id="c-cr" inputMode="numeric" value={v.credits} onChange={(e) => setV({ ...v, credits: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></div>
            </div>
          )}
        </section>
        <section className="af-section">
          <h2><span>2</span>L’essentiel</h2>
          <div className="field"><label htmlFor="c-title">Titre <span className="req">*</span></label><input id="c-title" maxLength={200} value={v.title} onChange={set('title')} /></div>
          <div className="field"><label htmlFor="c-sub">Accroche</label><input id="c-sub" maxLength={300} value={v.subtitle} onChange={set('subtitle')} /></div>
          <div className="field"><label htmlFor="c-short">Résumé</label><textarea id="c-short" maxLength={500} value={v.short_description} onChange={set('short_description')} style={{ minHeight: 90 }} /></div>
          <div className="row3">
            <div className="field"><label htmlFor="c-cat">Domaine</label><select id="c-cat" value={v.category_id} onChange={set('category_id')}><option value="">Choisir…</option>{(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="field"><label htmlFor="c-lvl">Niveau</label><select id="c-lvl" value={v.level} onChange={set('level')}>{(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}</select></div>
            <div className="field"><label htmlFor="c-h">Durée (heures)</label><input id="c-h" inputMode="decimal" value={v.hours} onChange={set('hours')} /></div>
          </div>
        </section>
        <section className="af-section">
          <h2><span>3</span>Les parties du cours</h2>
          <div className="field"><label htmlFor="c-parts">Une partie par ligne</label><textarea id="c-parts" value={v.parts} onChange={set('parts')} style={{ minHeight: 110 }} /></div>
        </section>
        {err && <p className="alert err" role="alert">{err}</p>}
        <div className="af-actions"><Link className="btn btn-outline" to="/professeur">Annuler</Link><button className="btn btn-red" disabled={busy}>{busy ? 'Création…' : 'Créer le brouillon'}</button></div>
      </form>
    </TeacherShell>
  );
}

/* ============================================================ Édition d'un cours (même éditeur que l'admin) */
export function ProfesseurCours() { return <AdminFormationEdit mode="teacher" />; }
