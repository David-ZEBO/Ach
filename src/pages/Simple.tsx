import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { verifyCode } from '../lib/api';
import { useAsync, usePageMeta } from '../lib/hooks';
import { Icon } from '../components/Icon';
import { Cta, Empty, ErrorNote, PageHero, SectionHead } from '../components/ui';

type Resource = { id: string; title: string; description: string; author: string; year: number | null; file_type: string; external_url: string | null };

export function Recherche() {
  usePageMeta('Recherche et innovation', 'Recherche appliquée, publications, études et partenariats scientifiques de l’Académie du Capital Humain.');
  const res = useAsync(async () => {
    const { data, error } = await supabase.from('resources').select('id, title, description, author, year, file_type, external_url').eq('visibility', 'public').order('created_at', { ascending: false }).limit(12);
    if (error) throw error;
    return (data ?? []) as Resource[];
  }, []);
  return (
    <>
      <PageHero title="Recherche et innovation" intro="Produire, partager et appliquer les savoirs au service du développement du capital humain." image="/images/photos/b1.jpg" crumbs={[{ label: 'Recherche et innovation' }]} />
      <section className="sec">
        <div className="wrap">
          <SectionHead eyebrow="Nos axes" title="Recherche appliquée et partenariats" lede="La recherche appliquée et les partenariats en formation, ressources humaines, leadership, entrepreneuriat et développement organisationnel font partie de l’objet de l’Académie." />
          <div className="research">
            {[['flask', 'Recherche appliquée', 'Des études qui répondent aux besoins concrets des organisations et des communautés.'], ['book', 'Publications et études', 'Conception et diffusion de ressources pédagogiques, d’outils et de publications.'], ['handshake', 'Partenariats scientifiques', 'Des collaborations avec des institutions et des professionnels.']].map(([i, t, d]) => (
              <div key={t}><div className="ic"><Icon name={i as 'flask'} size={28} /></div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="sec soft">
        <div className="wrap">
          <SectionHead eyebrow="Publications" title="Publications et ressources" />
          {res.error ? <ErrorNote error={res.error} /> : res.loading ? <div className="skeleton" style={{ minHeight: 160 }} /> : res.data!.length === 0 ? (
            <Empty title="Les premières publications seront mises en ligne prochainement.">Articles, études et travaux de l’Académie apparaîtront ici.</Empty>
          ) : (
            <div className="values">{res.data!.map((r) => (
              <div key={r.id}><span className="tag-demo">{r.file_type}</span><h3 style={{ marginTop: 10 }}>{r.title}</h3><p>{[r.author, r.year].filter(Boolean).join(', ')}</p>{r.description && <p style={{ marginTop: 6 }}>{r.description}</p>}{r.external_url && <p style={{ marginTop: 10 }}><a href={r.external_url} target="_blank" rel="noreferrer">Consulter</a></p>}</div>
            ))}</div>
          )}
          <div style={{ marginTop: 32 }}><Cta to="/contact?sujet=other">Proposer un partenariat scientifique</Cta></div>
        </div>
      </section>
    </>
  );
}

export function Verifier() {
  usePageMeta('Vérifier un certificat', 'Vérifier l’authenticité d’un certificat ou d’un diplôme délivré par l’Académie du Capital Humain.');
  const params = useParams();
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'none' | 'err'; data?: Record<string, unknown>; msg?: string }>({ kind: 'idle' });
  useEffect(() => { if (params.code) run(params.code.toUpperCase()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params.code]);
  async function onSubmit(e: FormEvent) { e.preventDefault(); run(code); }
  async function run(code: string) {
    if (!/^ACH-(DIP-)?[0-9]{4}-[A-Z0-9]{8}$/i.test(code.trim())) { setState({ kind: 'err', msg: 'Le code doit avoir la forme ACH-AAAA-XXXXXXXX (certificat) ou ACH-DIP-AAAA-XXXXXXXX (diplôme).' }); return; }
    setState({ kind: 'busy' });
    try { const d = await verifyCode(code); setState(d && Object.keys(d).length ? { kind: 'ok', data: d } : { kind: 'none' }); }
    catch (err) { setState({ kind: 'err', msg: (err as Error).message }); }
  }
  return (
    <>
      <PageHero title="Vérifier un certificat" intro="Chaque document délivré par l’Académie porte un code unique." image="/images/photos/hero.jpg" crumbs={[{ label: 'Vérifier un certificat' }]} />
      <section className="sec">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <form className="form-card form" onSubmit={onSubmit} noValidate>
            <div className="field"><label htmlFor="v-code">Code du document</label><input id="v-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ACH-2026-XXXXXXXX" autoComplete="off" spellCheck={false} /></div>
            <div><button className="btn btn-red" disabled={state.kind === 'busy'}>{state.kind === 'busy' ? 'Vérification…' : 'Vérifier'}</button></div>
            {state.kind === 'err' && <p className="alert err" role="alert">{state.msg}</p>}
            {state.kind === 'none' && <p className="alert err" role="status">Aucun document ne correspond à ce code.</p>}
            {state.kind === 'ok' && state.data && (
              <div className="alert ok" role="status"><b>Document trouvé.</b>
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', margin: '10px 0 0' }}>
                  {Object.entries(state.data).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([k, v]) => <Fragment key={k}><dt style={{ fontWeight: 600 }}>{k.replace(/_/g, ' ')}</dt><dd style={{ margin: 0 }}>{String(v)}</dd></Fragment>)}
                </dl>
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

export function Legal({ kind }: { kind: 'mentions' | 'confidentialite' }) {
  const t = kind === 'mentions' ? 'Mentions légales' : 'Politique de confidentialité';
  usePageMeta(t);
  return (
    <>
      <PageHero title={t} image="/images/photos/b1.jpg" crumbs={[{ label: t }]} />
      <section className="sec"><div className="wrap prose">
        {kind === 'mentions' ? (
          <>
            <p><b>Éditeur :</b> Académie du Capital Humain (ACH), établissement d’utilité publique à caractère scientifique, d’enseignement supérieur et de formation.</p>
            <p><b>Siège :</b> 287, Basankusu, Lingwala, Kinshasa, République démocratique du Congo.</p>
            <p>Le texte complet des mentions légales sera publié après validation par l’Académie.</p>
          </>
        ) : (
          <>
            <p>Les informations transmises par les formulaires du site (contact, candidature, compte apprenant) sont utilisées uniquement par l’Académie du Capital Humain pour traiter votre demande et suivre votre parcours.</p>
            <p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à l’Académie depuis la page <Link to="/contact">Contact</Link>.</p>
            <p>La politique complète sera publiée après validation par l’Académie.</p>
          </>
        )}
      </div></section>
    </>
  );
}

export function NotFound() {
  usePageMeta('Page introuvable');
  return <section className="sec"><div className="wrap"><Empty title="Cette page n’existe pas ou a été déplacée."><p style={{ marginTop: 14 }}><Link className="btn btn-navy" to="/">Retour à l’accueil</Link></p></Empty></div></section>;
}
