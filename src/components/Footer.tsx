import { Link } from 'react-router-dom';
import { ACH } from '../lib/content';
import { Icon } from './Icon';

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap wide">
        <div className="f-grid">
          <div>
            <Link className="f-logo" to="/"><img src="/images/logo-ach.jpg" alt="ACH, Académie du Capital Humain" width={670} height={278} /></Link>
            <p className="f-about">Établissement d’utilité publique à caractère scientifique, d’enseignement supérieur et de formation, à but non lucratif, établi à Kinshasa.</p>
            <p className="f-motto">« {ACH.motto.replace(/\.$/, '')} »</p>
          </div>
          <div>
            <h4>L’Académie</h4>
            <ul>
              <li><Link to="/academie">Qui sommes-nous</Link></li>
              <li><Link to="/academie/fondateur">Le fondateur</Link></li>
              <li><Link to="/academie/gouvernance">Gouvernance</Link></li>
              <li><Link to="/recherche">Recherche et innovation</Link></li>
              <li><Link to="/actualites">Actualités</Link></li>
            </ul>
          </div>
          <div>
            <h4>Étudier</h4>
            <ul>
              <li><Link to="/formations">Formations</Link></li>
              <li><Link to="/universite">Programmes universitaires</Link></li>
              <li><Link to="/admissions">Admissions</Link></li>
              <li><Link to="/entreprises">Entreprises et organisations</Link></li>
              <li><Link to="/professeur">Enseigner à l’ACH</Link></li>
              <li><Link to="/connexion">Se connecter</Link></li>
              <li><Link to="/verifier">Vérifier un certificat</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="f-contact">
              <li><Icon name="pin" size={18} /><span>{ACH.address}</span></li>
              {ACH.email && <li><Icon name="mail" size={18} /><a href={`mailto:${ACH.email}`}>{ACH.email}</a></li>}
              {ACH.phone && <li><Icon name="phone" size={18} /><a href={`tel:${ACH.phone.replace(/\s/g, '')}`}>{ACH.phone}</a></li>}
              <li><Link to="/contact">Écrire à l’Académie</Link></li>
            </ul>
            {ACH.socials.length > 0 && (
              <ul style={{ flexDirection: 'row', marginTop: 14 }}>
                {ACH.socials.map((s) => <li key={s.href}><a href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>)}
              </ul>
            )}
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} Académie du Capital Humain. Tous droits réservés.</span>
          <nav aria-label="Mentions légales">
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Politique de confidentialité</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
