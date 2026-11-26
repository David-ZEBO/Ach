import { Link } from 'react-router-dom';
import { CONTEXT, DOMAINS, MISSION, OBJECTIVES, VALUES, VISION } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { useFounder } from '../lib/useFounder';
import { Icon } from '../components/Icon';
import { Cta, PageHero, SectionHead } from '../components/ui';

const SUBNAV = [['presentation', 'Présentation'], ['contexte', 'Contexte'], ['fondateur', 'Fondateur'], ['mission', 'Mission et vision'], ['valeurs', 'Valeurs'], ['objectifs', 'Objectifs'], ['domaines', 'Domaines'], ['approche', 'Approche']];

export default function Academie() {
  usePageMeta('L’Académie', 'Présentation, contexte de création, fondateur, mission, vision, valeurs et objectifs de l’Académie du Capital Humain.');
  const founder = useFounder();
  return (
    <>
      <PageHero title="L’Académie du Capital Humain" intro="Un établissement d’utilité publique à caractère scientifique, d’enseignement supérieur et de formation, établi à Kinshasa." image="/images/photos/b3-large.jpg" crumbs={[{ label: 'L’Académie' }]} />
      <nav className="subnav" aria-label="Sections"><div className="wrap wide">{SUBNAV.map(([id, l]) => <a key={id} href={`#${id}`}>{l}</a>)}</div></nav>

      <section className="sec anchor" id="presentation">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Présentation</span>
            <h2 className="h2">Le capital humain, socle de toute création des valeurs</h2>
            <div className="prose" style={{ marginTop: 20 }}>
              <p>L’Académie du Capital Humain, en sigle ACH, a pour objet de contribuer à la création de la valeur économique, sociale et éthique fondée sur le capital humain.</p>
              <p>Elle organise des activités de formation, de renforcement des capacités, d’accompagnement scientifique et de recherche appliquée au bénéfice des personnes, des organisations et des communautés.</p>
              <p>Son siège est établi au 287, Basankusu, Lingwala, à Kinshasa. L’Académie poursuit un but non lucratif et agit dans le respect des lois de la République, de la liberté de conscience, de l’égalité de traitement, de la transparence et de la bonne gouvernance.</p>
            </div>
          </div>
          <div className="media media-frame"><img src="/images/photos/mlr.jpg" alt="Conférence de l’Académie" loading="lazy" /></div>
        </div>
      </section>

      <section className="sec soft anchor" id="contexte">
        <div className="wrap">
          <SectionHead eyebrow="Contexte et histoire" title="Pourquoi l’Académie a été créée" />
          <ol className="numbered">{CONTEXT.map((c) => <li key={c}><span>{c}</span></li>)}</ol>
        </div>
      </section>

      <section className="sec anchor" id="fondateur">
        <div className="wrap founder">
          <div className="founder-photo"><img src={founder.photo} alt={`Portrait du ${founder.name}`} loading="lazy" /></div>
          <div>
            <span className="eyebrow">Le fondateur</span>
            <h2>{founder.name}</h2>
            <p className="intro">{founder.intro}</p>
            <p style={{ marginTop: 14, color: 'var(--muted)' }}>Il est à l’origine de l’Académie du Capital Humain, créée pour contribuer à la valorisation des compétences et au développement du capital humain en République démocratique du Congo.</p>
            <div style={{ marginTop: 26 }}><Cta to="/academie/fondateur">Découvrir son parcours</Cta></div>
          </div>
        </div>
      </section>

      <section className="sec soft anchor" id="mission">
        <div className="wrap mv">
          <div className="mv-card m"><div className="ic"><Icon name="target" size={26} /></div><h3>Mission</h3><p>{MISSION}</p></div>
          <div className="mv-card v"><div className="ic"><Icon name="eye" size={26} /></div><h3>Vision</h3><p>{VISION}</p></div>
        </div>
      </section>

      <section className="sec anchor" id="valeurs">
        <div className="wrap">
          <SectionHead eyebrow="Valeurs et engagements" title="Les principes qui guident l’Académie" />
          <div className="values">{VALUES.map((v) => <div key={v.t}><h3>{v.t}</h3><p>{v.d}</p></div>)}</div>
        </div>
      </section>

      <section className="sec soft anchor" id="objectifs">
        <div className="wrap">
          <SectionHead eyebrow="Objectifs" title="Ce que l’Académie s’engage à réaliser" lede="Extraits de l’objet de l’Académie défini par ses statuts." />
          <ol className="numbered">{OBJECTIVES.map((o) => <li key={o}><span>{o}</span></li>)}</ol>
        </div>
      </section>

      <section className="sec navy anchor" id="domaines">
        <div className="wrap">
          <SectionHead eyebrow="Domaines d’intervention" title="Nos domaines d’intervention" />
          <ul className="pill-list">{DOMAINS.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      </section>

      <section className="sec anchor" id="approche">
        <div className="wrap split">
          <div>
            <span className="eyebrow">Notre approche</span>
            <h2 className="h2">Développer le capital humain, de la personne à l’organisation</h2>
            <ul className="list-check" style={{ marginTop: 22 }}>
              <li>Former les personnes, par la formation initiale, continue, professionnelle et non formelle.</li>
              <li>Renforcer les capacités des entreprises, des administrations, des associations et des communautés.</li>
              <li>Produire et partager des savoirs grâce à la recherche appliquée et aux publications.</li>
              <li>Accompagner l’orientation, l’insertion professionnelle et le développement de carrière.</li>
              <li>Favoriser l’accès équitable à la formation, notamment pour les jeunes et les personnes vulnérables.</li>
            </ul>
            <div className="btns" style={{ marginTop: 28 }}>
              <Link className="btn btn-navy" to="/academie/gouvernance">Notre gouvernance</Link>
              <Link className="btn btn-outline" to="/formations">Nos formations</Link>
            </div>
          </div>
          <div className="media media-frame"><img src="/images/photos/stn-large.jpg" alt="Apprenants travaillant sur ordinateur" loading="lazy" /></div>
        </div>
      </section>
    </>
  );
}
