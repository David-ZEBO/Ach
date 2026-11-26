import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listCategories, searchCourses, type Level } from '../lib/api';
import { LEVEL_LABEL } from '../lib/format';
import { useAsync, usePageMeta } from '../lib/hooks';
import { CardSkeletons, CourseCard, Empty, ErrorNote, PageHero } from '../components/ui';

export default function Formations() {
  usePageMeta('Formations', 'Formations de l’Académie du Capital Humain : leadership, gestion de projets, entrepreneuriat, marketing, finance, ressources humaines et développement professionnel.');
  const [params, setParams] = useSearchParams();
  const category = params.get('categorie') ?? '';
  const level = (params.get('niveau') ?? '') as Level | '';
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [debounced, setDebounced] = useState(query);

  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim()), 300); return () => clearTimeout(t); }, [query]);
  useEffect(() => { set('q', debounced); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debounced]);

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  const cats = useAsync(listCategories, []);
  const courses = useAsync(() => searchCourses({ query: debounced, category: category || undefined, level: level || undefined }), [debounced, category, level]);
  const catName = (slug: string | null) => cats.data?.find((c) => c.slug === slug)?.name;
  const n = courses.data?.length ?? 0;

  return (
    <>
      <PageHero title="Nos formations" intro="Des formations courtes et pratiques, ouvertes à tous, pour développer vos compétences professionnelles. Vous visez un diplôme ? Consultez nos programmes universitaires." image="/images/photos/stn-large.jpg" crumbs={[{ label: 'Formations' }]} />
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="filters two" role="search">
            <div className="field"><label htmlFor="q">Rechercher une formation</label><input id="q" type="search" placeholder="Ex. leadership, projet, marketing, FBP…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <div className="field"><label htmlFor="niveau">Niveau</label>
              <select id="niveau" value={level} onChange={(e) => set('niveau', e.target.value)}>
                <option value="">Tous les niveaux</option>
                {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
              </select>
            </div>
          </div>

          <div className="chips" role="group" aria-label="Filtrer par domaine">
            <button className="chip" aria-pressed={!category} onClick={() => set('categorie', '')}>Tous les domaines</button>
            {(cats.data ?? []).map((c) => <button key={c.slug} className="chip" aria-pressed={category === c.slug} onClick={() => set('categorie', c.slug)}>{c.name}</button>)}
          </div>

          {courses.loading ? <CardSkeletons n={6} /> : courses.error ? <ErrorNote error={courses.error} /> : n === 0 ? (
            <Empty title="Aucune formation ne correspond à votre recherche.">Essayez un autre mot-clé ou retirez un filtre.</Empty>
          ) : (
            <>
              <p className="count" aria-live="polite">{n} formation{n > 1 ? 's' : ''}</p>
              <div className="grid-cards">{courses.data!.map((c) => <CourseCard key={c.id} c={c} categoryName={catName(c.category_slug)} />)}</div>
            </>
          )}
          <p className="count" style={{ marginTop: 32 }}>Vous visez un diplôme complet ? <Link to="/universite" style={{ color: 'var(--red)', fontWeight: 700 }}>Voir les programmes universitaires →</Link></p>
        </div>
      </section>
    </>
  );
}
