import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getNews, listNews, NEWS_CATEGORY, NEWS_FALLBACK, newsDate, type News, type NewsCategory } from '../lib/news';
import { useAsync, usePageMeta } from '../lib/hooks';
import { Icon } from '../components/Icon';
import { Empty, ErrorNote, PageHero } from '../components/ui';

export function NewsCard({ n, featured }: { n: News; featured?: boolean }) {
  return (
    <Link className={`ncard${featured ? ' featured' : ''}`} to={`/actualites/${n.slug}`}>
      <div className="ph"><img src={n.cover_url || NEWS_FALLBACK[n.category]} alt="" loading="lazy" /><span className="cat">{NEWS_CATEGORY[n.category]}</span></div>
      <div className="b">
        <time dateTime={n.published_at}>{newsDate(n.published_at)}</time>
        <h3>{n.title}</h3>
        {n.excerpt && <p>{n.excerpt}</p>}
        {n.category === 'evenement' && n.event_date && <span className="ev"><Icon name="clock" size={15} />{new Date(n.event_date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}{n.event_location ? ` · ${n.event_location}` : ''}</span>}
        <span className="more">Lire la suite →</span>
      </div>
    </Link>
  );
}

export default function Actualites() {
  usePageMeta('Actualités', 'Actualités, événements, annonces, publications et opportunités de l’Académie du Capital Humain.');
  const [params, setParams] = useSearchParams();
  const cat = params.get('categorie') ?? '';
  const news = useAsync(() => listNews({ category: cat || undefined }), [cat]);
  const list = news.data ?? [];
  return (
    <>
      <PageHero title="Actualités" intro="Événements, annonces, publications et opportunités de l’Académie du Capital Humain." image="/images/photos/mlr.jpg" crumbs={[{ label: 'Actualités' }]} />
      <section className="sec">
        <div className="wrap">
          <div className="chips" role="group" aria-label="Catégorie" style={{ marginTop: 0 }}>
            <button className="chip" aria-pressed={!cat} onClick={() => setParams({})}>Toutes</button>
            {(Object.keys(NEWS_CATEGORY) as NewsCategory[]).map((k) => <button key={k} className="chip" aria-pressed={cat === k} onClick={() => setParams({ categorie: k })}>{NEWS_CATEGORY[k]}s</button>)}
          </div>
          {news.error ? <ErrorNote error={news.error} /> : news.loading ? <div className="skeleton" /> : list.length === 0 ? (
            <Empty title="Aucune actualité publiée pour le moment.">Revenez bientôt : les nouvelles de l’Académie apparaîtront ici.</Empty>
          ) : (
            <div className="news-grid">{list.map((n, i) => <NewsCard key={n.id} n={n} featured={i === 0 && !cat} />)}</div>
          )}
        </div>
      </section>
    </>
  );
}

export function Actualite() {
  const { slug = '' } = useParams();
  const n = useAsync(() => getNews(slug), [slug]);
  const others = useAsync(() => (n.data ? listNews({ limit: 3, excludeId: n.data.id }) : Promise.resolve([])), [n.data?.id]);
  const [copied, setCopied] = useState(false);
  usePageMeta(n.data?.title ?? 'Actualité', n.data?.excerpt);
  if (n.loading) return <div className="wrap sec"><div className="skeleton" style={{ minHeight: 400 }} /></div>;
  if (n.error) return <div className="wrap sec"><ErrorNote error={n.error} /></div>;
  if (!n.data) return <div className="wrap sec"><Empty title="Cette actualité est introuvable."><p style={{ marginTop: 12 }}><Link to="/actualites">Toutes les actualités</Link></p></Empty></div>;
  const a = n.data;
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const share = [
    ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(`${a.title} ${url}`)}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`],
    ['X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(url)}`],
  ];
  return (
    <>
      <article className="news-article">
        <header className="na-head">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <nav className="crumbs" aria-label="Fil d’Ariane"><Link to="/">Accueil</Link><span>› <Link to="/actualites">Actualités</Link></span></nav>
            <span className="lvl on-dark">{NEWS_CATEGORY[a.category]}</span>
            <h1>{a.title}</h1>
            {a.excerpt && <p className="sub">{a.excerpt}</p>}
            <p className="na-meta"><time dateTime={a.published_at}>Publié le {newsDate(a.published_at)}</time>{!a.is_published && <span className="status soon" style={{ marginLeft: 10 }}>Brouillon (visible par l’administration)</span>}</p>
          </div>
        </header>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <img className="na-cover" src={a.cover_url || NEWS_FALLBACK[a.category]} alt="" />
          {a.category === 'evenement' && a.event_date && (
            <div className="na-event"><Icon name="clock" size={20} /><div><b>{new Date(a.event_date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b>{a.event_location && <span>{a.event_location}</span>}</div></div>
          )}
          <div className="ch-body na-body">{a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="na-share">
            <b>Partager</b>
            {share.map(([l, h]) => <a key={l} className="btn btn-outline btn-sm" href={h} target="_blank" rel="noreferrer">{l}</a>)}
            <button className="btn btn-outline btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* navigateur sans presse-papiers */ } }}>{copied ? 'Lien copié ✓' : 'Copier le lien'}</button>
          </div>
        </div>
      </article>
      {(others.data ?? []).length > 0 && (
        <section className="sec soft">
          <div className="wrap">
            <div className="sec-head"><div><span className="eyebrow">À lire aussi</span><h2 className="h2">Autres actualités</h2></div><Link className="btn btn-outline" to="/actualites">Toutes les actualités</Link></div>
            <div className="news-grid">{others.data!.map((o) => <NewsCard key={o.id} n={o} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
