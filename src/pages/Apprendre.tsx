import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useAsync, usePageMeta } from '../lib/hooks';
import {
  completeLesson, CERT_ERRORS, findQuiz, getAssignment, getCompletedLessons, getEnrollment, getLearnCourse,
  getLessonContent, getQuiz, issueCertificate, learnError, listMyCertificates, materialUrl, submitAssignment, submitQuiz, viewLesson,
  type Certificate, type LearnCourse, type LessonRef, type Quiz, type QuizResult,
} from '../lib/learn';
import { downloadCertificate } from '../lib/certificate';
import { Icon } from '../components/Icon';
import { CourseSpace, type SpaceTab } from '../components/CourseSpace';
import { courseAccess } from '../lib/space';
import { Empty, ErrorNote } from '../components/ui';

const FINAL = 'examen-final';
const TYPE_LABEL: Record<string, string> = { video: 'Vidéo', text: 'Lecture', document: 'Document', quiz: 'Quiz', audio: 'Audio', image: 'Image', link: 'Ressource', presentation: 'Présentation', assignment: 'Activité', forum: 'Discussion' };

/** Une entrée du plan : chapitre numéroté (1.1, 1.2…), quiz ou activité (non numérotés), ou quiz final. */
interface Step { id: string; lesson?: LessonRef; part: number; partTitle: string; number?: string; label: string; kind: 'chapter' | 'quiz' | 'activity' | 'final' }

function buildPlan(course: LearnCourse, hasFinal: boolean): Step[] {
  const steps: Step[] = [];
  course.modules.forEach((m, mi) => {
    let n = 0;
    for (const l of m.lessons) {
      const kind = l.type === 'quiz' ? 'quiz' : l.type === 'assignment' ? 'activity' : 'chapter';
      if (kind === 'chapter') n++;
      steps.push({ id: l.id, lesson: l, part: mi + 1, partTitle: m.title, number: kind === 'chapter' ? `${mi + 1}.${n}` : undefined, label: kind === 'quiz' ? `Quiz : ${l.title}` : kind === 'activity' ? `Activité : ${l.title}` : l.title, kind });
    }
  });
  if (hasFinal) steps.push({ id: FINAL, part: course.modules.length + 1, partTitle: 'Évaluation finale', label: 'Quiz final', kind: 'final' });
  return steps;
}

