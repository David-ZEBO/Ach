import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ACH } from '../lib/content';
import { useAuth } from '../lib/auth';
import { Icon, type IconName } from './Icon';

type Mega = { title: string; text: string; cta: { label: string; to: string }; cols: { h: string; links: { label: string; to: string }[] }[] };
type Item = { label: string; short?: string; to: string; icon: IconName; mega?: Mega };

const NAV: Item[] = [
  { label: 'Accueil', to: '/', icon: 'building' },
  {
    label: "L'Académie", to: '/academie', icon: 'target',
    mega: {
      title: "Une académie au service du capital humain",
      text: 'Établissement à caractère scientifique, d’enseignement supérieur et de formation, à but non lucratif, siégeant à Kinshasa.',
      cta: { label: 'Découvrir l’Académie', to: '/academie' },
      cols: [
        { h: 'Présentation', links: [{ label: 'Qui sommes-nous', to: '/academie' }, { label: 'Contexte de création', to: '/academie#contexte' }, { label: 'Mission et vision', to: '/academie#mission' }] },
        { h: 'Institution', links: [{ label: 'Le fondateur', to: '/academie/fondateur' }, { label: 'Gouvernance', to: '/academie/gouvernance' }, { label: 'Valeurs', to: '/academie#valeurs' }] },
        { h: 'Engagements', links: [{ label: 'Objectifs', to: '/academie#objectifs' }, { label: 'Domaines d’intervention', to: '/academie#domaines' }] },
      ],
    },
  },
  {
    label: 'Formations', to: '/formations', icon: 'book',
    mega: {
      title: 'Des formations courtes pour développer une compétence',
      text: 'Formations continues et professionnelles, en ligne, avec inscription directe.',
      cta: { label: 'Voir toutes les formations', to: '/formations' },
      cols: [
        { h: 'Domaines', links: [{ label: 'Leadership et management', to: '/formations?categorie=leadership' }, { label: 'Entrepreneuriat et gestion', to: '/formations?categorie=entrepreneurship' }, { label: 'Marketing digital', to: '/formations?categorie=marketing' }] },
        { h: '', links: [{ label: 'Finance et comptabilité', to: '/formations?categorie=finance' }, { label: 'Ressources humaines', to: '/formations?categorie=human-resources' }, { label: 'Développement web et IA', to: '/formations?categorie=technology' }] },
        { h: 'Niveaux', links: [{ label: 'Débutant', to: '/formations?niveau=beginner' }, { label: 'Intermédiaire', to: '/formations?niveau=intermediate' }, { label: 'Avancé', to: '/formations?niveau=advanced' }, { label: 'Programmes universitaires →', to: '/universite' }] },
      ],
    },
  },
  {
    label: 'Université', to: '/universite', icon: 'cap',
    mega: {
      title: 'Licences, masters et certificats universitaires',
      text: 'Des programmes complets organisés en facultés, semestres et crédits, avec admission sur candidature.',
      cta: { label: 'Voir les programmes', to: '/universite' },
      cols: [
        { h: 'Niveaux', links: [{ label: 'Certificats universitaires', to: '/universite?niveau=certificate' }, { label: 'Licences', to: '/universite?niveau=bachelor' }, { label: 'Masters', to: '/universite?niveau=master' }] },
        { h: 'Facultés', links: [{ label: 'Sciences économiques et de gestion', to: '/universite#sciences-economiques-gestion' }, { label: 'Management, leadership et RH', to: '/universite#management-leadership-rh' }, { label: 'Sciences et technologies du numérique', to: '/universite#sciences-technologies-numerique' }, { label: 'Communication et marketing', to: '/universite#communication-marketing' }] },
        { h: 'Admission', links: [{ label: 'Déposer une candidature', to: '/admissions#candidater' }, { label: 'Étapes d’admission', to: '/admissions' }, { label: 'Suivre mon dossier', to: '/mon-compte' }] },
      ],
    },
  },
  { label: 'Admissions', to: '/admissions', icon: 'check' },
  { label: 'Recherche et innovation', short: 'Recherche', to: '/recherche', icon: 'flask' },
  { label: 'Entreprises et organisations', short: 'Entreprises', to: '/entreprises', icon: 'handshake' },
  { label: 'Actualités', to: '/actualites', icon: 'chart' },
  { label: 'Contact', to: '/contact', icon: 'mail' },
];

