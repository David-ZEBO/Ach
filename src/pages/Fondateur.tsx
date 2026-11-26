import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/hooks';
import { useFounder } from '../lib/useFounder';
import { Empty, PageHero } from '../components/ui';

export default function Fondateur() {
  const f = useFounder();
  usePageMeta('Le fondateur', `${f.name}, fondateur de l’Académie du Capital Humain.`);
  return (
    <>
      <PageHero title="Le fondateur" intro="À l’origine de l’Académie du Capital Humain." image="/images/photos/seg.jpg" crumbs={[{ label: 'L’Académie', to: '/academie' }, { label: 'Le fondateur' }]} />
      <section className="sec">
        <div className="wrap founder">
          <div className="founder-photo">
            <img src={f.photo} alt={`Portrait officiel du ${f.name}`} />
            <div className="badge"><b>{f.name}</b><span>{f.title}</span></div>
          </div>
          <div>
            <span className="eyebrow">Présentation</span>
            <h2>{f.name}</h2>
            <p className="intro">{f.intro}</p>
            <p style={{ marginTop: 14, color: 'var(--muted)' }}>Il est à l’origine de la création de l’Académie du Capital Humain, avec l’ambition de contribuer à la valorisation des compétences et au rôle du capital humain dans le développement économique et social.</p>
            <div className="btns" style={{ marginTop: 26 }}>
              <a className="btn btn-navy" href={f.website} target="_blank" rel="noreferrer">Site officiel du Dr Michel Muvudi</a>
            </div>
          </div>
        </div>
      </section>

      <section className="sec soft">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Formation</span>
            <h2 className="h2" style={{ marginBottom: 20 }}>Parcours académique</h2>
            <ul className="list-check">{f.education.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
          <div>
            <span className="eyebrow">Engagements</span>
            <h2 className="h2" style={{ marginBottom: 20 }}>Fonctions et activités</h2>
            <ul className="list-check">{f.roles.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <span className="eyebrow">Message</span>
          <h2 className="h2" style={{ marginBottom: 24 }}>Le mot du fondateur</h2>
          {f.message ? (
            <blockquote className="prose" style={{ margin: 0, padding: '26px 30px', background: 'var(--soft)', borderLeft: '4px solid var(--red)', fontSize: '1.1rem' }}>
              {f.message.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              <footer style={{ marginTop: 16, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--navy)' }}>{f.name}</footer>
            </blockquote>
          ) : (
            <Empty title="Le message du fondateur sera publié prochainement.">Il est publié uniquement après validation officielle par l’Académie.</Empty>
          )}
          <p style={{ marginTop: 28 }}><Link to="/academie">← Retour à la présentation de l’Académie</Link></p>
        </div>
      </section>
    </>
  );
}
