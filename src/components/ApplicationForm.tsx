import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { acceptsApplications, listProgrammes, submitApplication, type EducationLevel } from '../lib/api';
import { PROGRAMME_LEVEL, PROGRAMME_STATUS } from '../lib/format';
import { authMessage, useAuth } from '../lib/auth';
import { useAsync } from '../lib/hooks';
import { ErrorNote } from './ui';

const EDU: { v: EducationLevel; l: string }[] = [
  { v: 'secondary', l: 'Études secondaires' }, { v: 'bac', l: 'Diplôme d’État / Baccalauréat' }, { v: 'bachelor', l: 'Licence / Graduat' },
  { v: 'master', l: 'Master' }, { v: 'doctorate', l: 'Doctorat' }, { v: 'other', l: 'Autre' },
];
const STEPS = ['Programme', 'Vos coordonnées', 'Votre parcours', 'Vérification'];

/**
 * Candidature à un programme. Écrit dans programme_applications avec les mêmes colonnes et
 * les mêmes règles qu'auparavant (RLS : apprenant connecté, programme ouvert aux candidatures).
 */
export function ApplicationForm() {
  const { session, ready } = useAuth();
  const programmes = useAsync(listProgrammes, []);
  // Même règle que la base : un programme publié accepte les candidatures tant qu'il n'est pas fermé.
  const open = useMemo(() => (programmes.data ?? []).filter(acceptsApplications), [programmes.data]);
  const [params] = useSearchParams();
  const wanted = params.get('programme');
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ programme_id: '', first_name: '', last_name: '', phone: '', country: 'République démocratique du Congo', city: 'Kinshasa', education_level: '' as EducationLevel | '', motivation: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [fail, setFail] = useState('');
  useEffect(() => {
    const p = open.find((x) => x.slug === wanted);
    if (p) setV((s) => (s.programme_id ? s : { ...s, programme_id: p.id }));
  }, [open, wanted]);

  if (!ready) return null;
  if (!session) {
    return (
      <div className="form-card">
        <h2>Déposer une candidature</h2>
        <p>Pour suivre votre dossier en ligne, la candidature se fait depuis votre compte apprenant. La création du compte est gratuite.</p>
        <div className="btns"><Link className="btn btn-red" to="/connexion?mode=inscription&retour=/admissions%23candidater">Créer mon compte</Link><Link className="btn btn-outline" to="/connexion?retour=/admissions%23candidater">J’ai déjà un compte</Link></div>
      </div>
    );
  }
  if (programmes.error) return <ErrorNote error={programmes.error} />;
  if (state === 'sent') {
    return <div className="form-card"><p className="alert ok" role="status"><b>Candidature envoyée.</b> Vous recevrez une notification à chaque étape. Vous pouvez suivre votre dossier depuis votre espace.</p><div className="btns" style={{ marginTop: 18 }}><Link className="btn btn-navy" to="/mon-compte">Suivre mon dossier</Link></div></div>;
  }

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  function check(s: number) {
    const e: Record<string, string> = {};
    if (s === 0 && !v.programme_id) e.programme_id = 'Choisissez un programme.';
    if (s === 1) {
      if (!v.first_name.trim()) e.first_name = 'Indiquez votre prénom.';
      if (!v.last_name.trim()) e.last_name = 'Indiquez votre nom.';
      if (v.phone.replace(/\D/g, '').length < 6) e.phone = 'Indiquez un numéro de téléphone valide.';
      if (v.country.trim().length < 2) e.country = 'Indiquez votre pays.';
    }
    if (s === 2) {
      if (!v.education_level) e.education_level = 'Choisissez votre niveau d’études.';
      if (v.motivation.length > 3000) e.motivation = '3 000 caractères maximum.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) { if (check(step)) setStep(step + 1); return; }
    setState('sending');
    try {
      await submitApplication({ ...v, education_level: v.education_level as EducationLevel, first_name: v.first_name.trim(), last_name: v.last_name.trim(), phone: v.phone.trim(), country: v.country.trim(), city: v.city.trim(), motivation: v.motivation.trim() });
      setState('sent');
    } catch (err) { setFail(authMessage(err)); setState('error'); }
  }
  const f = (k: string) => `field${errors[k] ? ' invalid' : ''}`;
  const err = (k: string) => errors[k] && <span className="error">{errors[k]}</span>;
  const prog = open.find((p) => p.id === v.programme_id);

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2>Déposer une candidature</h2>
      <ol className="chips" style={{ margin: '6px 0 22px', listStyle: 'none', padding: 0 }} aria-label="Étapes">
        {STEPS.map((s, i) => <li key={s} className="chip" aria-current={i === step ? 'step' : undefined} style={i === step ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : i < step ? { borderColor: 'var(--red)', color: 'var(--red)' } : undefined}>{i + 1}. {s}</li>)}
      </ol>
      <div className="form">
        {step === 0 && (
          <>
            <div className={f('programme_id')}>
              <label htmlFor="a-prog">Programme <span className="req">*</span></label>
              <select id="a-prog" value={v.programme_id} onChange={set('programme_id')}>
                <option value="">{open.length ? 'Choisir un programme…' : 'Aucun programme n’accepte de candidatures actuellement'}</option>
                {[...new Set(open.map((p) => p.faculty))].map((fac) => (
                  <optgroup key={fac} label={fac}>
                    {open.filter((p) => p.faculty === fac).map((p) => <option key={p.id} value={p.id}>{p.name}{p.is_demo ? ' (démonstration)' : ''}</option>)}
                  </optgroup>
                ))}
              </select>
              {err('programme_id')}
            </div>
            {(() => { const p = open.find((x) => x.id === v.programme_id); return p && (
              <p className="hint" style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
                {PROGRAMME_LEVEL[p.level]} · {p.faculty} · <span className={`status ${PROGRAMME_STATUS[p.status].tone}`}>{PROGRAMME_STATUS[p.status].label}</span>
                {p.status === 'planned' && <> Votre candidature sera étudiée à l’ouverture du programme.</>}
              </p>); })()}
            <p className="hint" style={{ fontSize: '.86rem' }}>Vous cherchez une formation courte ? <Link to="/formations">L’inscription se fait directement sur sa fiche.</Link></p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="row2">
              <div className={f('first_name')}><label htmlFor="a-fn">Prénom <span className="req">*</span></label><input id="a-fn" autoComplete="given-name" maxLength={80} value={v.first_name} onChange={set('first_name')} />{err('first_name')}</div>
              <div className={f('last_name')}><label htmlFor="a-ln">Nom <span className="req">*</span></label><input id="a-ln" autoComplete="family-name" maxLength={80} value={v.last_name} onChange={set('last_name')} />{err('last_name')}</div>
            </div>
            <div className={f('phone')}><label htmlFor="a-ph">Téléphone (WhatsApp) <span className="req">*</span></label><input id="a-ph" type="tel" autoComplete="tel" maxLength={30} placeholder="+243 …" value={v.phone} onChange={set('phone')} />{err('phone')}</div>
            <div className="row2">
              <div className={f('country')}><label htmlFor="a-co">Pays <span className="req">*</span></label><input id="a-co" autoComplete="country-name" maxLength={80} value={v.country} onChange={set('country')} />{err('country')}</div>
              <div className="field"><label htmlFor="a-ci">Ville</label><input id="a-ci" autoComplete="address-level2" maxLength={80} value={v.city} onChange={set('city')} /></div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className={f('education_level')}><label htmlFor="a-ed">Niveau d’études <span className="req">*</span></label><select id="a-ed" value={v.education_level} onChange={set('education_level')}><option value="">Choisir…</option>{EDU.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select>{err('education_level')}</div>
            <div className={f('motivation')}><label htmlFor="a-mo">Motivation</label><textarea id="a-mo" maxLength={3000} value={v.motivation} onChange={set('motivation')} placeholder="Pourquoi souhaitez-vous suivre ce programme ?" /><span className="hint">{v.motivation.length} / 3 000</span>{err('motivation')}</div>
          </>
        )}
        {step === 3 && (
          <dl className="aside" style={{ position: 'static', boxShadow: 'none', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 16px', margin: 0 }}>
            <dt>Programme</dt><dd>{prog?.name}</dd>
            <dt>Nom</dt><dd>{v.first_name} {v.last_name}</dd>
            <dt>Téléphone</dt><dd>{v.phone}</dd>
            <dt>Lieu</dt><dd>{[v.city, v.country].filter(Boolean).join(', ')}</dd>
            <dt>Niveau</dt><dd>{EDU.find((x) => x.v === v.education_level)?.l}</dd>
          </dl>
        )}
        {state === 'error' && <p className="alert err" role="alert">{fail}</p>}
        <div className="btns" style={{ justifyContent: 'space-between' }}>
          {step > 0 ? <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>Retour</button> : <span />}
          <button className="btn btn-red" type="submit" disabled={state === 'sending' || (step === 0 && open.length === 0)}>{step < 3 ? 'Continuer' : state === 'sending' ? 'Envoi…' : 'Soumettre ma candidature'}</button>
        </div>
      </div>
    </form>
  );
}
