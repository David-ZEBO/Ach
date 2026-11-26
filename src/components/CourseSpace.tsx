import { useEffect, useState, type FormEvent } from 'react';
import { useAsync } from '../lib/hooks';
import {
  createDiscussion, deleteAnnouncement, deleteEvent, getDiscussion, isUrl, jitsiRoom, listAnnouncements, listDiscussions, listEvents, liveState,
  moderate, myGrades, participants, postAnnouncement, replyDiscussion, saveEvent, type CalEvent,
} from '../lib/space';
import { ErrorNote } from './ui';

export type SpaceTab = 'classe' | 'annonces' | 'forum' | 'participants' | 'notes';
interface Ctx { courseId: string; slug: string; userId: string; canManage: boolean; enrolled: boolean }

const fmt = (s: string) => new Date(s).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const short = (s: string) => new Date(s).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const err = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? '';
  if (/row-level security|42501|forbidden/i.test(m)) return 'Action non autorisée pour votre compte.';
  if (/check constraint/i.test(m)) return 'Un champ ne respecte pas le format attendu.';
  return m || 'Une erreur est survenue.';
};

export function CourseSpace({ tab, ...ctx }: Ctx & { tab: SpaceTab }) {
  return (
    <div className="space">
      {tab === 'classe' && <LiveRoom {...ctx} />}
      {tab === 'annonces' && <Announcements {...ctx} />}
      {tab === 'forum' && <Forum {...ctx} />}
      {tab === 'participants' && <People {...ctx} />}
      {tab === 'notes' && <MyGrades {...ctx} />}
    </div>
  );
}

/* ============================================================ Classe virtuelle */
function LiveRoom({ courseId, slug, canManage }: Ctx) {
  const [reload, setReload] = useState(0);
  const events = useAsync(() => listEvents(courseId), [courseId, reload]);
  const [now, setNow] = useState(Date.now());
  const [editing, setEditing] = useState<Partial<CalEvent> | null>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  if (events.loading) return <div className="skeleton" />;
  if (events.error) return <ErrorNote error={events.error} />;
  const all = events.data!;
  const lives = all.filter((e) => e.kind === 'live');
  const upcoming = lives.filter((e) => liveState(e, now) !== 'ended');
  const past = lives.filter((e) => liveState(e, now) === 'ended').reverse();
  const deadlines = all.filter((e) => e.kind !== 'live' && new Date(e.starts_at).getTime() > now - 86400000);
  const next = upcoming[0];

  return (
    <>
      <div className="space-head">
        <div><h2>Classe virtuelle</h2><p>Les séances en direct avec votre formateur. La salle ouvre 15 minutes avant le début.</p></div>
        {canManage && <button className="btn btn-red btn-sm" onClick={() => setEditing({ kind: 'live', title: '', starts_at: '', location: '' })}>+ Programmer une séance</button>}
      </div>

      {next ? <LiveCard e={next} now={now} featured canManage={canManage} onEdit={() => setEditing(next)} /> : (
        <div className="empty"><strong>Aucune séance programmée pour le moment.</strong>{canManage ? 'Programmez une classe virtuelle : un lien de visioconférence sera proposé aux apprenants.' : 'Votre formateur annoncera ici les prochaines classes virtuelles.'}</div>
      )}
      {upcoming.length > 1 && <><h3 className="space-sub">À venir</h3><div className="live-list">{upcoming.slice(1).map((e) => <LiveCard key={e.id} e={e} now={now} canManage={canManage} onEdit={() => setEditing(e)} />)}</div></>}
      {deadlines.length > 0 && (
        <><h3 className="space-sub">Échéances</h3>
          <ul className="deadlines">{deadlines.map((e) => <li key={e.id}><span className="dl-date">{short(e.starts_at)}</span><b>{e.title}</b>{canManage && <button className="linkbtn" onClick={() => setEditing(e)}>Modifier</button>}</li>)}</ul></>
      )}
      {past.length > 0 && <><h3 className="space-sub">Séances passées</h3><ul className="deadlines past">{past.map((e) => <li key={e.id}><span className="dl-date">{short(e.starts_at)}</span><b>{e.title}</b></li>)}</ul></>}

      {editing && <EventForm courseId={courseId} slug={slug} e={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setReload((n) => n + 1); }} />}
    </>
  );
}

