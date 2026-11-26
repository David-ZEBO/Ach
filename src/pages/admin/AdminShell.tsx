import type { ReactNode } from 'react';
import { Link, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { isAdmin } from '../../lib/certificate';
import { useAsync } from '../../lib/hooks';

/** Accès réservé aux administrateurs (rôle « admin » dans user_roles ; la base revérifie chaque écriture). */
export function AdminShell({ title, children, back }: { title: string; children: ReactNode; back?: { to: string; label: string } }) {
  const { session, ready } = useAuth();
  const admin = useAsync(() => (session ? isAdmin(session.user.id) : Promise.resolve(false)), [session?.user.id]);
  if (!ready || admin.loading) return null;
  if (!session) return <Navigate to={`/connexion?retour=${encodeURIComponent(location.pathname)}`} replace />;
  if (!admin.data) return <div className="wrap sec"><p className="alert err">Cette page est réservée aux administrateurs de l’Académie.</p></div>;
  return (
    <section className="admin">
      <div className="admin-bar">
        <div className="wrap wide">
          <span className="eyebrow">Administration</span>
          <nav aria-label="Administration">
            <NavLink to="/admin" end>Tableau de bord</NavLink>
            <NavLink to="/admin/formations">Formations</NavLink>
            <NavLink to="/admin/candidatures">Candidatures</NavLink>
            <NavLink to="/admin/enseignants">Enseignants</NavLink>
            <NavLink to="/admin/inscriptions">Inscriptions</NavLink>
            <NavLink to="/admin/utilisateurs">Utilisateurs</NavLink>
            <NavLink to="/admin/certificats">Certificats</NavLink>
            <NavLink to="/admin/actualites">Actualités</NavLink>
            <NavLink to="/admin/messages">Messages</NavLink>
            <NavLink to="/admin/certificat">Modèle de certificat</NavLink>
          </nav>
        </div>
      </div>
      <div className="wrap wide admin-main">
        {back && <Link className="back-link" to={back.to}>← {back.label}</Link>}
        <h1 className="h2" style={{ marginTop: back ? 8 : 0 }}>{title}</h1>
        {children}
      </div>
    </section>
  );
}
