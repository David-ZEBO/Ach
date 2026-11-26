import { Link } from 'react-router-dom';
import { listCategories, listFaculties, searchCourses } from '../lib/api';
import { PROGRAMME_LEVEL } from '../lib/format';
import { facultyImage } from '../lib/images';
import { listNews } from '../lib/news';
import { NewsCard } from './Actualites';
import { CONTEXT, MISSION, VISION } from '../lib/content';
import { useAsync, usePageMeta } from '../lib/hooks';
import { useFounder } from '../lib/useFounder';
import { Icon, type IconName } from '../components/Icon';
import { CardSkeletons, CourseCard, Cta, Empty, ErrorNote, SectionHead } from '../components/ui';

const WHY: { icon: IconName; t: string; d: string }[] = [
  { icon: 'spark', t: 'Développement des compétences', d: 'Des parcours conçus pour faire progresser chaque apprenant, du premier pas à l’expertise.' },
  { icon: 'tools', t: 'Approche pratique', d: 'Études de cas, exercices et mises en situation proches de la réalité professionnelle.' },
  { icon: 'laptop', t: 'Formation professionnelle', d: 'Des formations continues et professionnelles accessibles en ligne, à votre rythme.' },
  { icon: 'users', t: 'Accompagnement', d: 'Des formateurs qui corrigent, répondent et suivent votre progression.' },
  { icon: 'target', t: 'Leadership', d: 'Le leadership au cœur des programmes, pour diriger et entraîner les autres.' },
  { icon: 'flask', t: 'Innovation', d: 'Une recherche appliquée qui nourrit les contenus de formation.' },
  { icon: 'chart', t: 'Développement du potentiel', d: 'Mentorat et ressources pour révéler et faire grandir vos talents.' },
  { icon: 'compass', t: 'Orientation professionnelle', d: 'Un accompagnement vers l’insertion professionnelle et le développement de carrière.' },
];

const AUDIENCE = ['Entreprises', 'ONG', 'Organisations', 'Administrations', 'Associations', 'Professionnels', 'Entrepreneurs', 'Communautés'];

