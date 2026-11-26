import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  addLesson, addModule, adminError, CHAPTER_TYPES, deleteLesson, deleteModule, getAdminCourse, getContent, listCategoryOptions, loadAssignmentEdit,
  loadQuizEdit, reorderLessons, reorderModules, saveAssignmentEdit, saveContent, saveQuizEdit, saveTranslation, updateCourse, updateLesson, updateModule,
  uploadCover, uploadMaterial, type AdminCourse, type AdminLesson, type AssignmentEdit, type ContentForm, type QEdit, type QKind, type QuizEdit,
} from '../../lib/admin';
import type { Level } from '../../lib/api';
import { LEVEL_LABEL } from '../../lib/format';
import { coverImage } from '../../lib/images';
import { useAsync, usePageMeta } from '../../lib/hooks';
import { ErrorNote } from '../../components/ui';
import { AdminShell } from './AdminShell';
import { TeacherShell } from '../professeur/TeacherShell';
import { submitForReview, teacherError, teacherUpdateCourse } from '../../lib/teacher';

export type EditorMode = 'admin' | 'teacher';

type Tab = 'presentation' | 'plan' | 'publication';
type Editing = { kind: 'lesson'; lesson: AdminLesson } | { kind: 'final' } | null;

export default function AdminFormationEdit({ mode = 'admin' }: { mode?: EditorMode }) {
  const Shell = mode === 'admin' ? AdminShell : TeacherShell;
  const back = mode === 'admin' ? { to: '/admin/formations', label: 'Formations' } : { to: '/professeur', label: 'Mes cours' };
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('onglet') as Tab) || 'presentation';
  const [reload, setReload] = useState(0);
  const course = useAsync(() => getAdminCourse(id), [id, reload]);
  const refresh = () => setReload((n) => n + 1);
  usePageMeta(course.data ? `${course.data.t.title} · Administration` : 'Formation · Administration');

  if (course.loading && !course.data) return <Shell title="Formation"><div className="skeleton" /></Shell>;
  if (course.error) return <Shell title="Formation"><ErrorNote error={course.error} /></Shell>;
  if (!course.data) return <Shell title="Formation introuvable" back={back}><p>Cette formation n’existe pas ou ne vous est pas attribuée.</p></Shell>;
  const c = course.data;

  return (
    <Shell title={c.t.title || 'Sans titre'} back={back}>
      <div className="admin-tabs" role="tablist">
        {([['presentation', 'Présentation'], ['plan', 'Plan du cours'], ['publication', 'Publication']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams({ onglet: k })}>{l}</button>
        ))}
        <span className={`status ${c.status === 'published' ? 'open' : c.status === 'draft' ? 'soon' : 'closed'}`} style={{ marginLeft: 'auto' }}>{c.status === 'published' ? 'Publiée' : c.status === 'draft' ? (c.review_requested_at ? 'Soumise pour relecture' : 'Brouillon') : 'Archivée'}</span>
        {c.isUniversity && <Link className="btn btn-navy btn-sm" to={`/apprendre/${c.slug}?espace=classe`}>Salle virtuelle</Link>}
        <Link className="btn btn-outline btn-sm" to={`/formations/${c.slug}`} target="_blank">Voir la page</Link>
      </div>
      {tab === 'presentation' && <PresentationTab c={c} onSaved={refresh} mode={mode} />}
      {tab === 'plan' && <PlanTab c={c} onChange={refresh} />}
      {tab === 'publication' && (mode === 'admin' ? <PublicationTab c={c} onSaved={refresh} /> : <SubmitTab c={c} onSaved={refresh} />)}
    </Shell>
  );
}

/* =============================================================== Présentation */
function lines(a: string[]) { return a.join('\n'); }
function unlines(s: string) { return s.split('\n').map((x) => x.trim()).filter(Boolean); }

