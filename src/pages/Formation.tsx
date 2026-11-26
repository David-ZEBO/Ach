import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { enrollFreeCourse, getCourse, listFaq } from '../lib/api';
import { getEnrollment } from '../lib/learn';
import { authMessage, useAuth } from '../lib/auth';
import { formatDuration, formatPrice, LEVEL_LABEL } from '../lib/format';
import { useAsync, usePageMeta } from '../lib/hooks';
import { coverImage } from '../lib/images';
import { Icon } from '../components/Icon';
import { Empty, ErrorNote } from '../components/ui';

export default function Formation() {
  const { slug = '' } = useParams();
  const { data: c, error, loading } = useAsync(() => getCourse(slug), [slug]);
  const faq = useAsync(listFaq, []);
  const { session } = useAuth();
  const navigate = useNavigate();
  const enrolled = useAsync(async () => (session && c ? (await getEnrollment(session.user.id, c.id))?.status === 'active' : false), [session?.user.id, c?.id]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  usePageMeta(c?.t?.title ?? 'Formation', c?.t?.short_description);

  if (loading) return <div className="wrap sec"><div className="skeleton" style={{ minHeight: 420 }} /></div>;
  if (error) return <div className="wrap sec"><ErrorNote error={error} /></div>;
  if (!c || !c.t) return <div className="wrap sec"><Empty title="Cette formation est introuvable."><p style={{ marginTop: 12 }}><Link to="/formations">Voir toutes les formations</Link></p></Empty></div>;

  const t = c.t;
  const lessons = c.modules.reduce((n, m) => n + m.lessons.length, 0);
  const free = c.price_amount === 0;
  const unitOf = c.programmes;
  const isUnit = unitOf.length > 0;

  async function enroll() {
    if (!session) { navigate(`/connexion?retour=/formations/${slug}`); return; }
    setBusy(true); setMsg(null);
    try { await enrollFreeCourse(c!.id); navigate(`/apprendre/${slug}`); }
    catch (e) {
      const m = (e as Error).message;
      setMsg({ ok: false, text: m.includes('demo_course') ? 'Cette formation de démonstration n’est pas encore ouverte aux inscriptions.' : m.includes('not_free') ? 'Cette formation est payante : contactez l’Académie pour vous inscrire.' : authMessage(e) });
    } finally { setBusy(false); }
  }

  return (
    <>
      <section className="course-hero">
        <div className="wrap wide">
          <div>
            <nav className="crumbs" aria-label="Fil d’Ariane"><Link to="/">Accueil</Link>{isUnit ? <><span>› <Link to="/universite">Programmes universitaires</Link></span><span>› <Link to={`/universite/${unitOf[0].slug}`}>{unitOf[0].name}</Link></span></> : <><span>› <Link to="/formations">Formations</Link></span>{c.category && <span>› <Link to={`/formations?categorie=${c.category.slug}`}>{c.category.name}</Link></span>}</>}</nav>
            <h1>{t.title}</h1>
            {t.subtitle && <p className="sub">{t.subtitle}</p>}
            <div className="meta">
              <span><Icon name="clock" size={15} />{formatDuration(c.duration_minutes)}</span>
              <span><Icon name="level" size={15} />{LEVEL_LABEL[c.level]}</span>
              <span><Icon name="laptop" size={15} />En ligne</span>
              <span><Icon name="book" size={15} />{c.modules.length} modules · {lessons} leçons</span>
            </div>
          </div>
          <img src={coverImage(c.cover_path, c.category?.slug)} alt="" />
        </div>
      </section>

      <section className="sec">
        <div className="wrap course-layout">
          <div>
            {isUnit && (
              <div className="unit-note">
                <Icon name="cap" size={24} />
                <div>
                  <b style={{ fontFamily: 'var(--display)', color: 'var(--navy)' }}>Unité d’enseignement universitaire</b>
                  <p style={{ color: 'var(--muted)', marginTop: 4 }}>
                    Ce cours fait partie {unitOf.length > 1 ? 'des programmes' : 'du programme'}{' '}
                    {unitOf.map((p, i) => <span key={p.slug}>{i > 0 && ', '}<Link to={`/universite/${p.slug}`}>{p.name}</Link> (semestre {p.semester}, {p.credits} crédits)</span>)}.
                    On y accède en étant admis au programme.
                  </p>
                </div>
              </div>
            )}
            <section>
              <h2>Présentation</h2>
              <div className="prose">{(t.description || t.short_description).split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
            </section>
            {t.objectives.length > 0 && <section><h2>Objectifs et compétences visées</h2><ul className="list-check">{t.objectives.map((o) => <li key={o}>{o}</li>)}</ul></section>}
            {t.audience.length > 0 && <section><h2>Public cible</h2><ul className="list-check">{t.audience.map((o) => <li key={o}>{o}</li>)}</ul></section>}
            {t.prerequisites.length > 0 && <section><h2>Prérequis</h2><ul className="list-check">{t.prerequisites.map((o) => <li key={o}>{o}</li>)}</ul></section>}
            {c.modules.length > 0 && (
              <section>
                <h2>Programme</h2>
                <div className="syllabus">
                  {c.modules.map((m, i) => (
                    <details key={m.id} open={i === 0}>
                      <summary>{m.title}<small>{m.lessons.length} leçon{m.lessons.length > 1 ? 's' : ''}</small></summary>
                      <ul>{m.lessons.map((l) => <li key={l.id}><span>{l.title}</span>{l.is_preview ? <span className="prev">Aperçu gratuit</span> : l.duration_minutes ? <span style={{ color: 'var(--muted)' }}>{l.duration_minutes} min</span> : null}</li>)}</ul>
                    </details>
                  ))}
                </div>
              </section>
            )}
            {(c.instructor_name || t.instructor_bio) && (
              <section><h2>Formateur</h2>{c.instructor_name && <p style={{ fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--navy)' }}>{c.instructor_name}</p>}{t.instructor_bio && <p className="prose" style={{ marginTop: 8 }}>{t.instructor_bio}</p>}</section>
            )}
            {faq.data && faq.data.length > 0 && (
              <section className="faq"><h2>Questions fréquentes</h2>{faq.data.slice(0, 5).map((q) => <details key={q.id}><summary>{q.question}</summary><p>{q.answer}</p></details>)}</section>
            )}
          </div>

          <aside className="aside" aria-label="Inscription">
            <span className="price">{formatPrice(c.price_amount, c.currency)}</span>
            <dl>
              <dt>Durée</dt><dd>{formatDuration(c.duration_minutes)}</dd>
              <dt>Niveau</dt><dd>{LEVEL_LABEL[c.level]}</dd>
              <dt>Modalité</dt><dd>En ligne</dd>
              <dt>Contenu</dt><dd>{lessons} leçons</dd>
              {c.certificate_enabled && <><dt>Certificat</dt><dd>Certificat de réussite ACH</dd></>}
            </dl>
            {enrolled.data ? (
              <Link className="btn btn-red" to={`/apprendre/${slug}`}>Accéder au cours</Link>
            ) : isUnit ? (
              <Link className="btn btn-red" to={`/universite/${unitOf[0].slug}`}>Voir le programme</Link>
            ) : free ? (
              <button className="btn btn-red" onClick={enroll} disabled={busy}>{busy ? 'Inscription…' : session ? 'S’inscrire gratuitement' : 'Se connecter pour s’inscrire'}</button>
            ) : (
              <Link className="btn btn-red" to={`/contact?sujet=enrollment&formation=${encodeURIComponent(t.title)}`}>Postuler à cette formation</Link>
            )}
            <Link className="btn btn-outline" to="/admissions">Comment s’inscrire</Link>
            {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status" style={{ marginTop: 14 }}>{msg.text}</p>}
          </aside>
        </div>
      </section>
    </>
  );
}
