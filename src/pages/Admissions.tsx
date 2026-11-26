import { Link } from 'react-router-dom';
import { listFaq } from '../lib/api';
import { useAsync, usePageMeta } from '../lib/hooks';
import { Icon, type IconName } from '../components/Icon';
import { ApplicationForm } from '../components/ApplicationForm';
import { PageHero, SectionHead } from '../components/ui';

const STEPS = [
  ['Choisir un programme', 'Parcourez les programmes universitaires et choisissez celui qui correspond à votre projet.'],
  ['Remplir le formulaire', 'Créez votre compte et complétez le formulaire de candidature en quelques minutes.'],
  ['Soumettre la candidature', 'Vérifiez vos informations puis envoyez votre dossier.'],
  ['Suivre le dossier', 'Suivez chaque étape depuis votre espace : réception, présélection, pièces demandées.'],
  ['Recevoir la réponse', 'Vous êtes informé par e-mail et dans votre espace de la décision d’admission.'],
];
const DOCS: [IconName, string][] = [['users', 'Pièce d’identité'], ['book', 'Dernier diplôme obtenu'], ['chart', 'Relevé de notes'], ['eye', 'Photo d’identité']];

export default function Admissions() {
  usePageMeta('Admissions', 'Comment rejoindre l’Académie du Capital Humain : étapes de candidature, documents nécessaires et formulaire en ligne.');
  const faq = useAsync(listFaq, []);
  return (
    <>
      <PageHero title="Admissions" intro="Rejoindre l’Académie du Capital Humain : un parcours simple, suivi en ligne de la candidature à l’admission." image="/images/photos/hero.jpg" crumbs={[{ label: 'Admissions' }]} />
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Deux façons de rejoindre l’ACH" title="Formation courte ou programme universitaire ?" />
          <div className="two-ways">
            <Link className="way" to="/formations">
              <h3>Formations</h3>
              <p>Inscription directe depuis la fiche de la formation, sans dossier. Les formations gratuites sont accessibles immédiatement après la création de votre compte.</p>
              <span className="go">Voir les formations →</span>
            </Link>
            <Link className="way uni" to="/universite">
              <h3>Programmes universitaires</h3>
              <p>Licences, masters et certificats universitaires : admission sur candidature, étude du dossier puis décision de l’Académie.</p>
              <span className="go">Voir les programmes →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead eyebrow="Programmes universitaires" title="Votre parcours de candidature" />
          <ol className="steps" style={{ listStyle: 'none', padding: 0 }}>
            {STEPS.map(([t, d], i) => <li key={t} className="step"><span className="n">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="sec soft">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Conditions</span>
            <h2 className="h2">Conditions d’admission</h2>
            <ul className="list-check" style={{ marginTop: 20 }}>
              <li>Les programmes universitaires demandent un dossier : niveau d’études, pièces justificatives et motivation.</li>
              <li>Les formations courtes ne demandent pas de candidature : l’inscription se fait directement sur leur fiche.</li>
              <li>Chaque candidature est étudiée par l’Académie, qui peut demander des pièces complémentaires.</li>
            </ul>
            <h3 style={{ margin: '36px 0 16px', fontSize: '1.2rem' }}>Documents généralement demandés</h3>
            <div className="docs">{DOCS.map(([i, t]) => <div key={t}><div className="ic"><Icon name={i} size={28} /></div><b>{t}</b></div>)}</div>
            <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: '.9rem' }}>Les pièces exactes dépendent du programme. Elles sont demandées après la présélection, depuis votre espace.</p>
          </div>
          <div id="candidater" className="anchor"><ApplicationForm /></div>
        </div>
      </section>

      {faq.data && faq.data.length > 0 && (
        <section className="sec">
          <div className="wrap faq" style={{ maxWidth: 900 }}>
            <SectionHead eyebrow="FAQ" title="Questions fréquentes" />
            {faq.data.map((q) => <details key={q.id}><summary>{q.question}</summary><p>{q.answer}</p></details>)}
          </div>
        </section>
      )}

      <section className="sec navy">
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 className="h2" style={{ marginTop: 0 }}>Besoin d’aide pour votre candidature ?</h2><p className="lede">L’équipe de l’Académie répond à vos questions sur les formations, les conditions et les démarches.</p></div>
          <Link className="btn btn-red" to="/contact?sujet=enrollment">Contacter l’Académie</Link>
        </div>
      </section>
    </>
  );
}
