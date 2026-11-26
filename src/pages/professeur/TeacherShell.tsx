import type { ReactNode } from 'react';
import { Link, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

/** Cadre de l'espace professeur (connexion requise ; les droits réels sont vérifiés par la base). */
export function TeacherShell({ title, children, back }: { title: string; children: ReactNode; back?: { to: string; label: string } }) {
  const { session, ready } = useAuth();
  if (!ready) return null;
  if (!session) return <Navigate to={`/connexion?retour=${encodeURIComponent(location.pathname)}`} replace />;
  return (
    <section className="admin teacher">
      <div className="admin-bar">
        <div className="wrap wide">
          <span className="eyebrow">Espace professeur</span>
          <nav aria-label="Espace professeur">
            <NavLink to="/professeur" end>Mes cours</NavLink>
            <NavLink to="/professeur/cours/nouveau">Nouveau cours</NavLink>
            <NavLink to="/professeur/candidature">Mes demandes</NavLink>
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
