import { Link, useSearchParams } from 'react-router-dom';
import { listFaculties, type Programme, type ProgrammeLevel } from '../lib/api';
import { formatMonths, PROGRAMME_LEVEL, PROGRAMME_STATUS } from '../lib/format';
import { useAsync, usePageMeta } from '../lib/hooks';
import { facultyImage } from '../lib/images';
import { Icon } from '../components/Icon';
import { Empty, ErrorNote, PageHero, SectionHead } from '../components/ui';

export function ProgrammeCard({ p }: { p: Programme }) {
  const st = PROGRAMME_STATUS[p.status];
  return (
    <Link className="pcard" to={`/universite/${p.slug}`}>
      <div className="pcard-top">
        <span className="lvl">{PROGRAMME_LEVEL[p.level]}</span>
        <span className={`status ${st.tone}`}>{st.label}</span>
      </div>
      <h3>{p.name}</h3>
      {p.summary && <p>{p.summary}</p>}
      <div className="meta">
        <span><Icon name="clock" size={15} />{formatMonths(p.duration_months)}</span>
        <span><Icon name="laptop" size={15} />En ligne</span>
        {p.is_demo && <span className="tag-demo">Démonstration</span>}
      </div>
      <span className="more">Voir le programme →</span>
    </Link>
  );
}

const LEVELS: ProgrammeLevel[] = ['certificate', 'bachelor', 'master', 'doctorate'];

export default function Universite() {
  usePageMeta('Programmes universitaires', 'Licences, masters et certificats universitaires de l’Académie du Capital Humain, organisés en facultés, semestres et crédits.');
  const [params, setParams] = useSearchParams();
  const level = params.get('niveau') ?? '';
  const fac = useAsync(listFaculties, []);
  const present = new Set((fac.data ?? []).flatMap((f) => f.programmes.map((p) => p.level)));
  const setLevel = (l: string) => { const n = new URLSearchParams(params); if (l) n.set('niveau', l); else n.delete('niveau'); setParams(n, { replace: true }); };

  return (
    <>
      <PageHero title="Programmes universitaires" intro="Des parcours complets organisés en facultés, semestres et crédits, avec admission sur candidature." image="/images/photos/hero.jpg" crumbs={[{ label: 'Programmes universitaires' }]} />

      <section className="sec">
        <div className="wrap">
          <div className="two-ways">
            <div className="way uni">
              <span className="eyebrow" style={{ color: '#FF8A8F' }}>Vous êtes ici</span>
              <h2>Programmes universitaires</h2>
              <p>Licences, masters et certificats universitaires. Chaque programme est composé d’unités d’enseignement réparties par semestre, avec des crédits. L’admission se fait sur candidature.</p>
            </div>
            <div className="way">
              <span className="eyebrow">L’autre voie</span>
              <h2>Formations</h2>
              <p>Des formations courtes et ciblées pour développer une compétence précise, avec une inscription directe.</p>
              <Link className="btn btn-outline btn-sm" to="/formations">Voir les formations</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sec soft" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <div className="chips" role="group" aria-label="Filtrer par niveau" style={{ marginTop: 0 }}>
            <button className="chip" aria-pressed={!level} onClick={() => setLevel('')}>Tous les niveaux</button>
            {LEVELS.filter((l) => present.has(l)).map((l) => <button key={l} className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>{PROGRAMME_LEVEL[l]}</button>)}
          </div>

          {fac.error ? <ErrorNote error={fac.error} /> : fac.loading ? <div className="skeleton" /> : (
            <div className="faculties">
              {fac.data!.map((f) => {
                const progs = f.programmes.filter((p) => !level || p.level === level);
                if (level && progs.length === 0) return null;
                return (
                  <section key={f.id} className="faculty anchor" id={f.slug} aria-labelledby={`f-${f.slug}`}>
                    <div className="faculty-head">
                      <img src={facultyImage(f.image_path)} alt="" loading="lazy" />
                      <div>
                        <span className="eyebrow">Faculté</span>
                        <h2 id={`f-${f.slug}`}>{f.name}</h2>
                        {f.tagline && <p className="tag">{f.tagline}</p>}
                        {f.is_provisional && <p className="prov">Faculté en cours de mise en place : son offre peut encore évoluer.</p>}
                      </div>
                    </div>
                    {progs.length === 0 ? <Empty title="Aucun programme publié pour cette faculté." /> : <div className="pgrid">{progs.map((p) => <ProgrammeCard key={p.id} p={p} />)}</div>}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Admission" title="Comment intégrer un programme ?" lede="Choisissez votre programme, déposez votre candidature en ligne, puis suivez votre dossier jusqu’à la décision d’admission." action={<Link className="btn btn-red" to="/admissions#candidater">Déposer ma candidature</Link>} />
        </div>
      </section>
    </>
  );
}
