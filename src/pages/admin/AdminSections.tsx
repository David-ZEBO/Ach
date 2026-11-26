import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useAsync, usePageMeta } from '../../lib/hooks';
import { formatPrice } from '../../lib/format';
import {
  dashboardStats, decideEnrollmentRequest, documentUrl, grantEnrollment, listAdminCourses, listApplications, listCertificates, listEnrollmentRequests,
  listMessages, listUsers, processApplication, revokeEnrollment, rpcError, setAccountStatus, setCertificateStatus, setMessageStatus, setRole, userEnrollments,
  type AdminApplication, type AdminUser, type Role,
} from '../../lib/admin';
import { ErrorNote } from '../../components/ui';
import { AdminShell } from './AdminShell';

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const ROLE_LABEL: Record<Role, string> = { learner: 'Apprenant', instructor: 'Formateur', admin: 'Administrateur', support: 'Support' };

function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, success: string, after?: () => void) => {
    setBusy(key); setMsg(null);
    try { await fn(); setMsg({ ok: true, t: success }); after?.(); } catch (e) { setMsg({ ok: false, t: rpcError(e) }); } finally { setBusy(null); }
  };
  return { busy, msg, run, Msg: () => (msg ? <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p> : null) };
}

function Filters({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label} style={{ margin: '0 0 16px' }}>
      {options.map(([v, l]) => <button key={v} className="chip" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

/* ============================================================ Tableau de bord */
export function AdminDashboard() {
  usePageMeta('Administration');
  const s = useAsync(dashboardStats, []);
  const d = s.data;
  return (
    <AdminShell title="Tableau de bord">
      {s.error ? <ErrorNote error={s.error} /> : !d ? <div className="skeleton" /> : (
        <>
          <div className="kpi-row">
            <div><small>Apprenants</small><b>{d.learners}</b></div>
            <div><small>Inscriptions actives</small><b>{d.enrollments}</b></div>
            <div><small>Formations publiées</small><b>{d.courses.published}</b><em>{d.courses.draft} brouillon{d.courses.draft > 1 ? 's' : ''} · {d.courses.demo} démo</em></div>
            <div><small>Commandes payées</small><b>{d.orders.paid}</b><em>{d.orders.pending} en attente</em></div>
            <div><small>Chiffre d’affaires</small><b>{d.revenue.filter((r) => r.livemode).map((r) => formatPrice(r.amount, r.currency)).join(' · ') || '—'}</b><em>paiements réels</em></div>
          </div>
          <div className="admin-cards" style={{ marginTop: 18 }}>
            <Link className="admin-card" to="/admin/candidatures"><b>Candidatures</b><em>Étudier les dossiers →</em></Link>
            <Link className="admin-card" to="/admin/inscriptions"><b>Demandes d’inscription</b><em>Valider les paiements →</em></Link>
            <Link className="admin-card" to="/admin/formations"><b>Formations</b><em>Gérer les cours →</em></Link>
            <Link className="admin-card" to="/admin/actualites"><b>Actualités</b><em>Publier une actualité →</em></Link>
            <Link className="admin-card" to="/admin/messages"><b>Messages</b><em>Répondre aux contacts →</em></Link>
          </div>
          <section className="af-section" style={{ marginTop: 18 }}>
            <h2>Activité récente</h2>
            {d.recent_activity.length === 0 ? <p className="hint">Aucune activité enregistrée.</p> : (
              <ul className="activity-log">{d.recent_activity.map((a) => <li key={a.id}><span>{new Date(a.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span><b>{a.action.replace(/_/g, ' ')}</b><em>{a.entity_type}</em><small>{a.actor_email ?? 'système'}</small></li>)}</ul>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}

/* ============================================================ Utilisateurs */
export function AdminUsers() {
  usePageMeta('Utilisateurs · Administration');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [role, setRoleF] = useState<Role | ''>('');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const users = useAsync(() => listUsers({ search: q, role, limit: 25, offset: page * 25 }), [q, role, page, reload]);
  const total = users.data?.total ?? 0;
  return (
    <AdminShell title="Utilisateurs">
      <form className="admin-tools" onSubmit={(e) => { e.preventDefault(); setPage(0); setQ(search.trim()); }}>
        <div className="field"><label htmlFor="us" className="vh">Rechercher</label><input id="us" type="search" placeholder="Nom ou adresse e-mail…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="field"><label htmlFor="ur" className="vh">Rôle</label><select id="ur" value={role} onChange={(e) => { setPage(0); setRoleF(e.target.value as Role | ''); }}><option value="">Tous les rôles</option>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}s</option>)}</select></div>
        <button className="btn btn-navy">Rechercher</button>
      </form>
      {users.error ? <ErrorNote error={users.error} /> : users.loading ? <div className="skeleton" /> : (
        <>
          <p className="count">{total} utilisateur{total > 1 ? 's' : ''}</p>
          <ul className="admin-list">
            {users.data!.items.map((u) => (
              <li key={u.id} className={open === u.id ? 'open' : ''}>
                <button className="al-row" onClick={() => setOpen(open === u.id ? null : u.id)} aria-expanded={open === u.id}>
                  <div className="al-main"><b>{`${u.first_name} ${u.last_name}`.trim() || 'Sans nom'}</b><small>{u.email} · inscrit le {date(u.created_at)}</small></div>
                  <div className="al-side">{u.roles.filter((r) => r !== 'learner').map((r) => <span key={r} className="tag-demo">{ROLE_LABEL[r]}</span>)}<span className={`status ${u.status === 'active' ? 'open' : u.status === 'pending' ? 'soon' : 'closed'}`}>{u.status === 'active' ? 'Actif' : u.status === 'pending' ? 'En attente' : 'Suspendu'}</span></div>
                </button>
                {open === u.id && <UserPanel u={u} onChange={() => setReload((n) => n + 1)} />}
              </li>
            ))}
            {users.data!.items.length === 0 && <li className="al-empty">Aucun utilisateur ne correspond.</li>}
          </ul>
          {total > 25 && <div className="pager"><button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>← Précédents</button><span>Page {page + 1} / {Math.ceil(total / 25)}</span><button className="btn btn-outline btn-sm" disabled={(page + 1) * 25 >= total} onClick={() => setPage(page + 1)}>Suivants →</button></div>}
        </>
      )}
    </AdminShell>
  );
}

function UserPanel({ u, onChange }: { u: AdminUser; onChange: () => void }) {
  const { session } = useAuth();
  const a = useAction();
  const [reload, setReload] = useState(0);
  const enr = useAsync(() => userEnrollments(u.id), [u.id, reload]);
  const courses = useAsync(listAdminCourses, []);
  const [course, setCourse] = useState('');
  const self = session?.user.id === u.id;
  const fr = (arr: any[] | undefined) => arr?.find((x) => x.language === 'fr')?.title ?? arr?.[0]?.title ?? '';
  return (
    <div className="al-panel">
      <div className="al-grid">
        <div>
          <h3>Rôles</h3>
          <div className="check-row">
            {(['instructor', 'admin', 'support'] as Role[]).map((r) => (
              <label key={r} className="check"><input type="checkbox" checked={u.roles.includes(r)} disabled={!!a.busy || (self && r === 'admin')}
                onChange={(e) => a.run(r, () => setRole(u.id, r, e.target.checked), e.target.checked ? `Rôle ${ROLE_LABEL[r]} ajouté.` : `Rôle ${ROLE_LABEL[r]} retiré.`, onChange)} /> <span>{ROLE_LABEL[r]}</span></label>
            ))}
          </div>
          <h3 style={{ marginTop: 16 }}>Compte</h3>
          {u.status === 'suspended'
            ? <button className="btn btn-outline btn-sm" disabled={!!a.busy} onClick={() => a.run('st', () => setAccountStatus(u.id, 'active'), 'Compte réactivé.', onChange)}>Réactiver le compte</button>
            : <button className="btn btn-outline btn-sm" disabled={!!a.busy || self} onClick={() => a.run('st', () => setAccountStatus(u.id, 'suspended', 'Suspendu par un administrateur'), 'Compte suspendu.', onChange)}>Suspendre le compte</button>}
        </div>
        <div>
          <h3>Formations</h3>
          {enr.loading ? <p className="hint">Chargement…</p> : (enr.data ?? []).length === 0 ? <p className="hint">Aucune inscription.</p> : (
            <ul className="mini-list">{enr.data!.map((e) => (
              <li key={e.id}><span>{fr(e.courses?.course_translations)} <small>({e.status === 'active' ? 'active' : e.status}, {e.source})</small></span>
                {e.status === 'active' && <button className="linkbtn" disabled={!!a.busy} onClick={() => a.run(e.id, () => revokeEnrollment(e.id), 'Accès retiré.', () => setReload((n) => n + 1))}>Retirer l’accès</button>}</li>
            ))}</ul>
          )}
          <div className="input-group" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', marginTop: 10 }}>
            <select aria-label="Formation à attribuer" value={course} onChange={(e) => setCourse(e.target.value)} className="qe-opt-text"><option value="">Inscrire à une formation…</option>{(courses.data ?? []).filter((c) => c.status === 'published').map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <button className="btn btn-navy btn-sm" disabled={!course || !!a.busy} onClick={() => a.run('grant', () => grantEnrollment(u.id, course), 'Inscription ajoutée.', () => { setCourse(''); setReload((n) => n + 1); })}>Inscrire</button>
          </div>
        </div>
      </div>
      <a.Msg />
    </div>
  );
}

/* ============================================================ Demandes d'inscription */
export function AdminEnrollmentRequests() {
  usePageMeta('Inscriptions · Administration');
  const [status, setStatus] = useState('pending');
  const [reload, setReload] = useState(0);
  const reqs = useAsync(() => listEnrollmentRequests(status || null), [status, reload]);
  const a = useAction();
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const METHOD: Record<string, string> = { mobile_money: 'Mobile money', bank_transfer: 'Virement', cash: 'Espèces', other: 'Autre' };
  return (
    <AdminShell title="Demandes d’inscription">
      <p className="lede" style={{ marginTop: 0 }}>Paiements déclarés par les apprenants (mobile money, virement, espèces). Vérifiez la référence avant d’accepter : l’accès au cours est ouvert immédiatement.</p>
      <Filters label="Statut" value={status} onChange={setStatus} options={[['pending', 'En attente'], ['approved', 'Acceptées'], ['rejected', 'Refusées'], ['', 'Toutes']]} />
      <a.Msg />
      {reqs.error ? <ErrorNote error={reqs.error} /> : reqs.loading ? <div className="skeleton" /> : reqs.data!.length === 0 ? <p className="empty"><strong>Aucune demande.</strong></p> : (
        <div className="req-grid">
          {reqs.data!.map((r) => (
            <article key={r.id} className="req-card">
              <header><b>{r.student}</b><span className={`status ${r.status === 'approved' ? 'open' : r.status === 'pending' ? 'soon' : 'closed'}`}>{r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Acceptée' : r.status === 'rejected' ? 'Refusée' : 'Annulée'}</span></header>
              <dl>
                <dt>Formation</dt><dd>{r.course}</dd>
                <dt>Montant</dt><dd>{formatPrice(r.amount, r.currency)}</dd>
                <dt>Moyen</dt><dd>{METHOD[r.payment_method] ?? r.payment_method}</dd>
                <dt>Référence</dt><dd><code>{r.payment_reference}</code></dd>
                <dt>E-mail</dt><dd>{r.email}</dd>
                <dt>Date</dt><dd>{date(r.created_at)}</dd>
              </dl>
              {r.note && <p className="req-note">« {r.note} »</p>}
              {r.status === 'pending' ? (
                <>
                  <div className="field"><label htmlFor={`m${r.id}`}>Message à l’apprenant (facultatif)</label><input id={`m${r.id}`} maxLength={1000} value={msgs[r.id] ?? ''} onChange={(e) => setMsgs({ ...msgs, [r.id]: e.target.value })} /></div>
                  <div className="btns">
                    <button className="btn btn-red btn-sm" disabled={!!a.busy} onClick={() => a.run(r.id, () => decideEnrollmentRequest(r.id, true, msgs[r.id] ?? ''), 'Demande acceptée : l’apprenant a accès au cours.', () => setReload((n) => n + 1))}>Accepter</button>
                    <button className="btn btn-outline btn-sm" disabled={!!a.busy} onClick={() => a.run(r.id, () => decideEnrollmentRequest(r.id, false, msgs[r.id] ?? ''), 'Demande refusée.', () => setReload((n) => n + 1))}>Refuser</button>
                  </div>
                </>
              ) : r.admin_message && <p className="hint">Réponse : {r.admin_message}</p>}
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

/* ============================================================ Candidatures */
const APP_STATUS: Record<string, [string, string]> = {
  submitted: ['Reçue', 'soon'], reviewing: ['En cours d’étude', 'soon'], preselected: ['Présélectionnée', 'soon'], dossier_submitted: ['Dossier complet reçu', 'soon'],
  accepted: ['Admis', 'open'], rejected: ['Non retenue', 'closed'], withdrawn: ['Retirée', 'closed'],
};
const FEE: Record<string, string> = { not_required: 'Sans frais', pending: 'Frais à payer', declared: 'Paiement déclaré', confirmed: 'Frais confirmés', waived: 'Frais exonérés' };
const EDU: Record<string, string> = { secondary: 'Secondaire', bac: 'Diplôme d’État', bachelor: 'Licence', master: 'Master', doctorate: 'Doctorat', other: 'Autre' };

export function AdminApplications() {
  usePageMeta('Candidatures · Administration');
  const [status, setStatus] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const apps = useAsync(() => listApplications(status), [status, reload]);
  return (
    <AdminShell title="Candidatures aux programmes">
      <Filters label="Statut" value={status} onChange={setStatus} options={[['', 'Toutes'], ['submitted', 'Reçues'], ['reviewing', 'En étude'], ['preselected', 'Présélectionnées'], ['dossier_submitted', 'Dossiers reçus'], ['accepted', 'Admis'], ['rejected', 'Non retenues']]} />
      {apps.error ? <ErrorNote error={apps.error} /> : apps.loading ? <div className="skeleton" /> : apps.data!.length === 0 ? <p className="empty"><strong>Aucune candidature.</strong></p> : (
        <ul className="admin-list">
          {apps.data!.map((x) => (
            <li key={x.id} className={open === x.id ? 'open' : ''}>
              <button className="al-row" onClick={() => setOpen(open === x.id ? null : x.id)} aria-expanded={open === x.id}>
                <div className="al-main"><b>{x.first_name} {x.last_name}</b><small>{x.programme} · {date(x.created_at)} · {x.country}</small></div>
                <div className="al-side"><span className="tag-demo">{FEE[x.fee_status] ?? x.fee_status}</span><span className={`status ${APP_STATUS[x.status]?.[1]}`}>{APP_STATUS[x.status]?.[0] ?? x.status}</span></div>
              </button>
              {open === x.id && <ApplicationPanel x={x} onChange={() => setReload((n) => n + 1)} />}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

function ApplicationPanel({ x, onChange }: { x: AdminApplication; onChange: () => void }) {
  const a = useAction();
  const [message, setMessage] = useState('');
  const [note, setNote] = useState(x.admin_note);
  // Actions possibles selon l'état, comme dans admin_process_application.
  const actions: [string, string, 'red' | 'outline'][] = [];
  if (x.status === 'submitted') actions.push(['review', 'Passer en étude', 'outline']);
  if (['submitted', 'reviewing'].includes(x.status)) actions.push(['preselect', 'Présélectionner (demander le dossier)', 'red']);
  if (x.status === 'dossier_submitted') actions.push(['approve', 'Admettre', 'red'], ['request_changes', 'Demander des corrections', 'outline']);
  if (['pending', 'declared'].includes(x.fee_status)) actions.push(['confirm_payment', 'Confirmer les frais', 'outline'], ['waive_fee', 'Exonérer des frais', 'outline']);
  if (['submitted', 'reviewing', 'preselected', 'dossier_submitted'].includes(x.status)) actions.push(['reject', 'Ne pas retenir', 'outline']);
  const label = Object.fromEntries(actions.map(([k, l]) => [k, l]));
  async function open(path: string) { try { window.open(await documentUrl(path), '_blank', 'noopener'); } catch (e) { alert(rpcError(e)); } }
  return (
    <div className="al-panel">
      <div className="al-grid">
        <div>
          <h3>Candidat</h3>
          <dl className="kv"><dt>Téléphone</dt><dd>{x.phone}</dd><dt>Lieu</dt><dd>{[x.city, x.country].filter(Boolean).join(', ')}</dd><dt>Niveau</dt><dd>{EDU[x.education_level] ?? x.education_level}</dd><dt>Dossier</dt><dd>{x.dossier_submitted_at ? `reçu le ${date(x.dossier_submitted_at)}` : 'non envoyé'}</dd></dl>
          {x.motivation && <><h3 style={{ marginTop: 12 }}>Motivation</h3><p className="req-note" style={{ whiteSpace: 'pre-line' }}>{x.motivation}</p></>}
          <h3 style={{ marginTop: 12 }}>Pièces</h3>
          {x.documents.length === 0 ? <p className="hint">Aucune pièce déposée.</p> : <ul className="mini-list">{x.documents.map((d) => <li key={d.file_path}><span>{d.kind}</span><button className="linkbtn" onClick={() => open(d.file_path)}>{d.file_name || 'Ouvrir'}</button></li>)}</ul>}
        </div>
        <div>
          <h3>Décision</h3>
          <div className="field"><label htmlFor={`am${x.id}`}>Message au candidat</label><textarea id={`am${x.id}`} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} style={{ minHeight: 90 }} placeholder="Visible par le candidat dans son espace" /></div>
          <div className="field"><label htmlFor={`an${x.id}`}>Note interne</label><input id={`an${x.id}`} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {actions.length === 0 ? <p className="hint">Aucune action possible : la candidature est clôturée.</p> : (
            <div className="btns">{actions.map(([k, l, tone]) => <button key={k} className={`btn btn-${tone} btn-sm`} disabled={!!a.busy} onClick={() => a.run(k, () => processApplication(x.id, k, message.trim(), note), `Action effectuée : ${label[k]}.`, onChange)}>{a.busy === k ? '…' : l}</button>)}</div>
          )}
          <a.Msg />
        </div>
      </div>
    </div>
  );
}

/* ============================================================ Certificats */
export function AdminCertificates() {
  usePageMeta('Certificats · Administration');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [reload, setReload] = useState(0);
  const certs = useAsync(() => listCertificates(q), [q, reload]);
  const a = useAction();
  const [reason, setReason] = useState<Record<string, string>>({});
  return (
    <AdminShell title="Certificats délivrés">
      <form className="admin-tools" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }} onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); }}>
        <div className="field"><label htmlFor="cs" className="vh">Rechercher</label><input id="cs" type="search" placeholder="Code ou nom de l’apprenant…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <button className="btn btn-navy">Rechercher</button>
      </form>
      <a.Msg />
      {certs.error ? <ErrorNote error={certs.error} /> : certs.loading ? <div className="skeleton" /> : certs.data!.length === 0 ? <p className="empty"><strong>Aucun certificat.</strong></p> : (
        <ul className="admin-list">
          {certs.data!.map((c) => (
            <li key={c.id}><div className="al-row static">
              <div className="al-main"><b>{c.learner_name}</b><small>{c.course_title} · {date(c.issued_at)} · <code>{c.code}</code>{c.revoked_reason ? ` · ${c.revoked_reason}` : ''}</small></div>
              <div className="al-side">
                <span className={`status ${c.status === 'active' ? 'open' : 'closed'}`}>{c.status === 'active' ? 'Valide' : 'Révoqué'}</span>
                {c.status === 'active' ? (
                  <><input className="qe-opt-text" style={{ width: 180 }} placeholder="Motif de révocation" aria-label="Motif" value={reason[c.id] ?? ''} onChange={(e) => setReason({ ...reason, [c.id]: e.target.value })} />
                    <button className="btn btn-outline btn-sm" disabled={!!a.busy || !(reason[c.id] ?? '').trim()} onClick={() => a.run(c.id, () => setCertificateStatus(c.id, true, reason[c.id]), 'Certificat révoqué.', () => setReload((n) => n + 1))}>Révoquer</button></>
                ) : <button className="btn btn-outline btn-sm" disabled={!!a.busy} onClick={() => a.run(c.id, () => setCertificateStatus(c.id, false, ''), 'Certificat rétabli.', () => setReload((n) => n + 1))}>Rétablir</button>}
              </div>
            </div></li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

/* ============================================================ Messages */
export function AdminMessages() {
  usePageMeta('Messages · Administration');
  const { session } = useAuth();
  const [status, setStatus] = useState('new');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const msgs = useAsync(() => listMessages(status), [status, reload]);
  const a = useAction();
  const SUBJ: Record<string, string> = { course: 'Formation', enrollment: 'Inscription / candidature', organization: 'Organisation', other: 'Autre' };
  return (
    <AdminShell title="Messages de contact">
      <Filters label="Statut" value={status} onChange={setStatus} options={[['new', 'Nouveaux'], ['read', 'Traités'], ['archived', 'Archivés'], ['', 'Tous']]} />
      <a.Msg />
      {msgs.error ? <ErrorNote error={msgs.error} /> : msgs.loading ? <div className="skeleton" /> : msgs.data!.length === 0 ? <p className="empty"><strong>Aucun message.</strong></p> : (
        <ul className="admin-list">
          {msgs.data!.map((m) => (
            <li key={m.id} className={open === m.id ? 'open' : ''}>
              <button className="al-row" onClick={() => setOpen(open === m.id ? null : m.id)} aria-expanded={open === m.id}>
                <div className="al-main"><b>{m.name}</b><small>{SUBJ[m.subject] ?? m.subject} · {date(m.created_at)} · {m.email}</small></div>
                <div className="al-side"><span className={`status ${m.status === 'new' ? 'soon' : m.status === 'read' ? 'open' : 'closed'}`}>{m.status === 'new' ? 'Nouveau' : m.status === 'read' ? 'Traité' : 'Archivé'}</span></div>
              </button>
              {open === m.id && (
                <div className="al-panel">
                  <p className="req-note" style={{ whiteSpace: 'pre-line' }}>{m.message}</p>
                  <div className="btns" style={{ marginTop: 12 }}>
                    <a className="btn btn-red btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Votre message à l’Académie du Capital Humain')}`}>Répondre par e-mail</a>
                    {m.status !== 'read' && <button className="btn btn-outline btn-sm" disabled={!!a.busy} onClick={() => a.run(m.id, () => setMessageStatus(m.id, 'read', session!.user.id), 'Message marqué comme traité.', () => setReload((n) => n + 1))}>Marquer comme traité</button>}
                    {m.status !== 'archived' && <button className="btn btn-outline btn-sm" disabled={!!a.busy} onClick={() => a.run(m.id, () => setMessageStatus(m.id, 'archived', session!.user.id), 'Message archivé.', () => setReload((n) => n + 1))}>Archiver</button>}
                    {m.status !== 'new' && <button className="linkbtn" disabled={!!a.busy} onClick={() => a.run(m.id, () => setMessageStatus(m.id, 'new', session!.user.id), 'Message remis en « nouveau ».', () => setReload((n) => n + 1))}>Remettre en nouveau</button>}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
