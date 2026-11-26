import { useState } from 'react';
import { useAsync, usePageMeta } from '../../lib/hooks';
import { cvUrl, decideTeacherApplication, listTeacherApplications, teacherError } from '../../lib/teacher';
import { ErrorNote } from '../../components/ui';
import { AdminShell } from './AdminShell';

const STATUS: Record<string, [string, string]> = { pending: ['En attente', 'soon'], approved: ['Acceptée', 'open'], rejected: ['Refusée', 'closed'], withdrawn: ['Retirée', 'closed'] };

/** Demandes pour enseigner : l'admin accepte (rôle formateur, et faculté pour l'université) ou refuse. */
export default function AdminEnseignants() {
  usePageMeta('Enseignants · Administration');
  const [status, setStatus] = useState('pending');
  const [reload, setReload] = useState(0);
  const apps = useAsync(() => listTeacherApplications(status), [status, reload]);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; t: string } | null>(null);

  async function decide(id: string, approve: boolean) {
    setBusy(id); setNote(null);
    try { await decideTeacherApplication(id, approve, msgs[id] ?? ''); setNote({ ok: true, t: approve ? 'Demande acceptée : la personne peut maintenant créer des cours.' : 'Demande refusée.' }); setReload((n) => n + 1); }
    catch (e) { setNote({ ok: false, t: teacherError(e) }); } finally { setBusy(null); }
  }
  async function openCv(path: string) { try { window.open(await cvUrl(path), '_blank', 'noopener'); } catch (e) { setNote({ ok: false, t: teacherError(e) }); } }

  return (
    <AdminShell title="Demandes d’enseignants">
      <p className="lede" style={{ marginTop: 0 }}>Accepter une demande donne le rôle <b>formateur</b> ; pour une demande universitaire, la personne est aussi rattachée à la faculté et peut créer des unités d’enseignement pour ses programmes. Les cours créés restent en brouillon jusqu’à votre publication.</p>
      <div className="chips" role="group" aria-label="Statut" style={{ margin: '0 0 16px' }}>
        {[['pending', 'En attente'], ['approved', 'Acceptées'], ['rejected', 'Refusées'], ['', 'Toutes']].map(([v, l]) => <button key={v} className="chip" aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>)}
      </div>
      {note && <p className={`alert ${note.ok ? 'ok' : 'err'}`} role="status">{note.t}</p>}
      {apps.error ? <ErrorNote error={apps.error} /> : apps.loading ? <div className="skeleton" /> : apps.data!.length === 0 ? <p className="empty"><strong>Aucune demande.</strong></p> : (
        <div className="req-grid">
          {apps.data!.map((a) => (
            <article key={a.id} className="req-card">
              <header><b>{a.name}</b><span className={`status ${STATUS[a.status][1]}`}>{STATUS[a.status][0]}</span></header>
              <dl>
                <dt>Demande</dt><dd>{a.kind === 'trainer' ? 'Formateur' : 'Professeur d’université'}</dd>
                {a.kind === 'university' && <><dt>Faculté</dt><dd>{a.faculty}</dd></>}
                <dt>E-mail</dt><dd>{a.email}</dd>
                <dt>Expertise</dt><dd>{a.expertise}</dd>
                <dt>Date</dt><dd>{new Date(a.created_at).toLocaleDateString('fr-FR')}</dd>
              </dl>
              {a.motivation && <p className="req-note" style={{ whiteSpace: 'pre-line' }}>{a.motivation}</p>}
              {a.cv_path ? <button className="btn btn-outline btn-sm" onClick={() => openCv(a.cv_path!)}>Ouvrir le CV{a.cv_name ? ` (${a.cv_name})` : ''}</button> : <p className="hint">Pas de CV joint.</p>}
              {a.status === 'pending' ? (
                <>
                  <div className="field"><label htmlFor={`tm${a.id}`}>Message au candidat</label><input id={`tm${a.id}`} maxLength={1000} value={msgs[a.id] ?? ''} onChange={(e) => setMsgs({ ...msgs, [a.id]: e.target.value })} /></div>
                  <div className="btns">
                    <button className="btn btn-red btn-sm" disabled={busy === a.id} onClick={() => decide(a.id, true)}>Accepter</button>
                    <button className="btn btn-outline btn-sm" disabled={busy === a.id} onClick={() => decide(a.id, false)}>Refuser</button>
                  </div>
                </>
              ) : a.admin_message && <p className="hint">Réponse : {a.admin_message}</p>}
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
