import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { slugify } from '../../lib/admin';
import { useAsync, usePageMeta } from '../../lib/hooks';
import { deleteNews, listAllNews, NEWS_CATEGORY, NEWS_FALLBACK, newsDate, saveNews, uploadNewsImage, type News, type NewsCategory } from '../../lib/news';
import { ErrorNote } from '../../components/ui';
import { AdminShell } from './AdminShell';

const toLocal = (s?: string | null) => { if (!s) return ''; const d = new Date(s); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const errText = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? '';
  if (/duplicate key.*slug|news_slug_key/i.test(m)) return 'Cette adresse est déjà utilisée par une autre actualité.';
  if (/check constraint/i.test(m)) return 'Un champ ne respecte pas le format attendu (titre, longueur, image en https://).';
  if (/row-level security|42501/i.test(m)) return 'Action réservée aux administrateurs.';
  return m || 'Une erreur est survenue.';
};

/** Administration des actualités publiques. */
export default function AdminActualites() {
  usePageMeta('Actualités · Administration');
  const [reload, setReload] = useState(0);
  const news = useAsync(listAllNews, [reload]);
  const [editing, setEditing] = useState<Partial<News> | null>(null);
  const [filter, setFilter] = useState('');
  const rows = (news.data ?? []).filter((n) => !filter || (filter === 'draft' ? !n.is_published : filter === 'published' ? n.is_published : n.category === filter));
  return (
    <AdminShell title="Actualités">
      <div className="admin-tools" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
        <div className="chips" role="group" aria-label="Filtre" style={{ margin: 0 }}>
          {[['', 'Toutes'], ['published', 'Publiées'], ['draft', 'Brouillons'], ...Object.entries(NEWS_CATEGORY)].map(([k, l]) => <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        <button className="btn btn-red" onClick={() => setEditing({ category: 'actualite', is_published: false })}>+ Nouvelle actualité</button>
      </div>
      {news.error ? <ErrorNote error={news.error} /> : news.loading ? <div className="skeleton" /> : rows.length === 0 ? (
        <div className="empty"><strong>Aucune actualité.</strong>Publiez votre première actualité : elle apparaîtra sur la page Actualités et sur l’accueil.</div>
      ) : (
        <ul className="admin-list">
          {rows.map((n) => (
            <li key={n.id}><button className="al-row" onClick={() => setEditing(n)}>
              <img className="al-thumb" src={n.cover_url || NEWS_FALLBACK[n.category]} alt="" />
              <div className="al-main"><b>{n.title}</b><small>{NEWS_CATEGORY[n.category]} · {newsDate(n.published_at)}{n.excerpt ? ` · ${n.excerpt.slice(0, 90)}${n.excerpt.length > 90 ? '…' : ''}` : ''}</small></div>
              <div className="al-side"><span className={`status ${n.is_published ? (new Date(n.published_at) > new Date() ? 'soon' : 'open') : 'closed'}`}>{n.is_published ? (new Date(n.published_at) > new Date() ? 'Programmée' : 'Publiée') : 'Brouillon'}</span></div>
            </button></li>
          ))}
        </ul>
      )}
      {editing && <NewsEditor n={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setReload((x) => x + 1); }} />}
    </AdminShell>
  );
}

function NewsEditor({ n, onClose, onSaved }: { n: Partial<News>; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    title: n.title ?? '', slug: n.slug ?? '', category: (n.category ?? 'actualite') as NewsCategory, excerpt: n.excerpt ?? '', body: n.body ?? '', cover_url: n.cover_url ?? '',
    event_date: toLocal(n.event_date), event_location: n.event_location ?? '', is_published: !!n.is_published, published_at: toLocal(n.published_at) || toLocal(new Date().toISOString()),
  });
  const [slugTouched, setSlugTouched] = useState(!!n.slug);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ask, setAsk] = useState(false);
  const slug = slugTouched ? v.slug : slugify(v.title);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  async function image(file?: File | null) {
    if (!file) return;
    setBusy(true); setMsg('');
    try { setV({ ...v, cover_url: await uploadNewsImage(file) }); } catch (e) { setMsg(errText(e)); } finally { setBusy(false); }
  }
  async function submit(e: FormEvent, publish?: boolean) {
    e.preventDefault();
    if (!v.title.trim()) { setMsg('Le titre est obligatoire.'); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { setMsg('L’adresse doit contenir uniquement des lettres minuscules, des chiffres et des tirets.'); return; }
    setBusy(true); setMsg('');
    try {
      await saveNews({ id: n.id, title: v.title.trim(), slug, category: v.category, excerpt: v.excerpt.trim(), body: v.body, cover_url: v.cover_url || null,
        event_date: v.category === 'evenement' && v.event_date ? new Date(v.event_date).toISOString() : null, event_location: v.category === 'evenement' ? v.event_location.trim() : '',
        is_published: publish ?? v.is_published, published_at: new Date(v.published_at || Date.now()).toISOString() });
      onSaved();
    } catch (x) { setMsg(errText(x)); setBusy(false); }
  }
  async function remove() { setBusy(true); try { await deleteNews(n.id!); onSaved(); } catch (x) { setMsg(errText(x)); setBusy(false); } }

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label="Actualité">
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer-panel">
        <header><h2>{n.id ? 'Modifier l’actualité' : 'Nouvelle actualité'}</h2><button className="toc-close" onClick={onClose} aria-label="Fermer">×</button></header>
        <div className="drawer-content">
          <form className="form" onSubmit={(e) => submit(e)} noValidate>
            <div className="field"><label htmlFor="nw-t">Titre <span className="req">*</span></label><input id="nw-t" maxLength={200} value={v.title} onChange={(e) => { setV({ ...v, title: e.target.value }); }} /></div>
            <div className="row2">
              <div className="field"><label htmlFor="nw-c">Catégorie</label><select id="nw-c" value={v.category} onChange={set('category')}>{(Object.keys(NEWS_CATEGORY) as NewsCategory[]).map((k) => <option key={k} value={k}>{NEWS_CATEGORY[k]}</option>)}</select></div>
              <div className="field"><label htmlFor="nw-s">Adresse</label><input id="nw-s" maxLength={140} value={slug} onChange={(e) => { setSlugTouched(true); setV({ ...v, slug: e.target.value }); }} /><span className="hint">/actualites/{slug || '…'}</span></div>
            </div>
            <div className="field"><label htmlFor="nw-x">Résumé</label><textarea id="nw-x" maxLength={400} value={v.excerpt} onChange={set('excerpt')} style={{ minHeight: 80 }} /><span className="hint">{v.excerpt.length} / 400 · affiché sur les cartes et l’accueil</span></div>
            <div className="field"><label htmlFor="nw-b">Contenu</label><textarea id="nw-b" maxLength={50000} value={v.body} onChange={set('body')} style={{ minHeight: 260 }} placeholder="Séparez les paragraphes par une ligne vide." /></div>
            <div className="field">
              <label htmlFor="nw-i">Image</label>
              <div className="img-row"><img src={v.cover_url || NEWS_FALLBACK[v.category]} alt="" style={{ height: 64 }} /><input id="nw-i" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => image(e.target.files?.[0])} disabled={busy} />{v.cover_url && <button type="button" className="linkbtn" onClick={() => setV({ ...v, cover_url: '' })}>Retirer</button>}</div>
              <span className="hint">Format paysage conseillé. Sans image, une photo par défaut est utilisée.</span>
            </div>
            {v.category === 'evenement' && (
              <div className="row2">
                <div className="field"><label htmlFor="nw-ed">Date de l’événement</label><input id="nw-ed" type="datetime-local" value={v.event_date} onChange={set('event_date')} /></div>
                <div className="field"><label htmlFor="nw-el">Lieu</label><input id="nw-el" maxLength={300} value={v.event_location} onChange={set('event_location')} placeholder="Ex. 287, Basankusu, Lingwala, Kinshasa" /></div>
              </div>
            )}
            <div className="row2">
              <div className="field"><label htmlFor="nw-p">Date de publication</label><input id="nw-p" type="datetime-local" value={v.published_at} onChange={set('published_at')} /><span className="hint">Une date future programme la publication.</span></div>
              <label className="check" style={{ alignSelf: 'center' }}><input type="checkbox" checked={v.is_published} onChange={(e) => setV({ ...v, is_published: e.target.checked })} /> <span>Publiée (visible par le public)</span></label>
            </div>
            {msg && <p className="alert err" role="alert">{msg}</p>}
            <div className="af-actions sticky">
              {n.id && (ask ? <span className="confirm" style={{ marginRight: 'auto' }}>Supprimer ? <button type="button" className="linkbtn" onClick={remove}>Oui</button><button type="button" className="linkbtn" style={{ color: 'var(--muted)' }} onClick={() => setAsk(false)}>Non</button></span>
                : <button type="button" className="linkbtn" style={{ marginRight: 'auto', color: 'var(--red)' }} onClick={() => setAsk(true)}>Supprimer</button>)}
              {n.slug && <Link className="btn btn-outline btn-sm" to={`/actualites/${n.slug}`} target="_blank">Aperçu</Link>}
              <button className="btn btn-outline" disabled={busy}>{busy ? '…' : 'Enregistrer'}</button>
              {!v.is_published && <button type="button" className="btn btn-red" disabled={busy} onClick={(e) => submit(e as unknown as FormEvent, true)}>Publier</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
