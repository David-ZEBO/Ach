import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { useReveal, useScrolledHeader } from './lib/motion';
import { Footer } from './components/Footer';
import Home from './pages/Home';
import Academie from './pages/Academie';
import Fondateur from './pages/Fondateur';
import Gouvernance from './pages/Gouvernance';
import Formations from './pages/Formations';
import Formation from './pages/Formation';
import Universite from './pages/Universite';
import Programme from './pages/Programme';
import Admissions from './pages/Admissions';
import Entreprises from './pages/Entreprises';
import Contact from './pages/Contact';
import Connexion from './pages/Connexion';
import Espace from './pages/Espace';
import Apprendre from './pages/Apprendre';
import AdminCertificat from './pages/AdminCertificat';
import AdminFormations, { AdminFormationNew } from './pages/admin/AdminFormations';
import { AdminApplications, AdminCertificates, AdminDashboard, AdminEnrollmentRequests, AdminMessages, AdminUsers } from './pages/admin/AdminSections';
import AdminFormationEdit from './pages/admin/AdminFormationEdit';
import AdminEnseignants from './pages/admin/AdminEnseignants';
import Professeur, { ProfesseurCandidature, ProfesseurCours, ProfesseurNouveauCours } from './pages/professeur/Professeur';
import { Legal, NotFound, Recherche, Verifier } from './pages/Simple';
import Actualites, { Actualite } from './pages/Actualites';
import AdminActualites from './pages/admin/AdminActualites';

// Anciennes adresses du catalogue B20 : les formations sont maintenant dans la base, avec le même identifiant.
function OldB20Redirect() {
  const { slug = '' } = useParams();
  return <Navigate to={`/formations/${slug}`} replace />;
}

function Layout() {
  const { pathname, hash } = useLocation();
  useScrolledHeader();
  useReveal(pathname);
  // Remonte en haut à chaque page ; laisse le navigateur gérer les ancres (#section).
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      <Header />
      <main id="contenu"><div key={pathname} className="page-enter"><Outlet /></div></main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="academie" element={<Academie />} />
        <Route path="academie/fondateur" element={<Fondateur />} />
        <Route path="academie/gouvernance" element={<Gouvernance />} />
        <Route path="formations" element={<Formations />} />
        <Route path="formations/presentiel/:slug" element={<OldB20Redirect />} />
        <Route path="formations/:slug" element={<Formation />} />
        <Route path="universite" element={<Universite />} />
        <Route path="universite/:slug" element={<Programme />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="recherche" element={<Recherche />} />
        <Route path="entreprises" element={<Entreprises />} />
        <Route path="actualites" element={<Actualites />} />
        <Route path="actualites/:slug" element={<Actualite />} />
        <Route path="admin/actualites" element={<AdminActualites />} />
        <Route path="contact" element={<Contact />} />
        <Route path="verifier" element={<Verifier />} />
        <Route path="connexion" element={<Connexion />} />
        <Route path="auth/callback" element={<Connexion />} />
        <Route path="mon-compte" element={<Espace />} />
        <Route path="espace" element={<Navigate to="/mon-compte" replace />} />
        <Route path="apprendre/:slug" element={<Apprendre />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/candidatures" element={<AdminApplications />} />
        <Route path="admin/enseignants" element={<AdminEnseignants />} />
        <Route path="professeur" element={<Professeur />} />
        <Route path="professeur/candidature" element={<ProfesseurCandidature />} />
        <Route path="professeur/cours/nouveau" element={<ProfesseurNouveauCours />} />
        <Route path="professeur/cours/:id" element={<ProfesseurCours />} />
        <Route path="admin/inscriptions" element={<AdminEnrollmentRequests />} />
        <Route path="admin/utilisateurs" element={<AdminUsers />} />
        <Route path="admin/certificats" element={<AdminCertificates />} />
        <Route path="admin/messages" element={<AdminMessages />} />
        <Route path="admin/formations" element={<AdminFormations />} />
        <Route path="admin/formations/nouvelle" element={<AdminFormationNew />} />
        <Route path="admin/formations/:id" element={<AdminFormationEdit />} />
        <Route path="admin/certificat" element={<AdminCertificat />} />
        <Route path="certificates/verify/:code" element={<Verifier />} />
        <Route path="mentions-legales" element={<Legal kind="mentions" />} />
        <Route path="confidentialite" element={<Legal kind="confidentialite" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