function LiveCard({ e, now, featured, canManage, onEdit }: { e: CalEvent; now: number; featured?: boolean; canManage: boolean; onEdit: () => void }) {
  const st = liveState(e, now);
  const mins = Math.max(0, Math.round((new Date(e.starts_at).getTime() - now) / 60000));
  const until = mins >= 1440 ? `dans ${Math.round(mins / 1440)} j` : mins >= 60 ? `dans ${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` : `dans ${mins} min`;
  const link = isUrl(e.location) ? e.location.trim() : null;
  const joinable = (st === 'open' || st === 'live' || canManage) && link;
  return (
    <article className={`live-card${featured ? ' featured' : ''} ${st}`}>
      <div className="lc-when">
        <span className={`lc-badge ${st}`}>{st === 'live' ? '● En direct' : st === 'open' ? 'La salle est ouverte' : 'Prochaine séance'}</span>
        <b>{fmt(e.starts_at)}</b>
        <small>{e.ends_at ? `jusqu’à ${new Date(e.ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'durée à préciser'}{st === 'upcoming' && ` · ${until}`}</small>
      </div>
      <div className="lc-body">
        <h3>{e.title}</h3>
        {e.description && <p>{e.description}</p>}
        {!link && <p className="hint">{e.location || 'Le lien de connexion sera communiqué par le formateur.'}</p>}
      </div>
      <div className="lc-actions">
        {joinable ? <a className="btn btn-red" href={link!} target="_blank" rel="noreferrer">{st === 'live' ? 'Rejoindre maintenant' : 'Rejoindre la classe'}</a>
          : link ? <button className="btn btn-outline" disabled>Ouverture 15 min avant</button> : null}
        {canManage && <button className="btn btn-outline btn-sm" onClick={onEdit}>Modifier</button>}
      </div>
    </article>
  );
}

function toLocal(s?: string | null) { if (!s) return ''; const d = new Date(s); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }

function EventForm({ courseId, slug, e, onClose, onSaved }: { courseId: string; slug: string; e: Partial<CalEvent>; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ kind: e.kind ?? 'live', title: e.title ?? '', description: e.description ?? '', start: toLocal(e.starts_at), end: toLocal(e.ends_at), location: e.location ?? '' });
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState('');
  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!v.title.trim() || !v.start) { setM('Le titre et la date de début sont obligatoires.'); return; }
    if (v.end && v.end <= v.start) { setM('La fin doit être après le début.'); return; }
    if (v.kind === 'live' && v.location && !isUrl(v.location)) { setM('Le lien doit commencer par https:// (ou laissez vide pour le communiquer plus tard).'); return; }
    setBusy(true); setM('');
    try { await saveEvent(courseId, { id: e.id, kind: v.kind as CalEvent['kind'], title: v.title.trim(), description: v.description.trim(), starts_at: new Date(v.start).toISOString(), ends_at: v.end ? new Date(v.end).toISOString() : null, location: v.location.trim() }); onSaved(); }
    catch (x) { setM(err(x)); setBusy(false); }
  }
  async function remove() { setBusy(true); try { await deleteEvent(e.id!); onSaved(); } catch (x) { setM(err(x)); setBusy(false); } }
  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label="Séance">
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer-panel">
        <header><h2>{e.id ? 'Modifier la séance' : 'Programmer une séance'}</h2><button className="toc-close" onClick={onClose} aria-label="Fermer">×</button></header>
        <div className="drawer-content">
          <form className="form" onSubmit={onSubmit} noValidate>
            <div className="choice-cards">
              {([['live', 'Classe virtuelle', 'Séance en direct en visioconférence'], ['exam', 'Échéance', 'Remise de devoir, examen']] as const).map(([k, l, d]) => (
                <label key={k} className={`choice${v.kind === k ? ' on' : ''}`}><input type="radio" name="kind" checked={v.kind === k} onChange={() => setV({ ...v, kind: k })} /><b>{l}</b><small>{d}</small></label>
              ))}
            </div>
            <div className="field"><label htmlFor="ev-t">Titre</label><input id="ev-t" maxLength={200} value={v.title} onChange={(x) => setV({ ...v, title: x.target.value })} placeholder="Ex. Classe virtuelle – Analyse des parties prenantes" /></div>
            <div className="row2">
              <div className="field"><label htmlFor="ev-s">Début</label><input id="ev-s" type="datetime-local" value={v.start} onChange={(x) => setV({ ...v, start: x.target.value })} /></div>
              <div className="field"><label htmlFor="ev-e">Fin</label><input id="ev-e" type="datetime-local" value={v.end} onChange={(x) => setV({ ...v, end: x.target.value })} /></div>
            </div>
            {v.kind === 'live' && (
              <div className="field">
                <label htmlFor="ev-l">Lien de la visioconférence</label>
                <div className="input-group" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                  <input id="ev-l" maxLength={500} value={v.location} onChange={(x) => setV({ ...v, location: x.target.value })} placeholder="https://meet.google.com/… ou https://zoom.us/j/…" />
                  <button type="button" className="btn btn-navy btn-sm" onClick={() => setV({ ...v, location: jitsiRoom(slug) })}>Créer une salle Jitsi</button>
                </div>
                <span className="hint">Collez un lien Zoom, Google Meet ou Teams, ou créez une salle Jitsi Meet gratuite (sans compte).</span>
              </div>
            )}
            <div className="field"><label htmlFor="ev-d">Description</label><textarea id="ev-d" maxLength={5000} value={v.description} onChange={(x) => setV({ ...v, description: x.target.value })} style={{ minHeight: 100 }} placeholder="Programme de la séance, documents à préparer…" /></div>
            {m && <p className="alert err" role="alert">{m}</p>}
            <div className="af-actions">{e.id && <button type="button" className="linkbtn" style={{ marginRight: 'auto', color: 'var(--red)' }} onClick={remove} disabled={busy}>Supprimer</button>}<button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-red" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ Annonces */
function Announcements({ courseId, userId, canManage }: Ctx) {
  const [reload, setReload] = useState(0);
  const list = useAsync(() => listAnnouncements(courseId), [courseId, reload]);
  const [v, setV] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState('');
  async function post(e: FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) { setM('Donnez un titre à l’annonce.'); return; }
    setBusy(true); setM('');
    try { await postAnnouncement(courseId, userId, v.title.trim(), v.body.trim()); setV({ title: '', body: '' }); setReload((n) => n + 1); } catch (x) { setM(err(x)); } finally { setBusy(false); }
  }
  return (
    <>
      <div className="space-head"><div><h2>Annonces</h2><p>Les informations importantes de votre formateur.</p></div></div>
      {canManage && (
        <form className="space-compose" onSubmit={post} noValidate>
          <div className="field"><label htmlFor="an-t">Nouvelle annonce</label><input id="an-t" maxLength={200} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Titre" /></div>
          <div className="field"><label htmlFor="an-b" className="vh">Message</label><textarea id="an-b" maxLength={20000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} placeholder="Votre message aux apprenants" style={{ minHeight: 100 }} /></div>
          {m && <p className="alert err">{m}</p>}
          <div className="af-actions"><button className="btn btn-red btn-sm" disabled={busy}>{busy ? 'Publication…' : 'Publier l’annonce'}</button></div>
        </form>
      )}
      {list.error ? <ErrorNote error={list.error} /> : list.loading ? <div className="skeleton" /> : list.data!.length === 0 ? <div className="empty"><strong>Aucune annonce.</strong></div> : (
        <div className="ann-list">{list.data!.map((a) => (
          <article key={a.id} className="ann">
            <header><h3>{a.title}</h3><time>{short(a.published_at)}</time></header>
            {a.body && <div className="ch-body" style={{ fontSize: '.98rem' }}>{a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
            {canManage && <button className="linkbtn" style={{ color: 'var(--red)', alignSelf: 'flex-start' }} onClick={async () => { try { await deleteAnnouncement(a.id); setReload((n) => n + 1); } catch (x) { setM(err(x)); } }}>Supprimer</button>}
          </article>
        ))}</div>
      )}
    </>
  );
}

/* ============================================================ Forum */
function Forum({ courseId, userId, canManage, enrolled }: Ctx) {
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const list = useAsync(() => listDiscussions(courseId), [courseId, reload]);
  const [v, setV] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState('');
  async function create(e: FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) { setM('Donnez un titre à votre sujet.'); return; }
    setBusy(true); setM('');
    try { const d = await createDiscussion(courseId, userId, v.title.trim(), v.body.trim()); setV({ title: '', body: '' }); setCompose(false); setReload((n) => n + 1); setOpen(d.id); }
    catch (x) { setM(err(x)); } finally { setBusy(false); }
  }
  if (open) return <Thread id={open} userId={userId} onBack={() => { setOpen(null); setReload((n) => n + 1); }} />;
  return (
    <>
      <div className="space-head"><div><h2>Forum</h2><p>Posez vos questions et échangez avec les autres apprenants et le formateur.</p></div>
        {(enrolled || canManage) && <button className="btn btn-red btn-sm" onClick={() => setCompose(!compose)}>{compose ? 'Annuler' : '+ Nouveau sujet'}</button>}</div>
      {compose && (
        <form className="space-compose" onSubmit={create} noValidate>
          <div className="field"><label htmlFor="fd-t">Titre du sujet</label><input id="fd-t" maxLength={200} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
          <div className="field"><label htmlFor="fd-b">Message</label><textarea id="fd-b" maxLength={20000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} style={{ minHeight: 120 }} /></div>
          {m && <p className="alert err">{m}</p>}
          <div className="af-actions"><button className="btn btn-red btn-sm" disabled={busy}>{busy ? 'Envoi…' : 'Publier le sujet'}</button></div>
        </form>
      )}
      {list.error ? <ErrorNote error={list.error} /> : list.loading ? <div className="skeleton" /> : list.data!.length === 0 ? <div className="empty"><strong>Aucun sujet pour l’instant.</strong>Lancez la première discussion.</div> : (
        <ul className="forum-list">{list.data!.map((d) => (
          <li key={d.id}><button onClick={() => setOpen(d.id)}>
            <div><b>{d.is_pinned && <span className="pin">Épinglé</span>}{d.title}</b><small>par {d.author} · {short(d.created_at)}{d.is_locked ? ' · fermé' : ''}{d.is_hidden ? ' · masqué' : ''}</small></div>
            <span className="replies">{d.reply_count} réponse{d.reply_count > 1 ? 's' : ''}<small>{short(d.last_post_at)}</small></span>
          </button></li>
        ))}</ul>
      )}
    </>
  );
}

function Thread({ id, userId, onBack }: { id: string; userId: string; onBack: () => void }) {
  const [reload, setReload] = useState(0);
  const d = useAsync(() => getDiscussion(id), [id, reload]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState('');
  if (d.loading && !d.data) return <div className="skeleton" />;
  if (d.error) return <ErrorNote error={d.error} />;
  const t = d.data!;
  async function reply(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true); setM('');
    try { await replyDiscussion({ id: t.id, course_id: (t as any).course_id }, userId, body.trim(), null); setBody(''); setReload((n) => n + 1); } catch (x) { setM(err(x)); } finally { setBusy(false); }
  }
  const mod = async (f: { pinned?: boolean; locked?: boolean; hidden?: boolean }) => { try { await moderate(t.id, f); setReload((n) => n + 1); } catch (x) { setM(err(x)); } };
  return (
    <div className="thread">
      <button className="back-link linkbtn" style={{ textDecoration: 'none' }} onClick={onBack}>← Tous les sujets</button>
      <article className="post first">
        <header><b>{t.author}</b><time>{short(t.created_at)}</time></header>
        <h2>{t.title}</h2>
        {t.body && <div className="ch-body" style={{ fontSize: '.98rem' }}>{t.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
        {t.can_moderate && (
          <div className="btns" style={{ marginTop: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => mod({ pinned: !t.is_pinned })}>{t.is_pinned ? 'Désépingler' : 'Épingler'}</button>
            <button className="btn btn-outline btn-sm" onClick={() => mod({ locked: !t.is_locked })}>{t.is_locked ? 'Rouvrir' : 'Fermer le sujet'}</button>
            <button className="btn btn-outline btn-sm" onClick={() => mod({ hidden: !t.is_hidden })}>{t.is_hidden ? 'Afficher' : 'Masquer'}</button>
          </div>
        )}
      </article>
      {t.posts.map((p) => (
        <article key={p.id} className={`post${p.author_id === userId ? ' mine' : ''}${p.is_hidden ? ' hidden-item' : ''}`}>
          <header><b>{p.author}</b><time>{short(p.created_at)}</time></header>
          <p style={{ whiteSpace: 'pre-line' }}>{p.body}</p>
        </article>
      ))}
      {t.can_post ? (
        <form className="space-compose" onSubmit={reply} noValidate>
          <div className="field"><label htmlFor="rp">Votre réponse</label><textarea id="rp" maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 100 }} /></div>
          {m && <p className="alert err">{m}</p>}
          <div className="af-actions"><button className="btn btn-red btn-sm" disabled={busy || !body.trim()}>{busy ? 'Envoi…' : 'Répondre'}</button></div>
        </form>
      ) : <p className="hint">{t.is_locked ? 'Ce sujet est fermé aux nouvelles réponses.' : 'Vous ne pouvez pas répondre à ce sujet.'}</p>}
    </div>
  );
}

/* ============================================================ Participants */
function People({ courseId }: Ctx) {
  const p = useAsync(() => participants(courseId), [courseId]);
  if (p.loading) return <div className="skeleton" />;
  if (p.error) return <ErrorNote error={p.error} />;
  const d = p.data!;
  const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  return (
    <>
      <div className="space-head"><div><h2>Participants</h2><p>{d.teachers.length} formateur{d.teachers.length > 1 ? 's' : ''} · {d.students.length} apprenant{d.students.length > 1 ? 's' : ''}</p></div></div>
      <h3 className="space-sub">Formateurs</h3>
      {d.teachers.length === 0 ? <p className="hint">Aucun formateur rattaché à ce cours.</p> : <ul className="people">{d.teachers.map((t) => <li key={t.user_id}><span className="av-s">{initials(t.name)}</span><div><b>{t.name}</b><small>{t.role === 'lead' ? 'Responsable du cours' : 'Formateur'}{t.email ? ` · ${t.email}` : ''}</small></div></li>)}</ul>}
      <h3 className="space-sub">Apprenants</h3>
      {d.students.length === 0 ? <p className="hint">Aucun apprenant inscrit.</p> : (
        <ul className="people">{d.students.map((s) => (
          <li key={s.user_id}><span className="av-s light">{initials(s.name)}</span><div><b>{s.name}</b>{d.can_manage && <small>{s.email} · {s.completed_lessons ?? 0} / {d.total_lessons} étapes · dernier accès {s.last_access_at ? short(s.last_access_at) : 'jamais'}</small>}</div>
            {d.can_manage && d.total_lessons > 0 && <div className="progress" style={{ width: 90, marginTop: 0 }}><i style={{ width: `${Math.round(100 * (s.completed_lessons ?? 0) / d.total_lessons)}%` }} /></div>}
          </li>
        ))}</ul>
      )}
    </>
  );
}

/* ============================================================ Notes */
function MyGrades({ courseId, enrolled }: Ctx) {
  const g = useAsync(() => (enrolled ? myGrades(courseId) : Promise.resolve(null)), [courseId, enrolled]);
  if (!enrolled) return <div className="empty"><strong>Le carnet de notes est réservé aux apprenants inscrits.</strong>Les formateurs corrigent depuis leur espace.</div>;
  if (g.loading) return <div className="skeleton" />;
  if (g.error) return <ErrorNote error={g.error} />;
  const d = g.data!;
  return (
    <>
      <div className="space-head"><div><h2>Mes notes</h2><p>Note de passage : {d.pass_mark} %</p></div>{d.final_percent !== null && <div className="final-grade"><small>Moyenne</small><b>{Math.round(d.final_percent)} %</b></div>}</div>
      {d.items.length === 0 ? <div className="empty"><strong>Aucune évaluation notée pour ce cours.</strong></div> : (
        <ul className="grades">{d.items.map((i) => (
          <li key={i.id}><div><b>{i.title}</b><small>{i.source === 'quiz' ? 'Quiz' : i.source === 'assignment' ? 'Activité' : 'Évaluation'} · coefficient {i.weight}</small>{i.feedback && <p className="req-note" style={{ marginTop: 6 }}>{i.feedback}</p>}</div>
            <span className={`g-score ${i.state}`}>{i.state === 'released' ? `${i.points} / ${i.max_points}` : i.state === 'pending' ? 'En correction' : '—'}</span></li>
        ))}</ul>
      )}
    </>
  );
}