export default function Apprendre() {
  const { slug = '' } = useParams();
  const { session, ready } = useAuth();
  const [params, setParams] = useSearchParams();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [cert, setCert] = useState<Certificate | null>(null);
  const [outline, setOutline] = useState(false); // sommaire : panneau sur mobile, repli sur ordinateur

  const data = useAsync(async () => {
    if (!session) return null;
    const course = await getLearnCourse(slug);
    if (!course) return { course: null, enr: null, completed: new Set<string>(), finalQuiz: null, cert: null, access: null };
    const [enr, completed, finalQuiz, certs, access] = await Promise.all([
      getEnrollment(session.user.id, course.id), getCompletedLessons(session.user.id, course.id), findQuiz(course.id, { final: true }), listMyCertificates(), courseAccess(course.id),
    ]);
    return { course, enr, completed, finalQuiz, cert: certs.find((c) => c.course_id === course.id && c.status !== 'revoked') ?? null, access };
  }, [slug, session?.user.id]);

  useEffect(() => { if (data.data) { setDone(data.data.completed); setCert(data.data.cert ?? null); } }, [data.data]);
  useEffect(() => { document.body.style.overflow = outline && window.innerWidth < 1000 ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [outline]);
  usePageMeta(data.data?.course?.title ?? 'Mon cours');

  const course = data.data?.course ?? null;
  const plan = useMemo(() => (course ? buildPlan(course, !!data.data?.finalQuiz) : []), [course, data.data?.finalQuiz]);
  const lessonSteps = plan.filter((s) => s.lesson);
  const current = params.get('lecon') ?? (lessonSteps.find((s) => !done.has(s.id))?.id ?? plan[0]?.id ?? '');

  if (!ready) return null;
  if (!session) return <Navigate to={`/connexion?retour=/apprendre/${slug}`} replace />;
  if (data.loading) return <div className="wrap sec"><div className="skeleton" style={{ minHeight: 420 }} /></div>;
  if (data.error) return <div className="wrap sec"><ErrorNote error={data.error} /></div>;
  if (!course) return <div className="wrap sec"><Empty title="Ce cours est introuvable." /></div>;
  const enrolled = data.data?.enr?.status === 'active';
  const canManage = !!data.data?.access?.can_manage;
  // Inscrits, formateurs du cours et administrateurs ont accès à l'espace du cours.
  if (!enrolled && !canManage) return <Navigate to={`/formations/${slug}`} replace />;
  const room = !!data.data?.access?.room;
  const isUniversity = !!data.data?.access?.is_university;
  const space = room ? (params.get('espace') as SpaceTab | null) : null;
  const roomDenied = !room && !!params.get('espace');
  const TABS: [SpaceTab | null, string][] = [[null, 'Cours'], ['classe', 'Classe virtuelle'], ['annonces', 'Annonces'], ['forum', 'Forum'], ['participants', 'Participants'], ['notes', 'Mes notes']];

  const total = lessonSteps.length;
  const nDone = lessonSteps.filter((s) => done.has(s.id)).length;
  const percent = total ? Math.round((100 * nDone) / total) : 0;
  const idx = plan.findIndex((s) => s.id === current);
  const step = plan[idx];
  const prev = idx > 0 ? plan[idx - 1] : undefined;
  const next = idx >= 0 ? plan[idx + 1] : undefined;
  const go = (id: string) => { setParams({ lecon: id }); setOutline(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const markDone = (id: string) => setDone((s) => new Set(s).add(id));
  const parts = [...new Set(plan.map((s) => s.part))];

  return (
    <div className={`player${outline ? ' outline-open' : ''}`}>
      <div className="player-bar">
        <button className="pb-toc" onClick={() => setOutline(!outline)} aria-expanded={outline} aria-controls="sommaire">
          <span className="pb-toc-ic" aria-hidden="true"><i /><i /><i /></span>Sommaire
        </button>
        <div className="pb-title"><Link to={`/formations/${slug}`}>{course.title}</Link></div>
        <div className="pb-progress" title={`${nDone} / ${total} étapes terminées`}>
          <span className="pb-ring" style={{ ['--p' as string]: percent }}><b>{percent}%</b></span>
          <span className="pb-label">{percent === 100 ? 'Cours terminé' : `${nDone} / ${total}`}</span>
        </div>
      </div>

      {roomDenied && (
        <p className="alert" style={{ margin: 16, background: 'var(--soft)', borderLeft: '4px solid var(--navy)' }}>
          {isUniversity ? 'La salle virtuelle de ce cours est réservée aux étudiants inscrits à un programme de sa faculté.' : 'La salle virtuelle est réservée aux cours universitaires. Cette formation se suit directement chapitre par chapitre.'}
        </p>
      )}
      {room && <nav className="space-tabs" aria-label="Espace du cours">
        {TABS.map(([k, l]) => <button key={l} className={space === k ? 'on' : ''} aria-current={space === k ? 'page' : undefined} onClick={() => setParams(k ? { espace: k } : {})}>{l}{k === 'classe' && <span className="dot-live" aria-hidden="true" />}</button>)}
        {canManage && !enrolled && <span className="tag-demo" style={{ marginLeft: 'auto' }}>Vue formateur</span>}
      </nav>}

      {space ? (
        <div className="space-wrap"><CourseSpace tab={space} courseId={course.id} slug={slug} userId={session.user.id} canManage={canManage} enrolled={enrolled} /></div>
      ) : (
      <div className="player-body">
        <div className="toc-overlay" onClick={() => setOutline(false)} aria-hidden="true" />
        <nav className="toc" id="sommaire" aria-label="Sommaire du cours">
          <div className="toc-head">
            <b>Sommaire</b>
            <button className="toc-close" onClick={() => setOutline(false)} aria-label="Fermer le sommaire">×</button>
          </div>
          {parts.map((p) => {
            const ps = plan.filter((s) => s.part === p);
            return (
              <div key={p} className="toc-part">
                <h2><span>{ps[0].kind === 'final' ? 'Fin du cours' : `Partie ${p}`}</span>{ps[0].partTitle}</h2>
                <ol>{ps.map((s) => (
                  <li key={s.id}>
                    <button className={`toc-item ${s.kind}${s.id === current ? ' on' : ''}${done.has(s.id) ? ' done' : ''}`} onClick={() => go(s.id)} aria-current={s.id === current ? 'step' : undefined}>
                      <span className="ti-state" aria-hidden="true">{done.has(s.id) ? '✓' : s.kind === 'chapter' ? '' : s.kind === 'activity' ? '✎' : '?'}</span>
                      <span className="ti-text">{s.number && <em>{s.number}</em>}{s.label}</span>
                    </button>
                  </li>
                ))}</ol>
              </div>
            );
          })}
          <CertificatePanel course={course} cert={cert} onCert={setCert} percent={percent} />
        </nav>

        <main className="chapter-wrap">
          {!step ? (
            <Empty title="Ce cours n’a pas encore de chapitres.">Le contenu sera publié prochainement par l’Académie.</Empty>
          ) : (
            <article className="chapter">
              <p className="ch-kicker">{step.kind === 'final' ? 'Évaluation finale' : `Partie ${step.part} · ${step.partTitle}`}</p>
              <h1>{step.number && <span className="ch-num">{step.number}</span>}{step.label}</h1>
              {step.lesson && <p className="ch-meta"><span><Icon name="book" size={15} />{TYPE_LABEL[step.lesson.type] ?? step.lesson.type}</span>{step.lesson.duration_minutes > 0 && <span><Icon name="clock" size={15} />{step.lesson.duration_minutes} min</span>}{done.has(step.id) && <span className="status open">Terminé</span>}</p>}

              {step.kind === 'final' && data.data?.finalQuiz ? <QuizView quizId={data.data?.finalQuiz} onPassed={() => undefined} />
                : step.lesson && <LessonView key={step.id} lesson={step.lesson} done={done.has(step.id)} userId={session.user.id} courseId={course.id} onDone={() => markDone(step.id)} />}

              <nav className="ch-nav" aria-label="Navigation entre chapitres">
                {prev ? <button className="ch-link prev" onClick={() => go(prev.id)}><small>Précédent</small><span>{prev.number ? `${prev.number} ` : ''}{prev.label}</span></button> : <span />}
                {next ? <button className="ch-link next" onClick={() => go(next.id)}><small>{next.kind === 'chapter' ? 'Chapitre suivant' : next.kind === 'activity' ? 'Activité suivante' : 'Quiz suivant'}</small><span>{next.number ? `${next.number} ` : ''}{next.label}</span></button>
                  : <Link className="ch-link next" to="/mon-compte"><small>Fin du cours</small><span>Retour à mon compte</span></Link>}
              </nav>
            </article>
          )}
        </main>
      </div>
      )}
    </div>
  );
}

function CertificatePanel({ course, cert, onCert, percent }: { course: LearnCourse; cert: Certificate | null; onCert: (c: Certificate) => void; percent: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (!course.certificate_enabled) return null;
  async function claim() {
    setBusy(true); setMsg('');
    try { onCert(await issueCertificate(course.id)); }
    catch (e) { const m = (e as Error).message; setMsg(CERT_ERRORS[Object.keys(CERT_ERRORS).find((k) => m.includes(k)) ?? ''] ?? learnError(e)); }
    finally { setBusy(false); }
  }
  async function pdf() {
    setBusy(true); setMsg('');
    try { await downloadCertificate(cert!); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className={`cert-box${cert ? ' got' : ''}`}>
      <div className="cert-ic"><Icon name="cap" size={22} /></div>
      {cert ? (
        <>
          <b>Certificat obtenu</b>
          <p>N° <code>{cert.code}</code></p>
          <button className="btn btn-red btn-sm" onClick={pdf} disabled={busy}>{busy ? 'Génération…' : 'Télécharger le PDF'}</button>
          <Link to={`/certificates/verify/${cert.code}`} className="cert-link">Lien de vérification</Link>
        </>
      ) : (
        <>
          <b>Certificat de réussite</b>
          <p>Délivré automatiquement quand toutes les étapes sont terminées et le quiz final réussi.</p>
          <button className="btn btn-navy btn-sm" onClick={claim} disabled={busy}>{busy ? 'Vérification…' : percent === 100 ? 'Obtenir mon certificat' : 'Vérifier mon éligibilité'}</button>
        </>
      )}
      {msg && <p className="alert err" role="alert" style={{ marginTop: 8, fontSize: '.85rem' }}>{msg}{msg.includes('profil') && <> <Link to="/mon-compte#profil">Compléter mon profil</Link></>}</p>}
    </div>
  );
}

function LessonView({ lesson, done, userId, courseId, onDone }: { lesson: LessonRef; done: boolean; userId: string; courseId: string; onDone: () => void }) {
  const content = useAsync(() => getLessonContent(lesson.id), [lesson.id]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { viewLesson(lesson.id).catch(() => undefined); }, [lesson.id]);

  async function complete() {
    setBusy(true); setErr('');
    try { await completeLesson(lesson.id); onDone(); } catch (e) { setErr(learnError(e)); } finally { setBusy(false); }
  }
  const c = content.data;
  return (
    <>
      {content.loading ? <div className="skeleton" style={{ minHeight: 200 }} /> : content.error ? <ErrorNote error={content.error} /> : (
        <>
          {c && <Media c={c} />}
          {c?.body && <div className="ch-body">{c.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
          {!c && lesson.type !== 'quiz' && lesson.type !== 'assignment' && <p className="ch-body" style={{ color: 'var(--muted)' }}>Le contenu de ce chapitre sera publié prochainement.</p>}
        </>
      )}

      {lesson.type === 'quiz' ? <LessonQuiz courseId={courseId} lessonId={lesson.id} onPassed={onDone} />
        : lesson.type === 'assignment' ? <AssignmentView lessonId={lesson.id} userId={userId} onSubmitted={onDone} />
        : (
          <div className={`ch-done${done ? ' is-done' : ''}`}>
            {done ? (
              <><span className="ch-done-ic" aria-hidden="true">✓</span><div><b>Chapitre terminé</b><p>Bravo ! Passez à l’étape suivante.</p></div></>
            ) : (
              <><div><b>Vous avez terminé ce chapitre ?</b><p>Validez-le pour faire avancer votre progression.</p></div>
                <button className="btn btn-red" onClick={complete} disabled={busy}>{busy ? 'Enregistrement…' : 'J’ai terminé ce chapitre'}</button></>
            )}
          </div>
        )}
      {err && <p className="alert err" role="alert">{err}</p>}
    </>
  );
}

function Media({ c }: { c: NonNullable<Awaited<ReturnType<typeof getLessonContent>>> }) {
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => { if (c.document_path) materialUrl(c.document_path).then(setDoc).catch(() => undefined); }, [c.document_path]);
  let embed: string | null = null;
  if (c.video_ref && c.video_provider === 'youtube') embed = `https://www.youtube-nocookie.com/embed/${c.video_ref.replace(/.*(?:v=|youtu\.be\/|embed\/)/, '').replace(/[?&].*/, '')}`;
  if (c.video_ref && c.video_provider === 'vimeo') embed = `https://player.vimeo.com/video/${c.video_ref.replace(/\D+/g, '')}`;
  return (
    <>
      {embed && <div className="video"><iframe src={embed} title="Vidéo du chapitre" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /></div>}
      {c.video_ref && !embed && <p><a className="btn btn-outline btn-sm" href={c.video_ref} target="_blank" rel="noreferrer">Ouvrir la vidéo</a></p>}
      {(doc || c.external_url) && (
        <div className="ch-callout">
          <b>Ressources du chapitre</b>
          <div className="btns">
            {doc && <a className="btn btn-outline btn-sm" href={doc} target="_blank" rel="noreferrer"><Icon name="book" size={16} /> Ouvrir le document</a>}
            {c.external_url && <a className="btn btn-outline btn-sm" href={c.external_url} target="_blank" rel="noreferrer">Ouvrir la ressource</a>}
          </div>
        </div>
      )}
    </>
  );
}

function LessonQuiz({ courseId, lessonId, onPassed }: { courseId: string; lessonId: string; onPassed: () => void }) {
  const id = useAsync(() => findQuiz(courseId, { lessonId }), [lessonId]);
  if (id.loading) return null;
  if (!id.data) return <p className="ch-body" style={{ color: 'var(--muted)' }}>Le quiz de ce chapitre n’est pas encore disponible.</p>;
  return <QuizView quizId={id.data} onPassed={onPassed} />;
}

function QuizView({ quizId, onPassed }: { quizId: string; onPassed: () => void }) {
  const [reload, setReload] = useState(0);
  const quiz = useAsync(() => getQuiz(quizId), [quizId, reload]);
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (quiz.loading) return <div className="skeleton" style={{ minHeight: 200 }} />;
  if (quiz.error) return <ErrorNote error={quiz.error} />;
  const q = quiz.data as Quiz;
  const left = q.max_attempts ? q.max_attempts - q.attempts_used : null;
  const feedback = (id: string) => result?.feedback?.find((f) => f.question_id === id);
  const answered = q.questions.filter((x) => answers[x.id] && (!Array.isArray(answers[x.id]) || (answers[x.id] as string[]).length > 0)).length;

  function toggle(qid: string, oid: string, multiple: boolean) {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : [];
      return { ...a, [qid]: multiple ? (cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid]) : [oid] };
    });
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = q.questions.length - answered;
    if (missing) { setErr(`Répondez à toutes les questions (${missing} sans réponse).`); return; }
    setBusy(true); setErr('');
    try { const r = await submitQuiz(quizId, answers); setResult(r); if (r.passed) onPassed(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e2) { setErr(learnError(e2)); } finally { setBusy(false); }
  }

  return (
    <form className="quiz" onSubmit={onSubmit} noValidate>
      <div className="quiz-info">
        <div><small>Questions</small><b>{q.questions.length}</b></div>
        <div><small>Pour réussir</small><b>{q.pass_percent} %</b></div>
        <div><small>Tentatives</small><b>{left === null ? 'Illimitées' : `${left} restante${left > 1 ? 's' : ''}`}</b></div>
        {q.best_score !== null && <div><small>Meilleur score</small><b>{Math.round(q.best_score)} %</b></div>}
      </div>
      {q.passed && !result && <p className="alert ok">Vous avez déjà réussi ce quiz. Vous pouvez le refaire pour vous entraîner.</p>}
      {result && (
        <div className={`quiz-result ${result.passed ? 'ok' : 'ko'}`} role="status">
          <span className="qr-score">{Math.round(Number(result.score_percent ?? 0))} %</span>
          <div>
            <b>{result.pending_review ? 'Réponses envoyées' : result.passed ? 'Quiz réussi !' : 'Pas encore…'}</b>
            <p>{result.pending_review ? 'Vos réponses ouvertes seront corrigées par un formateur.' : result.passed ? 'Cette étape est validée. Consultez les explications ci-dessous.' : `Il faut ${q.pass_percent} % pour réussir. Relisez les explications puis réessayez.`}</p>
          </div>
          {!result.passed && (left === null || left - 1 > 0) && <button type="button" className="btn btn-navy btn-sm" onClick={() => { setResult(null); setAnswers({}); setReload((n) => n + 1); }}>Recommencer</button>}
        </div>
      )}
      {q.questions.map((x, i) => {
        const fb = feedback(x.id);
        const multiple = x.kind === 'multiple' || x.allow_multiple;
        return (
          <fieldset key={x.id} className={`qq${fb ? (fb.correct ? ' ok' : fb.correct === false ? ' ko' : '') : ''}`}>
            <legend><span className="qq-n">Question {i + 1} / {q.questions.length}</span>{x.prompt}{multiple && <small>Plusieurs réponses possibles</small>}</legend>
            {x.kind === 'short_answer' ? (
              <div className="field"><input value={(answers[x.id] as string) ?? ''} onChange={(e) => setAnswers({ ...answers, [x.id]: e.target.value })} aria-label="Votre réponse" disabled={!!result} /></div>
            ) : (x.options ?? []).map((o) => {
              const sel = Array.isArray(answers[x.id]) && (answers[x.id] as string[]).includes(o.id);
              const right = fb?.correct_option_ids?.includes(o.id);
              return (
                <label key={o.id} className={`qo${multiple ? ' multi' : ''}${sel ? ' sel' : ''}${fb && right ? ' right' : ''}${fb && sel && !right ? ' wrong' : ''}`}>
                  <input type={multiple ? 'checkbox' : 'radio'} name={x.id} checked={sel} onChange={() => toggle(x.id, o.id, multiple)} disabled={!!result} />
                  <span className="qo-mark" aria-hidden="true" />
                  <span>{o.text}</span>
                </label>
              );
            })}
            {fb?.explanation && <p className="qq-exp"><b>{fb.correct ? 'Bonne réponse.' : 'À retenir :'}</b> {fb.explanation}</p>}
          </fieldset>
        );
      })}
      {err && <p className="alert err" role="alert">{err}</p>}
      {!result && (
        <div className="quiz-submit">
          <span>{answered} / {q.questions.length} réponses</span>
          <button className="btn btn-red" disabled={busy || left === 0}>{busy ? 'Correction…' : left === 0 ? 'Plus de tentative' : 'Valider mes réponses'}</button>
        </div>
      )}
    </form>
  );
}

function AssignmentView({ lessonId, userId, onSubmitted }: { lessonId: string; userId: string; onSubmitted: () => void }) {
  const [reload, setReload] = useState(0);
  const d = useAsync(() => getAssignment(lessonId), [lessonId, reload]);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (d.data?.s?.body) setBody(d.data.s.body); }, [d.data]);
  if (d.loading) return null;
  if (d.error) return <ErrorNote error={d.error} />;
  const { a, s } = d.data!;
  if (!a) return <p className="ch-body" style={{ color: 'var(--muted)' }}>Cette activité n’est pas encore disponible.</p>;
  const sent = s && s.status !== 'draft';
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (file && file.size > a!.max_file_mb * 1024 * 1024) { setErr(`Le fichier dépasse ${a!.max_file_mb} Mo.`); return; }
    setBusy(true); setErr('');
    try { await submitAssignment(a!.id, userId, body, file); onSubmitted(); setReload((n) => n + 1); }
    catch (e2) { setErr(learnError(e2)); } finally { setBusy(false); }
  }
  return (
    <form className="activity" onSubmit={onSubmit} noValidate>
      <div className="act-head"><span className="act-badge">À vous de jouer !</span><h2>{a.title}</h2>{a.due_at && <p>À remettre avant le {new Date(a.due_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p>}</div>
      {a.instructions && <div className="ch-body">{a.instructions.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
      {sent ? (
        <p className="alert ok" role="status">Activité remise{s!.submitted_at ? ` le ${new Date(s!.submitted_at).toLocaleDateString('fr-FR')}` : ''}.{s!.status === 'graded' ? ' Elle a été corrigée.' : ' Elle sera corrigée par votre formateur.'}</p>
      ) : (
        <div className="form">
          {a.submission_types.includes('text') && <div className="field"><label htmlFor="as-body">Votre réponse</label><textarea id="as-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={100000} style={{ minHeight: 220 }} /><span className="hint">{body.trim().split(/\s+/).filter(Boolean).length} mots</span></div>}
          {a.submission_types.includes('file') && <div className="field"><label htmlFor="as-file">Fichier (facultatif, {a.max_file_mb} Mo maximum)</label><input id="as-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>}
          {err && <p className="alert err" role="alert">{err}</p>}
          <div><button className="btn btn-red" disabled={busy}>{busy ? 'Envoi…' : 'Remettre mon activité'}</button></div>
        </div>
      )}
    </form>
  );
}