export default function Home() {
  usePageMeta('', "L'Académie du Capital Humain accompagne le développement des compétences, du leadership et de l'excellence professionnelle pour contribuer à la transformation économique et sociale.");
  const founder = useFounder();
  const cats = useAsync(listCategories, []);
  const courses = useAsync(() => searchCourses({ limit: 6 }), []);
  const faculties = useAsync(listFaculties, []);
  const news = useAsync(() => listNews({ limit: 3 }), []);
  const catName = (slug: string | null) => cats.data?.find((c) => c.slug === slug)?.name;

  return (
    <>
      {/* 1. Hero */}
      <section className="home-hero">
        <div className="bg" aria-hidden="true" />
        <div className="wrap wide">
          <div className="reveal">
            <span className="eyebrow" style={{ color: '#FF8A8F' }}>Académie du Capital Humain · Kinshasa</span>
            <h1 style={{ marginTop: 18 }}>Développez votre potentiel. <em>Transformez votre avenir.</em></h1>
            <p className="lead">L’Académie du Capital Humain accompagne le développement des compétences, du leadership et de l’excellence professionnelle pour contribuer à la transformation économique et sociale.</p>
            <div className="btns">
              <Link className="btn btn-red" to="/formations">Découvrir nos formations</Link>
              <Link className="btn btn-ghost" to="/admissions">Rejoindre l’Académie</Link>
            </div>
          </div>
          <aside className="hero-card reveal" style={{ animationDelay: '.15s' }}>
            <h2>Ce que propose l’Académie</h2>
            <ul>
              {['Formation initiale, continue et professionnelle', 'Renforcement des capacités', 'Recherche appliquée', 'Séminaires, conférences et mentorat'].map((t) => (
                <li key={t}><Icon name="check" size={18} />{t}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
      <nav className="hero-band" aria-label="Accès rapides">
        <div className="wrap wide">
          <Link to="/formations"><Icon name="book" />Nos formations</Link>
          <Link to="/admissions"><Icon name="check" />Admissions</Link>
          <Link to="/entreprises"><Icon name="building" />Entreprises</Link>
          <Link to="/recherche"><Icon name="flask" />Recherche</Link>
        </div>
      </nav>

      {/* Deux façons d'étudier */}
      <section className="sec" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <SectionHead eyebrow="Étudier à l’ACH" title="Deux façons d’étudier à l’Académie" lede="Développez une compétence précise avec une formation, ou préparez un parcours universitaire complet." />
          <div className="two-ways">
            <Link className="way" to="/formations">
              <span className="ni-lg"><Icon name="book" size={26} /></span>
              <h3>Formations</h3>
              <p>Des formations courtes et ciblées, en ligne et à votre rythme.</p>
              <ul className="list-check"><li>Inscription directe, sans dossier</li><li>Leadership, entrepreneuriat, finance, marketing, RH, numérique</li><li>Certificat de réussite</li></ul>
              <span className="go">Voir les formations →</span>
            </Link>
            <Link className="way uni" to="/universite">
              <span className="ni-lg"><Icon name="cap" size={26} /></span>
              <h3>Programmes universitaires</h3>
              <p>Des programmes complets organisés en facultés, semestres et crédits.</p>
              <ul className="list-check"><li>Certificats universitaires, licences et masters</li><li>Quatre facultés spécialisées</li><li>Admission sur candidature</li></ul>
              <span className="go">Voir les programmes →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Présentation */}
      <section className="sec">
        <div className="wrap split">
          <div>
            <span className="eyebrow">L’Académie</span>
            <h2 className="h2">Investir dans le capital humain, c’est investir dans l’avenir.</h2>
            <div className="prose" style={{ marginTop: 20 }}>
              <p>{CONTEXT[0]}</p>
              <p>L’Académie du Capital Humain (ACH) est un établissement d’utilité publique à caractère scientifique, d’enseignement supérieur et de formation, établi à Kinshasa. Elle organise des activités de renforcement des capacités, d’accompagnement scientifique et de recherche appliquée au bénéfice des personnes, des organisations et des communautés.</p>
              <p>Elle poursuit un but non lucratif : ses ressources sont affectées à la réalisation de son objet et à son développement.</p>
            </div>
            <div style={{ marginTop: 28 }}><Cta to="/academie">En savoir plus</Cta></div>
          </div>
          <div className="media media-frame"><img src="/images/photos/b3-large.jpg" alt="Apprenants travaillant ensemble autour d’un ordinateur" loading="lazy" /></div>
        </div>
      </section>

      {/* 3. Fondateur */}
      <section className="sec soft" aria-labelledby="fondateur-titre">
        <div className="wrap founder">
          <div className="founder-photo">
            <img src={founder.photo} alt={`Portrait du ${founder.name}`} loading="lazy" />
            <div className="badge"><b>{founder.name}</b><span>Fondateur de l’ACH</span></div>
          </div>
          <div>
            <span className="eyebrow">À l’origine de l’Académie</span>
            <h2 id="fondateur-titre">Le mot du fondateur</h2>
            <p className="intro">Le {founder.name} est {founder.intro.charAt(0).toLowerCase() + founder.intro.slice(1)}</p>
            <p style={{ marginTop: 14, color: 'var(--muted)' }}>Convaincu que le capital humain est le socle de toute création de valeur, il est à l’origine de l’Académie du Capital Humain, créée pour contribuer à la valorisation des compétences et au développement économique et social de la République démocratique du Congo.</p>
            <ul className="list-check roles">{founder.roles.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
            {founder.message && <blockquote>{founder.message}</blockquote>}
            <Cta to="/academie/fondateur">En savoir plus</Cta>
          </div>
        </div>
      </section>

      {/* 4. Mission et vision */}
      <section className="sec" id="mission">
        <div className="wrap">
          <SectionHead eyebrow="Notre raison d’être" title="Mission et vision" />
          <div className="mv">
            <div className="mv-card m"><div className="ic"><Icon name="target" size={26} /></div><h3>Mission</h3><p>{MISSION}</p></div>
            <div className="mv-card v"><div className="ic"><Icon name="eye" size={26} /></div><h3>Vision</h3><p>{VISION}</p></div>
          </div>
        </div>
      </section>

      {/* 5. Domaines */}
      <section className="sec soft">
        <div className="wrap">
          <SectionHead eyebrow="Domaines de formation" title="Nos domaines de formation" lede="Des domaines au cœur du développement du capital humain." action={<Cta to="/formations">Toutes les formations</Cta>} />
          {cats.error ? <ErrorNote error={cats.error} /> : (
            <div className="domains">
              {(cats.data ?? []).map((c) => (
                <Link key={c.slug} className="domain" to={`/formations?categorie=${c.slug}`}>
                  <h3>{c.name}</h3>
                  {c.description && <p>{c.description}</p>}
                  <span className="go">Voir les formations →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Formations */}
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Catalogue" title="Nos formations" lede="Des formations pratiques et accessibles à tous pour développer vos compétences professionnelles." action={<Link className="btn btn-navy" to="/formations">Voir toutes les formations</Link>} />
          {courses.loading ? <CardSkeletons /> : courses.error ? <ErrorNote error={courses.error} /> : courses.data!.length === 0 ? (
            <Empty title="Les prochaines formations arrivent bientôt." />
          ) : (
            <div className="grid-cards">{courses.data!.map((c) => <CourseCard key={c.id} c={c} categoryName={catName(c.category_slug)} />)}</div>
          )}
        </div>
      </section>

      {/* Programmes universitaires */}
      <section className="sec soft">
        <div className="wrap">
          <SectionHead eyebrow="Université" title="Nos programmes universitaires" lede="Quatre facultés pour préparer un certificat universitaire, une licence ou un master." action={<Link className="btn btn-navy" to="/universite">Tous les programmes</Link>} />
          {faculties.error ? <ErrorNote error={faculties.error} /> : faculties.loading ? <CardSkeletons n={4} /> : (
            <div className="fac-cards">
              {faculties.data!.filter((f) => f.programmes.some((p) => !p.is_demo)).map((f) => {
                const lv = [...new Set(f.programmes.map((p) => p.level))];
                return (
                  <Link key={f.id} className="fac-card" to={`/universite#${f.slug}`}>
                    <img src={facultyImage(f.image_path)} alt="" loading="lazy" />
                    <div>
                      <h3>{f.name}</h3>
                      {f.tagline && <p>{f.tagline}</p>}
                      <span className="fac-meta">{f.programmes.length} programme{f.programmes.length > 1 ? 's' : ''} · {lv.map((l) => PROGRAMME_LEVEL[l]).join(', ')}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 7. Pourquoi ACH */}
      <section className="sec navy">
        <div className="wrap">
          <SectionHead eyebrow="Pourquoi l’ACH" title="Pourquoi choisir l’Académie du Capital Humain ?" />
          <div className="why">{WHY.map((w) => <div key={w.t}><div className="ic"><Icon name={w.icon} size={30} /></div><h3>{w.t}</h3><p>{w.d}</p></div>)}</div>
        </div>
      </section>

      {/* 8. Renforcement des capacités */}
      <section className="sec">
        <div className="wrap split">
          <div className="media media-frame"><img src="/images/photos/mlr.jpg" alt="Séance de formation en salle" loading="lazy" /></div>
          <div>
            <span className="eyebrow">Renforcement des capacités</span>
            <h2 className="h2">Des formations sur mesure pour les organisations et les personnes</h2>
            <p className="lede">L’Académie conçoit des programmes de renforcement des capacités adaptés aux besoins de chaque structure : diagnostic, contenus sur mesure, animation et suivi.</p>
            <ul className="audience">{AUDIENCE.map((a) => <li key={a}>{a}</li>)}</ul>
            <Link className="btn btn-red" to="/entreprises#demande">Organiser une formation pour votre organisation</Link>
          </div>
        </div>
      </section>

      {/* 9. Recherche */}
      <section className="sec soft">
        <div className="wrap">
          <SectionHead eyebrow="Recherche et innovation" title="Une recherche appliquée au service du développement" lede="La recherche appliquée et les partenariats en formation, ressources humaines, leadership, entrepreneuriat et développement organisationnel font partie de l’objet de l’Académie." action={<Cta to="/recherche">Découvrir nos activités scientifiques</Cta>} />
          <div className="research">
            <div><div className="ic"><Icon name="flask" size={28} /></div><h3>Recherche appliquée</h3><p>Des études et projets qui répondent aux réalités des organisations et des communautés.</p></div>
            <div><div className="ic"><Icon name="book" size={28} /></div><h3>Publications</h3><p>Conception et diffusion de ressources pédagogiques, d’études, d’outils et de publications.</p></div>
            <div><div className="ic"><Icon name="handshake" size={28} /></div><h3>Partenariats</h3><p>Des partenariats scientifiques et professionnels pour mutualiser les savoirs.</p></div>
          </div>
        </div>
      </section>

      {/* 10. Formateurs */}
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Équipe pédagogique" title="Nos formateurs" lede="Des professionnels et des enseignants engagés dans la transmission des compétences." />
          <Empty title="Les profils de nos formateurs seront publiés prochainement.">Chaque profil présentera la photo, la profession, l’expertise, la biographie et les formations animées.</Empty>
        </div>
      </section>

      {/* 11. Apprenants */}
      <section className="sec soft">
        <div className="wrap">
          <SectionHead eyebrow="Expérience des apprenants" title="Ils se forment à l’ACH" lede="Parcours, réussites et témoignages de nos apprenants." />
          <Empty title="Les premiers témoignages d’apprenants seront publiés ici.">Seuls les témoignages réels, validés par l’Académie, sont publiés.</Empty>
        </div>
      </section>

      {/* 12. Actualités */}
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Actualités" title="Actualités et événements" lede="Annonces, événements, publications et opportunités de l’Académie." action={<Link className="btn btn-outline" to="/actualites">Toutes les actualités</Link>} />
          {news.error ? <ErrorNote error={news.error} /> : news.loading ? <CardSkeletons /> : (news.data ?? []).length === 0 ? (
            <Empty title="Aucune actualité publiée pour le moment.">Les actualités, événements et annonces de l’Académie apparaîtront ici.</Empty>
          ) : (
            <div className="news-grid home">{news.data!.map((n, i) => <NewsCard key={n.id} n={n} featured={i === 0} />)}</div>
          )}
        </div>
      </section>

      {/* 13. Entreprises */}
      <section className="b2b">
        <div className="wrap">
          <span className="eyebrow" style={{ color: '#fff' }}>Entreprises et organisations</span>
          <h2 style={{ marginTop: 12 }}>Développez les compétences de vos équipes.</h2>
          <p>Formation des équipes, renforcement des capacités et accompagnement : l’Académie construit avec vous un programme adapté à vos objectifs.</p>
          <ul className="pill-list">{['Formation des équipes', 'Renforcement des capacités', 'Formation sur mesure', 'Leadership', 'Management', 'Gestion de projets', 'Communication', 'Développement organisationnel'].map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="btns"><Link className="btn btn-white" to="/entreprises">Collaborer avec l’ACH</Link></div>
        </div>
      </section>

      {/* 14. Appel à l'action */}
      <section className="sec final">
        <div className="wrap">
          <div className="box">
            <div>
              <h2>Votre avenir commence par une compétence.</h2>
              <p>Rejoignez l’Académie du Capital Humain et développez les compétences qui vous permettront de construire votre avenir professionnel.</p>
            </div>
            <div className="btns">
              <Link className="btn btn-white" to="/formations">Découvrir nos formations</Link>
              <Link className="btn btn-red" to="/admissions#candidater">Postuler maintenant</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
