import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminError, createCourse, listAdminCourses, listCategoryOptions, slugify } from '../../lib/admin';
import type { Level } from '../../lib/api';
import { formatPrice, LEVEL_LABEL } from '../../lib/format';
import { useAsync, usePageMeta } from '../../lib/hooks';
import { ErrorNote } from '../../components/ui';
import { coursesToReview } from '../../lib/teacher';
import { AdminShell } from './AdminShell';

const STATUS: Record<string, { l: string; tone: string }> = { published: { l: 'Publiée', tone: 'open' }, draft: { l: 'Brouillon', tone: 'soon' }, archived: { l: 'Archivée', tone: 'closed' } };

export default function AdminFormations() {
  usePageMeta('Formations · Administration');
  const courses = useAsync(listAdminCourses, []);
  const review = useAsync(coursesToReview, []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const rows = useMemo(() => (courses.data ?? []).filter((c) => (!status || (status === 'review' ? review.data?.has(c.id) : c.status === status)) && (!q || c.title.toLowerCase().includes(q.toLowerCase()))), [courses.data, q, status]);
  return (
    <AdminShell title="Formations">
      <div className="admin-tools">
        <div className="field"><label htmlFor="aq" className="vh">Rechercher</label><input id="aq" type="search" placeholder="Rechercher une formation…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="field"><label htmlFor="as" className="vh">Statut</label><select id="as" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tous les statuts</option><option value="review">À relire</option><option value="published">Publiées</option><option value="draft">Brouillons</option><option value="archived">Archivées</option></select></div>
        <Link className="btn btn-red" to="/admin/formations/nouvelle">+ Nouvelle formation</Link>
      </div>
      {courses.error ? <ErrorNote error={courses.error} /> : courses.loading ? <div className="skeleton" /> : (
        <ul className="admin-list">
          {rows.map((c) => (
            <li key={c.id}>
              <Link to={`/admin/formations/${c.id}`}>
                <div className="al-main"><b>{c.title}</b><small>{c.module_count} parties · {c.lesson_count} étapes · {c.enrollment_count} inscrit{c.enrollment_count > 1 ? 's' : ''} · {formatPrice(c.price_amount, c.currency)}</small></div>
                <div className="al-side">{review.data?.has(c.id) && <span className="status soon">À relire</span>}{c.is_demo && <span className="tag-demo">Démo</span>}<span className={`status ${STATUS[c.status]?.tone}`}>{STATUS[c.status]?.l ?? c.status}</span></div>
              </Link>
            </li>
          ))}
          {rows.length === 0 && <li className="al-empty">Aucune formation ne correspond.</li>}
        </ul>
      )}
    </AdminShell>
  );
}

export function AdminFormationNew() {
  usePageMeta('Nouvelle formation · Administration');
  const cats = useAsync(listCategoryOptions, []);
  const navigate = useNavigate();
  const [v, setV] = useState({ title: '', subtitle: '', short_description: '', category_id: '', level: 'beginner' as Level, price: '0', currency: 'USD', hours: '10', certificate_enabled: true, parts: 'Introduction\n' });
  const [slugEdited, setSlugEdited] = useState(false);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = slugEdited ? slug : slugify(v.title);
    if (!v.title.trim()) { setErr('Le titre est obligatoire.'); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) { setErr('L’adresse doit contenir uniquement des lettres minuscules, des chiffres et des tirets.'); return; }
    setBusy(true); setErr('');
    try {
      const id = await createCourse({
        slug: s, title: v.title.trim(), subtitle: v.subtitle.trim(), short_description: v.short_description.trim(), category_id: v.category_id || null, level: v.level,
        price_amount: Math.round(parseFloat(v.price.replace(',', '.') || '0') * 100), currency: v.currency, duration_minutes: Math.round(parseFloat(v.hours.replace(',', '.') || '0') * 60),
        certificate_enabled: v.certificate_enabled, parts: v.parts.split('\n').map((x) => x.trim()).filter(Boolean),
      });
      navigate(`/admin/formations/${id}?onglet=plan`);
    } catch (e2) { setErr(adminError(e2)); setBusy(false); }
  }

  return (
    <AdminShell title="Nouvelle formation" back={{ to: '/admin/formations', label: 'Formations' }}>
      <form className="admin-form" onSubmit={onSubmit} noValidate>
        <section className="af-section">
          <h2><span>1</span>L’essentiel</h2>
          <div className="field"><label htmlFor="n-title">Titre de la formation <span className="req">*</span></label><input id="n-title" maxLength={200} value={v.title} onChange={(e) => { setV({ ...v, title: e.target.value }); if (!slugEdited) setSlug(slugify(e.target.value)); }} placeholder="Ex. Gestion d’un projet de développement" /></div>
          <div className="field"><label htmlFor="n-sub">Accroche</label><input id="n-sub" maxLength={300} value={v.subtitle} onChange={set('subtitle')} placeholder="Une phrase qui donne envie" /></div>
          <div className="field"><label htmlFor="n-short">Résumé</label><textarea id="n-short" maxLength={500} value={v.short_description} onChange={set('short_description')} style={{ minHeight: 90 }} /><span className="hint">{v.short_description.length} / 500 · affiché sur les cartes du catalogue</span></div>
          <div className="field"><label htmlFor="n-slug">Adresse de la page</label><input id="n-slug" value={slugEdited ? slug : slugify(v.title)} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} /><span className="hint">/formations/{slugEdited ? slug : slugify(v.title) || '…'}</span></div>
        </section>
        <section className="af-section">
          <h2><span>2</span>Caractéristiques</h2>
          <div className="row2">
            <div className="field"><label htmlFor="n-cat">Domaine</label><select id="n-cat" value={v.category_id} onChange={set('category_id')}><option value="">Choisir…</option>{(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="field"><label htmlFor="n-lvl">Niveau</label><select id="n-lvl" value={v.level} onChange={set('level')}>{(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}</select></div>
          </div>
          <div className="row2">
            <div className="field"><label htmlFor="n-price">Prix</label><div className="input-group"><input id="n-price" inputMode="decimal" value={v.price} onChange={set('price')} /><select aria-label="Devise" value={v.currency} onChange={set('currency')}><option>USD</option><option>CDF</option><option>EUR</option></select></div><span className="hint">0 = formation gratuite</span></div>
            <div className="field"><label htmlFor="n-h">Durée (heures)</label><input id="n-h" inputMode="decimal" value={v.hours} onChange={set('hours')} /></div>
          </div>
          <label className="check"><input type="checkbox" checked={v.certificate_enabled} onChange={(e) => setV({ ...v, certificate_enabled: e.target.checked })} /> <span>Délivrer un certificat de réussite</span></label>
        </section>
        <section className="af-section">
          <h2><span>3</span>Les parties du cours</h2>
          <div className="field"><label htmlFor="n-parts">Une partie par ligne</label><textarea id="n-parts" value={v.parts} onChange={set('parts')} style={{ minHeight: 120 }} /><span className="hint">Vous ajouterez ensuite les chapitres, quiz et activités de chaque partie.</span></div>
        </section>
        {err && <p className="alert err" role="alert">{err}</p>}
        <div className="af-actions"><Link className="btn btn-outline" to="/admin/formations">Annuler</Link><button className="btn btn-red" disabled={busy}>{busy ? 'Création…' : 'Créer la formation (brouillon)'}</button></div>
      </form>
    </AdminShell>
  );
}