export function Header() {
  const { session } = useAuth();
  const account = session ? { to: '/mon-compte', label: 'Mon compte' } : { to: '/connexion', label: 'Se connecter' };
  const [open, setOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const { pathname, search, hash } = useLocation();
  const ref = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Ferme les menus à chaque navigation.
  useEffect(() => { setOpen(false); setOpenMega(null); }, [pathname, search, hash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpenMega(null); setOpen(false); } };
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpenMega(null); };
    document.addEventListener('keydown', onKey); document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);

  // Panneau mobile : bloque le défilement de la page et gère le focus.
  const wasOpen = useRef(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) burgerRef.current?.focus();
    wasOpen.current = open;
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <a className="skip" href="#contenu">Aller au contenu</a>
      <div className="topbar">
        <div className="wrap wide">
          <span className="motto">« Le capital humain, socle de toute création des valeurs. »</span>
          <nav aria-label="Liens rapides">
            <Link to="/verifier">Vérifier un certificat</Link>
            <Link to="/contact">Nous contacter</Link>
          </nav>
        </div>
      </div>
      <header className="site" ref={ref}>
        <div className="wrap wide bar">
          <Link className="logo" to="/" aria-label="Académie du Capital Humain, accueil">
            <img src="/images/logo-ach.jpg" alt="ACH, Académie du Capital Humain" width={670} height={278} />
          </Link>

          <div className={`nav-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
          <nav className={`mainnav${open ? ' open' : ''}`} id="mainnav" aria-label="Navigation principale">
            <div className="drawer-head">
              <Link className="logo" to="/" aria-label="Accueil"><img src="/images/logo-ach.jpg" alt="" width={670} height={278} /></Link>
              <button ref={closeRef} type="button" className="drawer-close" aria-label="Fermer le menu" onClick={() => setOpen(false)}><span /><span /></button>
            </div>

            <div className="drawer-body">
              {NAV.map((item) =>
                item.mega ? (
                  <div key={item.to} className={`navitem${openMega === item.to ? ' open' : ''}`}>
                    <button
                      type="button"
                      className={`navlink${pathname.startsWith(item.to) ? ' active' : ''}`}
                      aria-expanded={openMega === item.to}
                      onClick={() => setOpenMega(openMega === item.to ? null : item.to)}
                    >
                      <span className="ni"><Icon name={item.icon} size={20} /></span>{item.label} <span className="chev" />
                    </button>
                    <div className="mega">
                      <div className="wrap wide">
                        <div className="intro">
                          <h3>{item.mega.title}</h3>
                          <p>{item.mega.text}</p>
                          <Link className="btn btn-red btn-sm" to={item.mega.cta.to}>{item.mega.cta.label}</Link>
                        </div>
                        <Link className="mega-all" to={item.mega.cta.to}>{item.mega.cta.label} →</Link>
                        <div className="cols">
                          {item.mega.cols.map((c, i) => (
                            <div key={i}>
                              {c.h ? <h4>{c.h}</h4> : <h4 className="spacer" aria-hidden="true">&nbsp;</h4>}
                              <ul>{c.links.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}</ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={item.to} className="navitem">
                    <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                      <span className="ni"><Icon name={item.icon} size={20} /></span>
                      {item.short ? <><span className="d-only" title={item.label}>{item.short}</span><span className="m-only">{item.label}</span></> : item.label}
                    </NavLink>
                  </div>
                ),
              )}
            </div>

            <div className="drawer-foot">
              <Link className="btn btn-navy" to={account.to}>{account.label}</Link>
              <Link className="drawer-link" to="/verifier">Vérifier un certificat</Link>
              <p className="drawer-addr"><Icon name="pin" size={16} />{ACH.address}</p>
              <p className="drawer-motto">« {ACH.motto.replace(/\.$/, '')} »</p>
            </div>
          </nav>

          <div className="hdr-actions">
            <Link className="btn btn-outline btn-sm btn-login" to={account.to}>{account.label}</Link>
            <button ref={burgerRef} className="burger" type="button" aria-label="Ouvrir le menu" aria-controls="mainnav" aria-expanded={open} onClick={() => setOpen(true)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