function PresentationTab({ c, onSaved, mode }: { c: AdminCourse; onSaved: () => void; mode: EditorMode }) {
  const teacher = mode === 'teacher';
  const locked = teacher && c.status !== 'draft';
  const cats = useAsync(listCategoryOptions, []);
  const [t, setT] = useState({ ...c.t, objectives: lines(c.t.objectives), audience: lines(c.t.audience), prerequisites: lines(c.t.prerequisites) });
  const [f, setF] = useState({ category_id: c.category_id ?? '', level: c.level, price: String(c.price_amount / 100), currency: c.currency, hours: String(Math.round((c.duration_minutes / 60) * 10) / 10), certificate_enabled: c.certificate_enabled, cover_path: c.cover_path, instructor_name: c.instructor_name ?? '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const st = (k: keyof typeof t) => (e: { target: { value: string } }) => setT({ ...t, [k]: e.target.value });
  const sf = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function cover(file?: File | null) {
    if (!file) return;
    setBusy(true); setMsg(null);
    try { setF({ ...f, cover_path: await uploadCover(c.id, file) }); } catch (e) { setMsg({ ok: false, t: adminError(e) }); } finally { setBusy(false); }
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!t.title.trim()) { setMsg({ ok: false, t: 'Le titre est obligatoire.' }); return; }
    setBusy(true); setMsg(null);
    try {
      await saveTranslation(c.id, { title: t.title.trim(), subtitle: t.subtitle.trim(), short_description: t.short_description.trim(), description: t.description, objectives: unlines(t.objectives), audience: unlines(t.audience), prerequisites: unlines(t.prerequisites), instructor_bio: t.instructor_bio });
      if (teacher) {
        if (!locked) await teacherUpdateCourse(c.id, { category_id: f.category_id || null, level: f.level as Level, duration_minutes: Math.round(parseFloat(f.hours.replace(',', '.') || '0') * 60), cover_path: f.cover_path, instructor_name: f.instructor_name.trim() || null });
      } else await updateCourse(c.id, { category_id: f.category_id || null, level: f.level as Level, price_amount: Math.round(parseFloat(f.price.replace(',', '.') || '0') * 100), currency: f.currency, duration_minutes: Math.round(parseFloat(f.hours.replace(',', '.') || '0') * 60), certificate_enabled: f.certificate_enabled, cover_path: f.cover_path, instructor_name: f.instructor_name.trim() || null });
      setMsg({ ok: true, t: 'Présentation enregistrée.' }); onSaved();
    } catch (e2) { setMsg({ ok: false, t: teacher ? teacherError(e2) : adminError(e2) }); } finally { setBusy(false); }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit} noValidate>
      {locked && <p className="alert" style={{ background: 'var(--soft)', borderLeft: '4px solid var(--navy)' }}>Ce cours est publié : vous pouvez modifier les textes et le contenu ; les caractéristiques (domaine, niveau, durée, couverture) sont gérées par l’administration.</p>}
      <section className="af-section">
        <h2><span>1</span>Présentation</h2>
        <div className="field"><label htmlFor="p-title">Titre <span className="req">*</span></label><input id="p-title" maxLength={200} value={t.title} onChange={st('title')} /></div>
        <div className="field"><label htmlFor="p-sub">Accroche</label><input id="p-sub" maxLength={300} value={t.subtitle} onChange={st('subtitle')} /></div>
        <div className="field"><label htmlFor="p-short">Résumé (carte du catalogue)</label><textarea id="p-short" maxLength={500} value={t.short_description} onChange={st('short_description')} style={{ minHeight: 90 }} /><span className="hint">{t.short_description.length} / 500</span></div>
        <div className="field"><label htmlFor="p-desc">Présentation détaillée</label><textarea id="p-desc" maxLength={20000} value={t.description} onChange={st('description')} style={{ minHeight: 220 }} /><span className="hint">Séparez les paragraphes par une ligne vide.</span></div>
      </section>
      <section className="af-section">
        <h2><span>2</span>Objectifs et public</h2>
        <div className="field"><label htmlFor="p-obj">Objectifs (un par ligne)</label><textarea id="p-obj" value={t.objectives} onChange={st('objectives')} style={{ minHeight: 120 }} /></div>
        <div className="row2">
          <div className="field"><label htmlFor="p-aud">Public cible (un par ligne)</label><textarea id="p-aud" value={t.audience} onChange={st('audience')} /></div>
          <div className="field"><label htmlFor="p-pre">Prérequis (un par ligne)</label><textarea id="p-pre" value={t.prerequisites} onChange={st('prerequisites')} /></div>
        </div>
        <div className="field"><label htmlFor="p-ins">Formateur</label><input id="p-ins" maxLength={120} value={f.instructor_name} onChange={(e) => setF({ ...f, instructor_name: e.target.value })} placeholder="Ex. Dr Jean Kabongo" /><span className="hint">Affiché sur la fiche de la formation et signé à gauche sur le certificat.</span></div>
        <div className="field"><label htmlFor="p-bio">Présentation du formateur</label><textarea id="p-bio" maxLength={3000} value={t.instructor_bio} onChange={st('instructor_bio')} style={{ minHeight: 90 }} /></div>
      </section>
      <section className="af-section">
        <h2><span>3</span>Caractéristiques</h2>
        <div className="row2">
          <div className="field"><label htmlFor="p-cat">Domaine</label><select id="p-cat" value={f.category_id} onChange={sf('category_id')}><option value="">Aucun</option>{(cats.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          <div className="field"><label htmlFor="p-lvl">Niveau</label><select id="p-lvl" value={f.level} onChange={sf('level')}>{(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}</select></div>
        </div>
        <div className="row2">
          {!teacher && <div className="field"><label htmlFor="p-price">Prix</label><div className="input-group"><input id="p-price" inputMode="decimal" value={f.price} onChange={sf('price')} /><select aria-label="Devise" value={f.currency} onChange={sf('currency')}><option>USD</option><option>CDF</option><option>EUR</option></select></div><span className="hint">0 = gratuite (inscription directe en un clic)</span></div>}
          <div className="field"><label htmlFor="p-h">Durée (heures)</label><input id="p-h" inputMode="decimal" value={f.hours} onChange={sf('hours')} /></div>
        </div>
        {!teacher && <label className="check"><input type="checkbox" checked={f.certificate_enabled} onChange={(e) => setF({ ...f, certificate_enabled: e.target.checked })} /> <span>Délivrer un certificat de réussite</span></label>}
        {teacher && <p className="hint">Le prix et la délivrance du certificat sont fixés par l’administration lors de la publication.</p>}
        <div className="field">
          <label htmlFor="p-cover">Image de couverture</label>
          <div className="img-row"><img src={coverImage(f.cover_path)} alt="" style={{ height: 72 }} /><input id="p-cover" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => cover(e.target.files?.[0])} /></div>
          <span className="hint">Format paysage conseillé (1600 × 1000 px).</span>
        </div>
      </section>
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
      <div className="af-actions sticky"><button className="btn btn-red" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer la présentation'}</button></div>
    </form>
  );
}

/* =============================================================== Plan du cours */
const KIND_LABEL = (l: AdminLesson) => (l.type === 'quiz' ? 'Quiz' : l.type === 'assignment' ? 'Activité' : CHAPTER_TYPES.find((x) => x.v === l.type)?.l ?? l.type);

function PlanTab({ c, onChange }: { c: AdminCourse; onChange: () => void }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [err, setErr] = useState('');
  const [newPart, setNewPart] = useState('');
  const run = async (fn: () => Promise<unknown>) => { setErr(''); try { await fn(); onChange(); } catch (e) { setErr(adminError(e)); } };
  const moveModule = (i: number, d: number) => run(() => { const ids = c.modules.map((m) => m.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; return reorderModules(c.id, ids); });
  const moveLesson = (mi: number, li: number, d: number) => run(() => { const m = c.modules[mi]; const ids = m.lessons.map((l) => l.id); [ids[li], ids[li + d]] = [ids[li + d], ids[li]]; return reorderLessons(m.id, ids); });
  const nextPos = (arr: { position: number }[]) => (arr.length ? Math.max(...arr.map((x) => x.position)) + 1 : 0);
  async function add(mi: number, kind: 'chapter' | 'quiz' | 'assignment') {
    const m = c.modules[mi];
    const title = kind === 'quiz' ? `Quiz : ${m.title}` : kind === 'assignment' ? 'Nouvelle activité' : 'Nouveau chapitre';
    setErr('');
    try {
      const r = await addLesson(c.id, m.id, title, kind === 'chapter' ? 'text' : kind, nextPos(m.lessons));
      onChange();
      setEditing({ kind: 'lesson', lesson: { id: r.id, module_id: m.id, title, type: kind === 'chapter' ? 'text' : kind, position: nextPos(m.lessons), duration_minutes: 0, is_preview: false, is_published: true } });
    } catch (e) { setErr(adminError(e)); }
  }

  return (
    <div className="plan">
      <p className="lede" style={{ marginTop: 0 }}>Organisez le cours en <b>parties</b>. Chaque partie contient des <b>chapitres</b> (numérotés automatiquement 1.1, 1.2…), et peut se terminer par un <b>quiz</b> ou une <b>activité</b>. Le certificat est délivré quand l’apprenant a tout terminé et réussi le quiz final.</p>
      {err && <p className="alert err" role="alert">{err}</p>}
      {c.modules.map((m, mi) => {
        let n = 0;
        return (
          <section key={m.id} className={`plan-part${m.is_published ? '' : ' hidden-item'}`}>
            <header>
              <span className="pp-num">Partie {mi + 1}</span>
              <InlineTitle value={m.title} onSave={(title) => run(() => updateModule(m.id, { title }))} />
              <div className="pp-tools">
                <button className="icon-btn" title="Monter" disabled={mi === 0} onClick={() => moveModule(mi, -1)}>↑</button>
                <button className="icon-btn" title="Descendre" disabled={mi === c.modules.length - 1} onClick={() => moveModule(mi, 1)}>↓</button>
                <button className="icon-btn" title={m.is_published ? 'Masquer' : 'Afficher'} onClick={() => run(() => updateModule(m.id, { is_published: !m.is_published }))}>{m.is_published ? '◉' : '○'}</button>
                <ConfirmButton label="Supprimer" onConfirm={() => run(() => deleteModule(m.id))} />
              </div>
            </header>
            <ol className="plan-items">
              {m.lessons.map((l, li) => {
                const isChapter = l.type !== 'quiz' && l.type !== 'assignment';
                if (isChapter) n++;
                return (
                  <li key={l.id} className={`plan-item ${l.type === 'quiz' ? 'quiz' : l.type === 'assignment' ? 'activity' : 'chapter'}${l.is_published ? '' : ' hidden-item'}`}>
                    <span className="pi-num">{isChapter ? `${mi + 1}.${n}` : l.type === 'quiz' ? '?' : '✎'}</span>
                    <button className="pi-title" onClick={() => setEditing({ kind: 'lesson', lesson: l })}><b>{l.title}</b><small>{KIND_LABEL(l)}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ''}{l.is_preview ? ' · Aperçu gratuit' : ''}{l.is_published ? '' : ' · Masqué'}</small></button>
                    <div className="pp-tools">
                      <button className="icon-btn" title="Monter" disabled={li === 0} onClick={() => moveLesson(mi, li, -1)}>↑</button>
                      <button className="icon-btn" title="Descendre" disabled={li === m.lessons.length - 1} onClick={() => moveLesson(mi, li, 1)}>↓</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditing({ kind: 'lesson', lesson: l })}>Modifier</button>
                    </div>
                  </li>
                );
              })}
              {m.lessons.length === 0 && <li className="plan-empty">Aucun élément dans cette partie.</li>}
            </ol>
            <div className="plan-add">
              <button className="btn btn-outline btn-sm" onClick={() => add(mi, 'chapter')}>+ Chapitre</button>
              <button className="btn btn-outline btn-sm" onClick={() => add(mi, 'quiz')}>+ Quiz</button>
              <button className="btn btn-outline btn-sm" onClick={() => add(mi, 'assignment')}>+ Activité</button>
            </div>
          </section>
        );
      })}
      <form className="plan-newpart" onSubmit={(e) => { e.preventDefault(); if (newPart.trim()) run(() => addModule(c.id, newPart.trim(), nextPos(c.modules))).then(() => setNewPart('')); }}>
        <div className="field"><label htmlFor="np">Nouvelle partie</label><input id="np" maxLength={200} value={newPart} onChange={(e) => setNewPart(e.target.value)} placeholder="Titre de la partie" /></div>
        <button className="btn btn-navy" disabled={!newPart.trim()}>+ Ajouter la partie</button>
      </form>

      <section className="plan-part final">
        <header><span className="pp-num">Fin du cours</span><b className="pp-title-static">Quiz final</b>
          <div className="pp-tools"><button className="btn btn-red btn-sm" onClick={() => setEditing({ kind: 'final' })}>{c.finalQuizId ? 'Modifier le quiz final' : 'Créer le quiz final'}</button></div>
        </header>
        <p className="plan-empty" style={{ margin: 0 }}>{c.finalQuizId ? 'Le quiz final doit être réussi pour obtenir le certificat.' : 'Facultatif. S’il existe, sa réussite est exigée pour le certificat.'}</p>
      </section>

      {editing && (
        <Drawer title={editing.kind === 'final' ? 'Quiz final du cours' : `${KIND_LABEL(editing.lesson)} : ${editing.lesson.title}`} onClose={() => setEditing(null)}>
          {editing.kind === 'final' ? <QuizEditor courseId={c.id} opts={{ final: true }} fallbackTitle={`Évaluation finale : ${c.t.title}`} onSaved={() => { onChange(); }} />
            : <LessonEditor courseId={c.id} lesson={editing.lesson} onSaved={onChange} onDeleted={() => { setEditing(null); onChange(); }} />}
        </Drawer>
      )}
    </div>
  );
}

function InlineTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <input className="inline-title" aria-label="Titre de la partie" maxLength={200} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v.trim() && v !== value && onSave(v.trim())} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />;
}

function ConfirmButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <button className="icon-btn danger" title={label} onClick={() => setAsk(true)}>×</button>;
  return <span className="confirm"><span>Supprimer ?</span><button className="linkbtn" onClick={() => { setAsk(false); onConfirm(); }}>Oui</button><button className="linkbtn" style={{ color: 'var(--muted)' }} onClick={() => setAsk(false)}>Non</button></span>;
}

function Drawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer-panel">
        <header><h2>{title}</h2><button className="toc-close" onClick={onClose} aria-label="Fermer">×</button></header>
        <div className="drawer-content">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Éditeur d'élément */
function LessonEditor({ courseId, lesson, onSaved, onDeleted }: { courseId: string; lesson: AdminLesson; onSaved: () => void; onDeleted: () => void }) {
  const [meta, setMeta] = useState({ title: lesson.title, type: lesson.type, duration_minutes: String(lesson.duration_minutes || ''), is_preview: lesson.is_preview, is_published: lesson.is_published });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const isChapter = lesson.type !== 'quiz' && lesson.type !== 'assignment';
  async function saveMeta() {
    await updateLesson(lesson.id, { title: meta.title.trim() || lesson.title, type: meta.type, duration_minutes: parseInt(meta.duration_minutes || '0', 10) || 0, is_preview: meta.is_preview, is_published: meta.is_published });
  }
  return (
    <div className="form">
      <div className="field"><label htmlFor="l-title">Titre</label><input id="l-title" maxLength={200} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
      <div className="row2">
        {isChapter && <div className="field"><label htmlFor="l-type">Type de chapitre</label><select id="l-type" value={meta.type} onChange={(e) => setMeta({ ...meta, type: e.target.value as AdminLesson['type'] })}>{CHAPTER_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select></div>}
        <div className="field"><label htmlFor="l-dur">Durée (minutes)</label><input id="l-dur" inputMode="numeric" value={meta.duration_minutes} onChange={(e) => setMeta({ ...meta, duration_minutes: e.target.value.replace(/\D/g, '') })} /></div>
      </div>
      <div className="check-row">
        <label className="check"><input type="checkbox" checked={meta.is_published} onChange={(e) => setMeta({ ...meta, is_published: e.target.checked })} /> <span>Visible par les apprenants</span></label>
        {isChapter && <label className="check"><input type="checkbox" checked={meta.is_preview} onChange={(e) => setMeta({ ...meta, is_preview: e.target.checked })} /> <span>Aperçu gratuit (visible sans inscription)</span></label>}
      </div>
      <hr className="sep" />
      {isChapter ? <ChapterContent courseId={courseId} lessonId={lesson.id} type={meta.type} beforeSave={saveMeta} onSaved={() => { setMsg({ ok: true, t: 'Chapitre enregistré.' }); onSaved(); }} onError={(t) => setMsg({ ok: false, t })} />
        : lesson.type === 'quiz' ? <QuizEditor courseId={courseId} opts={{ lessonId: lesson.id }} fallbackTitle={meta.title} beforeSave={saveMeta} onSaved={onSaved} />
        : <ActivityEditor courseId={courseId} lessonId={lesson.id} fallbackTitle={meta.title} beforeSave={saveMeta} onSaved={onSaved} />}
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
      <div className="danger-zone"><span>Supprimer définitivement cet élément</span><ConfirmButton label="Supprimer" onConfirm={async () => { try { await deleteLesson(lesson.id); onDeleted(); } catch (e) { setMsg({ ok: false, t: adminError(e) }); } }} /></div>
    </div>
  );
}

function ChapterContent({ courseId, lessonId, type, beforeSave, onSaved, onError }: { courseId: string; lessonId: string; type: string; beforeSave: () => Promise<void>; onSaved: () => void; onError: (t: string) => void }) {
  const loaded = useAsync(() => getContent(lessonId), [lessonId]);
  const [c, setC] = useState<ContentForm | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (loaded.data) setC(loaded.data); }, [loaded.data]);
  if (!c) return <div className="skeleton" style={{ minHeight: 160 }} />;
  async function upload(file?: File | null) {
    if (!file) return;
    setBusy(true);
    try { setC({ ...c!, document_path: await uploadMaterial(courseId, file) }); } catch (e) { onError(adminError(e)); } finally { setBusy(false); }
  }
  async function save() {
    if (c!.external_url && !/^https:\/\//.test(c!.external_url.trim())) { onError('Le lien doit commencer par https://'); return; }
    setBusy(true);
    try { await beforeSave(); await saveContent(lessonId, c!); onSaved(); } catch (e) { onError(adminError(e)); } finally { setBusy(false); }
  }
  return (
    <>
      <div className="field"><label htmlFor="c-body">Contenu du chapitre</label><textarea id="c-body" maxLength={200000} value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} style={{ minHeight: 280 }} placeholder="Rédigez le chapitre. Séparez les paragraphes par une ligne vide." /><span className="hint">{c.body.trim().split(/\s+/).filter(Boolean).length} mots</span></div>
      {(type === 'video' || c.video_ref) && (
        <div className="row2">
          <div className="field"><label htmlFor="c-vp">Vidéo : plateforme</label><select id="c-vp" value={c.video_provider} onChange={(e) => setC({ ...c, video_provider: e.target.value })}><option value="">Aucune</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="bunny">Bunny</option><option value="mux">Mux</option></select></div>
          <div className="field"><label htmlFor="c-vr">Lien ou identifiant de la vidéo</label><input id="c-vr" maxLength={500} value={c.video_ref} onChange={(e) => setC({ ...c, video_ref: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" /></div>
        </div>
      )}
      <div className="field"><label htmlFor="c-doc">Document à télécharger (PDF, présentation…)</label><input id="c-doc" type="file" onChange={(e) => upload(e.target.files?.[0])} /><span className="hint">{c.document_path ? `Fichier joint : ${c.document_path.split('/').pop()}` : 'Aucun document'}{c.document_path && <> · <button type="button" className="linkbtn" onClick={() => setC({ ...c, document_path: '' })}>Retirer</button></>}</span></div>
      <div className="field"><label htmlFor="c-url">Lien vers une ressource externe</label><input id="c-url" maxLength={1000} value={c.external_url} onChange={(e) => setC({ ...c, external_url: e.target.value })} placeholder="https://…" /></div>
      <div className="af-actions"><button type="button" className="btn btn-red" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le chapitre'}</button></div>
    </>
  );
}

const newQuestion = (kind: QKind = 'single'): QEdit => ({
  kind, prompt: '', explanation: '', points: 1, accepted_answers: [],
  options: kind === 'true_false' ? [{ id: 'true', text: 'Vrai' }, { id: 'false', text: 'Faux' }] : kind === 'short_answer' ? [] : [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }],
  correct_option_ids: [],
});

function QuizEditor({ courseId, opts, fallbackTitle, beforeSave, onSaved }: { courseId: string; opts: { lessonId?: string; final?: boolean }; fallbackTitle: string; beforeSave?: () => Promise<void>; onSaved: () => void }) {
  const loaded = useAsync(() => loadQuizEdit(courseId, opts, fallbackTitle), [courseId, opts.lessonId, opts.final]);
  const [q, setQ] = useState<QuizEdit | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (loaded.data) setQ(loaded.data); }, [loaded.data]);
  if (!q) return <div className="skeleton" style={{ minHeight: 160 }} />;
  const setQs = (fn: (qs: QEdit[]) => QEdit[]) => setQ({ ...q, questions: fn(q.questions) });
  const upd = (i: number, patch: Partial<QEdit>) => setQs((qs) => qs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  function validate(): string | null {
    if (!q!.title.trim()) return 'Donnez un titre au quiz.';
    if (q!.questions.length === 0) return 'Ajoutez au moins une question.';
    for (const [i, x] of q!.questions.entries()) {
      if (!x.prompt.trim()) return `Question ${i + 1} : l’énoncé est vide.`;
      if (x.kind !== 'short_answer') {
        if (x.options.filter((o) => o.text.trim()).length < 2) return `Question ${i + 1} : il faut au moins deux choix.`;
        if (x.correct_option_ids.length === 0) return `Question ${i + 1} : cochez la bonne réponse.`;
      }
    }
    return null;
  }
  async function save() {
    const v = validate(); if (v) { setMsg({ ok: false, t: v }); return; }
    setBusy(true); setMsg(null);
    try {
      await beforeSave?.();
      const clean = { ...q!, questions: q!.questions.map((x) => ({ ...x, options: x.options.filter((o) => o.text.trim()) })) };
      const id = await saveQuizEdit(courseId, clean, opts);
      setQ({ ...clean, id }); setMsg({ ok: true, t: 'Quiz enregistré.' }); onSaved();
    } catch (e) { setMsg({ ok: false, t: adminError(e) }); } finally { setBusy(false); }
  }

  return (
    <div className="form">
      <div className="field"><label htmlFor="q-title">Titre du quiz</label><input id="q-title" maxLength={200} value={q.title} onChange={(e) => setQ({ ...q, title: e.target.value })} /></div>
      <div className="row3">
        <div className="field"><label htmlFor="q-pass">Note pour réussir (%)</label><input id="q-pass" inputMode="numeric" value={q.pass_percent} onChange={(e) => setQ({ ...q, pass_percent: Math.min(100, parseInt(e.target.value.replace(/\D/g, '') || '0', 10)) })} /></div>
        <div className="field"><label htmlFor="q-att">Tentatives maximum</label><input id="q-att" inputMode="numeric" placeholder="Illimitées" value={q.max_attempts ?? ''} onChange={(e) => setQ({ ...q, max_attempts: e.target.value ? parseInt(e.target.value.replace(/\D/g, ''), 10) || null : null })} /></div>
        <div className="field"><label htmlFor="q-show">Afficher les corrections</label><select id="q-show" value={q.show_answers} onChange={(e) => setQ({ ...q, show_answers: e.target.value as QuizEdit['show_answers'] })}><option value="after_submit">Après chaque tentative</option><option value="after_pass">Après réussite</option><option value="never">Jamais</option></select></div>
      </div>

      {q.questions.map((x, i) => (
        <fieldset key={i} className="qe">
          <legend>Question {i + 1}</legend>
          <div className="qe-tools">
            <select aria-label="Type de question" value={x.kind} onChange={(e) => { const k = e.target.value as QKind; upd(i, { ...newQuestion(k), id: x.id, prompt: x.prompt, explanation: x.explanation, points: x.points }); }}>
              <option value="single">Une seule bonne réponse</option><option value="multiple">Plusieurs bonnes réponses</option><option value="true_false">Vrai ou faux</option><option value="short_answer">Réponse courte</option>
            </select>
            <button type="button" className="icon-btn" disabled={i === 0} onClick={() => setQs((qs) => { const a = [...qs]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; })}>↑</button>
            <button type="button" className="icon-btn" disabled={i === q.questions.length - 1} onClick={() => setQs((qs) => { const a = [...qs]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; return a; })}>↓</button>
            <button type="button" className="icon-btn danger" title="Supprimer la question" onClick={() => setQs((qs) => qs.filter((_, j) => j !== i))}>×</button>
          </div>
          <div className="field"><label htmlFor={`qp${i}`}>Énoncé</label><textarea id={`qp${i}`} maxLength={2000} value={x.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} style={{ minHeight: 70 }} /></div>
          {x.kind === 'short_answer' ? (
            <div className="field"><label htmlFor={`qa${i}`}>Réponses acceptées (une par ligne)</label><textarea id={`qa${i}`} value={x.accepted_answers.join('\n')} onChange={(e) => upd(i, { accepted_answers: e.target.value.split('\n') })} /><span className="hint">Laissez vide pour une correction manuelle par un formateur.</span></div>
          ) : (
            <div className="qe-options">
              <span className="qe-lab">Choix (cochez la ou les bonnes réponses)</span>
              {x.options.map((o, oi) => (
                <div key={o.id} className="qe-opt">
                  <input type={x.kind === 'multiple' ? 'checkbox' : 'radio'} name={`ok${i}`} aria-label="Bonne réponse" checked={x.correct_option_ids.includes(o.id)}
                    onChange={() => upd(i, { correct_option_ids: x.kind === 'multiple' ? (x.correct_option_ids.includes(o.id) ? x.correct_option_ids.filter((c) => c !== o.id) : [...x.correct_option_ids, o.id]) : [o.id] })} />
                  <input className="qe-opt-text" aria-label={`Choix ${oi + 1}`} value={o.text} disabled={x.kind === 'true_false'} onChange={(e) => upd(i, { options: x.options.map((p) => (p.id === o.id ? { ...p, text: e.target.value } : p)) })} placeholder={`Choix ${oi + 1}`} />
                  {x.kind !== 'true_false' && x.options.length > 2 && <button type="button" className="icon-btn" aria-label="Retirer ce choix" onClick={() => upd(i, { options: x.options.filter((p) => p.id !== o.id), correct_option_ids: x.correct_option_ids.filter((c) => c !== o.id) })}>×</button>}
                </div>
              ))}
              {x.kind !== 'true_false' && x.options.length < 8 && <button type="button" className="linkbtn" onClick={() => { const used = new Set(x.options.map((o) => o.id)); const id = 'abcdefgh'.split('').find((l) => !used.has(l))!; upd(i, { options: [...x.options, { id, text: '' }] }); }}>+ Ajouter un choix</button>}
            </div>
          )}
          <div className="row2">
            <div className="field"><label htmlFor={`qx${i}`}>Explication (montrée après la réponse)</label><input id={`qx${i}`} maxLength={2000} value={x.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} /></div>
            <div className="field"><label htmlFor={`qpt${i}`}>Points</label><input id={`qpt${i}`} inputMode="numeric" value={x.points} onChange={(e) => upd(i, { points: Math.max(1, parseInt(e.target.value.replace(/\D/g, '') || '1', 10)) })} /></div>
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn btn-outline" onClick={() => setQs((qs) => [...qs, newQuestion()])}>+ Ajouter une question</button>
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
      <div className="af-actions sticky"><span className="hint">{q.questions.length} question{q.questions.length > 1 ? 's' : ''}</span><button type="button" className="btn btn-red" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le quiz'}</button></div>
    </div>
  );
}

function ActivityEditor({ courseId, lessonId, fallbackTitle, beforeSave, onSaved }: { courseId: string; lessonId: string; fallbackTitle: string; beforeSave: () => Promise<void>; onSaved: () => void }) {
  const loaded = useAsync(() => loadAssignmentEdit(lessonId, fallbackTitle), [lessonId]);
  const [a, setA] = useState<AssignmentEdit | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (loaded.data) setA(loaded.data); }, [loaded.data]);
  if (!a) return <div className="skeleton" style={{ minHeight: 160 }} />;
  const toggleType = (t: 'text' | 'file') => setA({ ...a, submission_types: a.submission_types.includes(t) ? a.submission_types.filter((x) => x !== t) : [...a.submission_types, t] });
  async function save() {
    if (a!.submission_types.length === 0) { setMsg({ ok: false, t: 'Choisissez au moins un mode de remise.' }); return; }
    setBusy(true); setMsg(null);
    try { await beforeSave(); await saveAssignmentEdit(courseId, lessonId, { ...a!, title: a!.title.trim() || fallbackTitle }); setMsg({ ok: true, t: 'Activité enregistrée.' }); onSaved(); }
    catch (e) { setMsg({ ok: false, t: adminError(e) }); } finally { setBusy(false); }
  }
  return (
    <div className="form">
      <div className="field"><label htmlFor="a-title">Titre de l’activité</label><input id="a-title" maxLength={200} value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></div>
      <div className="field"><label htmlFor="a-ins">Consignes</label><textarea id="a-ins" maxLength={50000} value={a.instructions} onChange={(e) => setA({ ...a, instructions: e.target.value })} style={{ minHeight: 220 }} placeholder={'Contexte…\n\nConsignes…\n\nLivrable attendu…'} /></div>
      <div className="row3">
        <div className="field"><label htmlFor="a-pts">Note sur</label><input id="a-pts" inputMode="numeric" value={a.max_points} onChange={(e) => setA({ ...a, max_points: Math.max(1, parseInt(e.target.value.replace(/\D/g, '') || '1', 10)) })} /></div>
        <div className="field"><label htmlFor="a-due">Date limite (facultatif)</label><input id="a-due" type="datetime-local" value={a.due_at} onChange={(e) => setA({ ...a, due_at: e.target.value })} /></div>
      </div>
      <div className="check-row">
        <label className="check"><input type="checkbox" checked={a.submission_types.includes('text')} onChange={() => toggleType('text')} /> <span>Réponse écrite</span></label>
        <label className="check"><input type="checkbox" checked={a.submission_types.includes('file')} onChange={() => toggleType('file')} /> <span>Fichier joint</span></label>
        <label className="check"><input type="checkbox" checked={a.is_published} onChange={(e) => setA({ ...a, is_published: e.target.checked })} /> <span>Activité ouverte aux apprenants</span></label>
      </div>
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
      <div className="af-actions"><button type="button" className="btn btn-red" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer l’activité'}</button></div>
    </div>
  );
}

/* =============================================================== Publication */
function PublicationTab({ c, onSaved }: { c: AdminCourse; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const steps = c.modules.reduce((n, m) => n + m.lessons.length, 0);
  const checks = [
    { ok: !!c.t.title.trim(), t: 'Un titre' },
    { ok: !!c.t.short_description.trim(), t: 'Un résumé pour le catalogue' },
    { ok: c.modules.length > 0, t: 'Au moins une partie' },
    { ok: steps > 0, t: 'Au moins un chapitre (sans quoi aucun certificat n’est possible)' },
    { ok: !c.certificate_enabled || !!c.finalQuizId || c.modules.some((m) => m.lessons.some((l) => l.type === 'quiz')), t: 'Un quiz pour vérifier les acquis (conseillé)' },
  ];
  async function setStatus(status: 'draft' | 'published' | 'archived') {
    setBusy(true); setMsg(null);
    try { await updateCourse(c.id, status === 'published' ? { status, review_requested_at: null } : { status }); setMsg({ ok: true, t: status === 'published' ? 'Formation publiée : elle est visible dans le catalogue.' : status === 'draft' ? 'Formation repassée en brouillon : elle n’est plus visible.' : 'Formation archivée.' }); onSaved(); }
    catch (e) { setMsg({ ok: false, t: adminError(e) }); } finally { setBusy(false); }
  }
  return (
    <div className="admin-form">
      <section className="af-section">
        <h2><span>✓</span>Avant de publier</h2>
        <ul className="checklist">{checks.map((x) => <li key={x.t} className={x.ok ? 'ok' : ''}>{x.t}</li>)}</ul>
      </section>
      <section className="af-section">
        <h2><span>●</span>Statut</h2>
        <p>Actuellement : <b>{c.status === 'published' ? 'publiée' : c.status === 'draft' ? 'brouillon' : 'archivée'}</b>.</p>
        <div className="btns">
          {c.status !== 'published' && <button className="btn btn-red" disabled={busy} onClick={() => setStatus('published')}>Publier la formation</button>}
          {c.status === 'published' && <button className="btn btn-outline" disabled={busy} onClick={() => setStatus('draft')}>Repasser en brouillon</button>}
          {c.status !== 'archived' && <button className="btn btn-outline" disabled={busy} onClick={() => setStatus('archived')}>Archiver</button>}
        </div>
        {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status" style={{ marginTop: 14 }}>{msg.t}</p>}
      </section>
    </div>
  );
}

/* =============================================================== Soumission (professeur) */
function SubmitTab({ c, onSaved }: { c: AdminCourse; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const steps = c.modules.reduce((n, m) => n + m.lessons.length, 0);
  const checks = [
    { ok: !!c.t.title.trim(), t: 'Un titre' },
    { ok: !!c.t.short_description.trim(), t: 'Un résumé pour le catalogue' },
    { ok: !!c.t.description.trim(), t: 'Une présentation détaillée' },
    { ok: c.t.objectives.length > 0, t: 'Des objectifs pédagogiques' },
    { ok: steps > 0, t: 'Au moins un chapitre' },
    { ok: !!c.finalQuizId || c.modules.some((m) => m.lessons.some((l) => l.type === 'quiz')), t: 'Un quiz pour vérifier les acquis (conseillé)' },
  ];
  async function submit() {
    setBusy(true); setMsg(null);
    try { await submitForReview(c.id); setMsg({ ok: true, t: 'Cours soumis : l’administration va le relire avant de le publier.' }); onSaved(); }
    catch (e) { setMsg({ ok: false, t: teacherError(e) }); } finally { setBusy(false); }
  }
  return (
    <div className="admin-form">
      <section className="af-section">
        <h2><span>✓</span>Avant de soumettre</h2>
        <ul className="checklist">{checks.map((x) => <li key={x.t} className={x.ok ? 'ok' : ''}>{x.t}</li>)}</ul>
      </section>
      <section className="af-section">
        <h2><span>●</span>Publication</h2>
        {c.status === 'published' ? <p>Ce cours est <b>publié</b>. Vos modifications de contenu sont visibles immédiatement par les apprenants.</p>
          : c.review_requested_at ? <p>Soumis pour relecture le <b>{new Date(c.review_requested_at).toLocaleDateString('fr-FR')}</b>. L’administration vous préviendra de sa décision. Vous pouvez continuer à l’améliorer et le soumettre à nouveau.</p>
          : <p>Ce cours est un <b>brouillon</b>, visible par vous seul. Quand il est prêt, soumettez-le : un administrateur le relit, fixe son prix et le publie.</p>}
        {c.status === 'draft' && <div className="btns"><button className="btn btn-red" disabled={busy || steps === 0} onClick={submit}>{busy ? 'Envoi…' : c.review_requested_at ? 'Soumettre à nouveau' : 'Soumettre pour relecture'}</button></div>}
        {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status" style={{ marginTop: 14 }}>{msg.t}</p>}
      </section>
    </div>
  );
}
