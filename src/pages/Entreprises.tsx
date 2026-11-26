import { usePageMeta } from '../lib/hooks';
import { ContactForm } from '../components/ContactForm';
import { Icon, type IconName } from '../components/Icon';
import { PageHero, SectionHead } from '../components/ui';

const OFFERS: [IconName, string, string][] = [
  ['users', 'Formation des équipes', 'Des sessions pour développer les compétences collectives de vos collaborateurs.'],
  ['spark', 'Renforcement des capacités', 'Des programmes pour améliorer durablement la performance de votre structure.'],
  ['tools', 'Formations sur mesure', 'Un contenu construit à partir de vos objectifs et de votre contexte.'],
  ['target', 'Leadership', 'Former des responsables capables d’entraîner et de décider.'],
  ['chart', 'Management', 'Organiser, piloter et motiver les équipes.'],
  ['check', 'Gestion de projets', 'Planifier, suivre et livrer les projets dans les délais.'],
  ['mail', 'Communication', 'Écrire, présenter et communiquer avec clarté.'],
  ['building', 'Développement organisationnel', 'Faire évoluer l’organisation, ses processus et sa culture.'],
  ['compass', 'Accompagnement', 'Un suivi après la formation pour ancrer les acquis.'],
];
const PUBLICS = ['Entreprises', 'ONG', 'Organisations internationales', 'Administrations', 'Associations', 'Entrepreneurs', 'Professionnels'];

export default function Entreprises() {
  usePageMeta('Entreprises et organisations', 'Formations sur mesure et renforcement des capacités pour les entreprises, ONG, administrations et associations.');
  return (
    <>
      <PageHero title="Entreprises et organisations" intro="Développez les compétences de vos équipes avec des programmes conçus pour votre organisation." image="/images/photos/seg.jpg" crumbs={[{ label: 'Entreprises et organisations' }]} />
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Pour qui" title="Un partenaire pour toutes les organisations" />
          <ul className="pill-list">{PUBLICS.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      </section>
      <section className="sec soft">
        <div className="wrap">
          <SectionHead eyebrow="Nos offres" title="Ce que l’Académie vous propose" />
          <div className="research" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {OFFERS.map(([i, t, d]) => <div key={t}><div className="ic"><Icon name={i} size={28} /></div><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>
      <section className="sec anchor" id="demande">
        <div className="wrap contact-grid">
          <div>
            <span className="eyebrow">Demande de formation</span>
            <h2 className="h2">Organiser une formation pour votre organisation</h2>
            <p className="lede">Décrivez votre structure, le nombre de participants, les thèmes souhaités et vos contraintes de calendrier. L’Académie vous recontacte pour construire la proposition.</p>
            <ul className="list-check" style={{ marginTop: 22 }}><li>Analyse de vos besoins</li><li>Proposition de programme et de calendrier</li><li>Animation, évaluation et suivi</li></ul>
          </div>
          <div className="form-card"><h2>Votre demande</h2><p>Nous vous répondons par e-mail.</p><ContactForm defaultSubject="organization" defaultMessage={'Organisation :\nNombre de participants :\nThèmes souhaités :\nPériode envisagée :'} submitLabel="Collaborer avec l’ACH" /></div>
        </div>
      </section>
    </>
  );
}
