import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useAsync, usePageMeta } from '../lib/hooks';
import { getProgress, listMyCertificates, type Certificate } from '../lib/learn';
import { downloadCertificate, isAdmin } from '../lib/certificate';
import { Empty, ErrorNote } from '../components/ui';

const APP_STATUS: Record<string, string> = {
  submitted: 'Envoyée', reviewing: 'En cours d’étude', preselected: 'Présélectionnée : dossier à compléter', dossier_submitted: 'Dossier envoyé', accepted: 'Admis', rejected: 'Non retenue', withdrawn: 'Retirée',
};
const fr = (arr: any[] | undefined, k: string) => arr?.find((x) => x.language === 'fr')?.[k] ?? arr?.[0]?.[k] ?? '';

/** Mon compte : profil, formations suivies avec progression, certificats et candidatures (droits de l'apprenant, RLS). */
export default function Espace() {
  const { session, ready } = useAuth();
  usePageMeta('Mon compte');
  const data = useAsync(async () => {
    if (!session) return null;
    const uid = session.user.id;
    const [profile, enr, apps, certs] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, email').eq('id', uid).maybeSingle(),
      supabase.from('enrollments').select('id, status, course_id, created_at, courses(slug, course_translations(title, language))').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('programme_applications').select('id, status, created_at, programmes(programme_translations(name, language))').eq('user_id', uid).order('created_at', { ascending: false }),
      listMyCertificates(),
    ]);
    for (const r of [profile, enr, apps]) if (r.error) throw r.error;
    const active = (enr.data as any[]).filter((e) => e.status === 'active');
    const progress = await Promise.all(active.map((e) => getProgress(e.course_id).catch(() => null)));
    const admin = await isAdmin(uid);
    return { admin, profile: profile.data, enr: active.map((e, i) => ({ ...e, progress: progress[i] })), apps: apps.data as any[], certs };
  }, [session?.user.id]);

  if (!ready) return null;
  if (!session) return <Navigate to="/connexion?retour=/mon-compte" replace />;
  const d = data.data;

  return (
    <section className="sec soft" style={{ minHeight: '70vh' }}>
      <div className="wrap">
        <div className="sec-head">
          <div><span className="eyebrow">Mon compte</span><h1 className="h2">Bonjour {d?.profile?.first_name || session.user.email}</h1></div>
          <button className="btn btn-outline btn-sm" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
        {data.error ? <ErrorNote error={data.error} /> : data.loading || !d ? <div className="skeleton" /> : (
          <div className="account">
            <div className="acc-card wide">
              <h2>Mes formations</h2>
              {d.enr.length === 0 ? <Empty title="Vous n’êtes inscrit à aucune formation."><p style={{ marginTop: 10 }}><Link to="/formations">Parcourir le catalogue</Link></p></Empty> : (
                <ul className="acc-courses">
                  {d.enr.map((e) => {
                    const p = e.progress; const cert = d.certs.find((c) => c.course_id === e.course_id);
                    return (
                      <li key={e.id}>
                        <div>
                          <b>{fr(e.courses?.course_translations, 'title')}</b>
                          <div className="progress"><i style={{ width: `${p?.percent ?? 0}%` }} /></div>
                          <small>{p ? `${p.completed_lessons} / ${p.total_lessons} leçons · ${p.percent} %` : 'Progression indisponible'}{cert && ' · Certificat obtenu'}</small>
                        </div>
                        <Link className="btn btn-red btn-sm" to={`/apprendre/${e.courses?.slug}`}>{p?.completed_lessons ? 'Continuer' : 'Commencer'}</Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="acc-card">
              <h2>Mes certificats</h2>
              {d.certs.length === 0 ? <p style={{ color: 'var(--muted)' }}>Terminez une formation pour obtenir votre premier certificat.</p> : (
                <ul className="acc-certs">{d.certs.map((c) => <CertRow key={c.id} cert={c} />)}</ul>
              )}
            </div>

            <div className="acc-card wide teach-cta">
              <div><h2 style={{ marginBottom: 4 }}>Espace professeur</h2><p style={{ color: 'var(--muted)', fontSize: '.92rem' }}>Créez des formations ou des unités universitaires. Toute demande est validée par l’administration.</p></div>
              <Link className="btn btn-navy btn-sm" to="/professeur">Ouvrir l’espace professeur</Link>
            </div>

            {d.admin && (
              <div className="acc-card wide" style={{ borderLeft: '4px solid var(--red)' }}>
                <h2>Administration</h2>
                <div className="btns"><Link className="btn btn-red btn-sm" to="/admin">Ouvrir l’administration</Link><Link className="btn btn-outline btn-sm" to="/admin/formations">Formations</Link><Link className="btn btn-outline btn-sm" to="/admin/certificat">Modèle de certificat</Link></div>
              </div>
            )}

            <ProfileCard initial={{ first_name: d.profile?.first_name ?? '', last_name: d.profile?.last_name ?? '' }} userId={session.user.id} />

            <div className="acc-card">
              <h2>Mes candidatures</h2>
              {d.apps.length === 0 ? <p style={{ color: 'var(--muted)' }}>Aucune candidature. <Link to="/universite">Voir les programmes</Link></p> : (
                <ul className="list-check">{d.apps.map((a) => <li key={a.id}><span>{fr(a.programmes?.programme_translations, 'name')}<br /><small style={{ color: 'var(--muted)' }}>{APP_STATUS[a.status] ?? a.status} · {new Date(a.created_at).toLocaleDateString('fr-FR')}</small></span></li>)}</ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CertRow({ cert }: { cert: Certificate }) {
  const { code, course_title: title, issued_at: date } = cert;
  const revoked = cert.status === 'revoked';
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <li>
      <b>{title}</b>
      <small>{new Date(date).toLocaleDateString('fr-FR')} · <code>{code}</code>{revoked && ' · Révoqué'}</small>
      {!revoked && (
        <div className="btns" style={{ marginTop: 8 }}>
          <button className="btn btn-navy btn-sm" disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { await downloadCertificate(cert); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } }}>{busy ? 'Génération…' : 'Télécharger le PDF'}</button>
          <Link className="btn btn-outline btn-sm" to={`/certificates/verify/${code}`}>Vérifier</Link>
        </div>
      )}
      {err && <p className="alert err" style={{ marginTop: 8 }}>{err}</p>}
    </li>
  );
}

function ProfileCard({ initial, userId }: { initial: { first_name: string; last_name: string }; userId: string }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setV(initial), [initial.first_name, initial.last_name]);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.first_name.trim() || !v.last_name.trim()) { setMsg({ ok: false, t: 'Le prénom et le nom sont obligatoires : ils figurent sur vos certificats.' }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('profiles').update({ first_name: v.first_name.trim(), last_name: v.last_name.trim() }).eq('id', userId);
    setBusy(false);
    setMsg(error ? { ok: false, t: error.message } : { ok: true, t: 'Profil enregistré.' });
  }
  return (
    <form className="acc-card form anchor" id="profil" onSubmit={onSubmit} noValidate>
      <h2>Mon profil</h2>
      <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Votre nom est imprimé tel quel sur vos certificats.</p>
      <div className="row2">
        <div className="field"><label htmlFor="p-fn">Prénom</label><input id="p-fn" maxLength={80} value={v.first_name} onChange={(e) => setV({ ...v, first_name: e.target.value })} /></div>
        <div className="field"><label htmlFor="p-ln">Nom</label><input id="p-ln" maxLength={80} value={v.last_name} onChange={(e) => setV({ ...v, last_name: e.target.value })} /></div>
      </div>
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.t}</p>}
      <div><button className="btn btn-navy btn-sm" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  );
}
