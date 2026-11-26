import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CourseSummary } from '../lib/api';
import { coverImage } from '../lib/images';
import { formatDuration, formatPrice, LEVEL_LABEL } from '../lib/format';
import { Icon } from './Icon';

export function PageHero({ title, intro, image, crumbs }: { title: string; intro?: string; image: string; crumbs: { label: string; to?: string }[] }) {
  return (
    <section className="page-hero" style={{ backgroundImage: `url('${image}')` }}>
      <div className="wrap wide">
        <nav className="crumbs" aria-label="Fil d’Ariane">
          <Link to="/">Accueil</Link>
          {crumbs.map((c) => (
            <span key={c.label}>› {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</span>
          ))}
        </nav>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede, action }: { eyebrow: string; title: string; lede?: string; action?: ReactNode }) {
  return (
    <div className="sec-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="h2">{title}</h2>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {action}
    </div>
  );
}

export function Cta({ to, children, variant }: { to: string; children: ReactNode; variant?: 'link' }) {
  return <Link className={`cta${variant ? ' ' + variant : ''}`} to={to}><span className="c" /><span className="p">{children}</span></Link>;
}

export function CourseCard({ c, categoryName }: { c: CourseSummary; categoryName?: string }) {
  return (
    <Link className="ccard" to={`/formations/${c.slug}`}>
      <div className="ph">
        <img src={coverImage(c.cover_path, c.category_slug)} alt="" loading="lazy" />
        {categoryName && <span className="cat">{categoryName}</span>}
        {c.is_demo && <span className="demo">Démonstration</span>}
      </div>
      <div className="b">
        <h3>{c.title}</h3>
        <p className="desc">{c.short_description || c.subtitle}</p>
        <div className="meta">
          <span><Icon name="clock" size={15} />{formatDuration(c.duration_minutes)}</span>
          <span><Icon name="level" size={15} />{LEVEL_LABEL[c.level]}</span>
          <span><Icon name="laptop" size={15} />En ligne</span>
          {c.lesson_count > 0 && <span><Icon name="book" size={15} />{c.lesson_count} leçons</span>}
        </div>
        <div className="foot">
          <span className="price">{formatPrice(c.price_amount, c.currency)}</span>
          <span className="more">Découvrir →</span>
        </div>
      </div>
    </Link>
  );
}

export function CardSkeletons({ n = 3 }: { n?: number }) {
  return <div className="grid-cards" aria-busy="true">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" />)}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><strong>{title}</strong>{children}</div>;
}

export function ErrorNote({ error }: { error: Error }) {
  return <p className="alert err" role="alert">Impossible de charger ces informations pour le moment. Réessayez dans quelques instants. ({error.message})</p>;
}
