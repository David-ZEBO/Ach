import { useSearchParams } from 'react-router-dom';
import type { ContactSubject } from '../lib/api';
import { ACH } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { ContactForm } from '../components/ContactForm';
import { Icon } from '../components/Icon';
import { PageHero } from '../components/ui';

const SUBJECTS: ContactSubject[] = ['course', 'enrollment', 'organization', 'other'];

export default function Contact() {
  usePageMeta('Contact', 'Contacter l’Académie du Capital Humain, 287, Basankusu, Lingwala, Kinshasa.');
  const [p] = useSearchParams();
  const s = p.get('sujet') as ContactSubject | null;
  const formation = p.get('formation');
  return (
    <>
      <PageHero title="Contact" intro="Une question sur une formation, une candidature ou un partenariat ? Écrivez-nous." image="/images/photos/cmk-large.jpg" crumbs={[{ label: 'Contact' }]} />
      <section className="sec">
        <div className="wrap contact-grid">
          <div className="contact-card">
            <h2>Académie du Capital Humain</h2>
            <ul>
              <li><Icon name="pin" /><span><b>Siège</b>{ACH.address}</span></li>
              {ACH.email && <li><Icon name="mail" /><span><b>E-mail</b><a href={`mailto:${ACH.email}`}>{ACH.email}</a></span></li>}
              {ACH.phone && <li><Icon name="phone" /><span><b>Téléphone</b>{ACH.phone}</span></li>}
            </ul>
            <p style={{ marginTop: 24, color: '#C4CCE4', fontSize: '.9rem' }}>« {ACH.motto.replace(/\.$/, '')} »</p>
          </div>
          <div className="form-card">
            <h2>Envoyer un message</h2>
            <p>Les champs marqués d’un astérisque sont obligatoires.</p>
            <ContactForm defaultSubject={s && SUBJECTS.includes(s) ? s : 'other'} defaultMessage={p.get('message') ?? (formation ? `Bonjour, je souhaite m’inscrire à la formation « ${formation} ».` : '')} />
          </div>
        </div>
      </section>
    </>
  );
}
