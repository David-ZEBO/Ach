import { GOVERNANCE } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { PageHero, SectionHead } from '../components/ui';

export default function Gouvernance() {
  usePageMeta('Gouvernance', 'Les organes de l’Académie du Capital Humain selon ses statuts : Collège des Fondateurs, Conseil d’administration, Comité de gestion, Conseil pédagogique et scientifique, Conseil des étudiants.');
  return (
    <>
      <PageHero title="Gouvernance" intro="Une organisation fixée par les statuts de l’Académie, fondée sur la transparence et la bonne gouvernance." image="/images/photos/mlr.jpg" crumbs={[{ label: 'L’Académie', to: '/academie' }, { label: 'Gouvernance' }]} />
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Organisation" title="Les organes de l’Académie" lede="Statuts, article 5. Le règlement intérieur précise leurs modalités pratiques de fonctionnement." />
          <div className="org" aria-hidden="true">
            <div className="node red">Collège des Fondateurs</div><div className="v" />
            <div className="node">Conseil d’administration</div><div className="v" />
            <div className="node">Comité de gestion</div><div className="v" />
            <div className="row"><div className="node light">Conseil pédagogique et scientifique</div><div className="node light">Conseil des étudiants</div></div>
          </div>
          <div className="gov">
            {GOVERNANCE.map((g) => (
              <article key={g.id} className="gov-card anchor" id={g.id}>
                <div className="side"><h3>{g.name}</h3><span>Statuts, {g.article}</span></div>
                <div className="body">
                  <p>{g.role}</p>
                  {g.duties.length > 0 && <ul className="list-check">{g.duties.map((d) => <li key={d}>{d}</li>)}</ul>}
                  <p className="note">La composition nominative de cet organe sera publiée après validation officielle.</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
