import { Link, useParams } from 'react-router-dom';
import { acceptsApplications, getProgramme } from '../lib/api';
import { DOCUMENT_LABEL, formatDuration, formatMonths, formatPrice, PROGRAMME_LEVEL, PROGRAMME_STATUS } from '../lib/format';
import { useAsync, usePageMeta } from '../lib/hooks';
import { Icon } from '../components/Icon';
import { Empty, ErrorNote } from '../components/ui';

export default function Programme() {
  const { slug = '' } = useParams();
  const { data: p, error, loading } = useAsync(() => getProgramme(slug), [slug]);
  usePageMeta(p?.name ?? 'Programme', p?.summary);

  if (loading) return <div className="wrap sec"><div className="skeleton" style={{ minHeight: 420 }} /></div>;
  if (error) return <div className="wrap sec"><ErrorNote error={error} /></div>;
  if (!p) return <div className="wrap sec"><Empty title="Ce programme est introuvable."><p style={{ marginTop: 12 }}><Link to="/universite">Voir tous les programmes</Link></p></Empty></div>;

  const st = PROGRAMME_STATUS[p.status];
  const semesters = [...new Set(p.units.map((u) => u.semester))];
  const credits = p.units.reduce((n, u) => n + u.credits, 0);
  const canApply = acceptsApplications(p);

  return (
    <>
      <section className="course-hero">
        <div className="wrap wide" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <nav className="crumbs" aria-label="Fil d’Ariane"><Link to="/">Accueil</Link><span>› <Link to="/universite">Programmes universitaires</Link></span>{p.faculty && <span>› <Link to={`/universite#${p.faculty_slug}`}>{p.faculty}</Link></span>}</nav>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <span className="lvl on-dark">{PROGRAMME_LEVEL[p.level]}</span>
              <span className={`status ${st.tone}`}>{st.label}</span>
              {p.is_demo && <span className="status closed">Démonstration</span>}
            </div>
            <h1>{p.name}</h1>
            {p.summary && <p className="sub">{p.summary}</p>}
            <div className="meta">
              <span><Icon name="building" size={15} />{p.faculty}</span>
              <span><Icon name="clock" size={15} />{formatMonths(p.duration_months)}</span>
              {semesters.length > 0 && <span><Icon name="book" size={15} />{semesters.length} semestre{semesters.length > 1 ? 's' : ''} · {p.units.length} unités</span>}
              {credits > 0 && <span><Icon name="chart" size={15} />{credits} crédits</span>}
              <span><Icon name="laptop" size={15} />En ligne, en français</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap course-layout">
          <div>
            {(p.is_provisional || p.is_demo) && (
              <p className="alert" style={{ background: 'var(--soft)', borderLeft: '4px solid var(--navy)', marginBottom: 32 }}>
                {p.is_demo ? 'Programme de démonstration, destiné à présenter le fonctionnement de la plateforme.' : 'Programme en préparation : son contenu, sa maquette et son calendrier peuvent encore évoluer avant l’ouverture.'}
              </p>
            )}
            <section>
              <h2>Présentation</h2>
              <div className="prose">{(p.description || p.summary || 'La présentation détaillée de ce programme sera publiée prochainement.').split(/\n{2,}/).map((t, i) => <p key={i}>{t}</p>)}</div>
            </section>

            <section>
              <h2>Maquette du programme</h2>
              {p.units.length === 0 ? (
                <Empty title="La maquette détaillée sera publiée prochainement.">Unités d’enseignement, semestres et crédits.</Empty>
              ) : (
                <div className="maquette">
                  {semesters.map((s) => {
                    const us = p.units.filter((u) => u.semester === s);
                    return (
                      <div key={s} className="sem">
                        <div className="sem-head"><b>Semestre {s}</b><span>{us.reduce((n, u) => n + u.credits, 0)} crédits</span></div>
                        <ul>
                          {us.map((u) => (
                            <li key={u.course_slug + u.position}>
                              <Link to={`/formations/${u.course_slug}`}>{u.title}</Link>
                              <span className="u-meta">{u.is_mandatory ? 'Obligatoire' : 'Optionnelle'} · {formatDuration(u.duration_minutes)}</span>
                              <span className="cr">{u.credits} cr.</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {p.required_documents.length > 0 && (
              <section>
                <h2>Pièces du dossier</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 14 }}>Demandées après la présélection, depuis votre espace candidat.</p>
                <ul className="pill-list">{p.required_documents.map((d) => <li key={d}>{DOCUMENT_LABEL[d] ?? d}</li>)}</ul>
              </section>
            )}
          </div>

          <aside className="aside" aria-label="Candidature">
            <span className={`status ${st.tone}`} style={{ marginBottom: 14, display: 'inline-block' }}>{st.label}</span>
            <dl>
              <dt>Niveau</dt><dd>{PROGRAMME_LEVEL[p.level]}</dd>
              <dt>Faculté</dt><dd>{p.faculty}</dd>
              <dt>Durée</dt><dd>{formatMonths(p.duration_months)}</dd>
              {credits > 0 && <><dt>Crédits</dt><dd>{credits}</dd></>}
              <dt>Modalité</dt><dd>En ligne</dd>
              <dt>Frais de dossier</dt><dd>{formatPrice(p.application_fee_amount, p.application_fee_currency)}</dd>
            </dl>
            {canApply ? (
              <Link className="btn btn-red" to={`/admissions?programme=${p.slug}#candidater`}>{p.status === 'open' ? 'Déposer ma candidature' : 'Candidater en avance'}</Link>
            ) : (
              <button className="btn btn-red" disabled>Candidatures fermées</button>
            )}
            <Link className="btn btn-outline" to="/contact?sujet=enrollment">Poser une question</Link>
            {p.authorization_reference && <p style={{ marginTop: 16, fontSize: '.8rem', color: 'var(--muted)' }}>{p.authorization_reference}</p>}
          </aside>
        </div>
      </section>
    </>
  );
}
