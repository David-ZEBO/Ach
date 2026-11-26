import { useState, type FormEvent } from 'react';
import { submitContact, type ContactSubject } from '../lib/api';
import { authMessage } from '../lib/auth';

const SUBJECTS: { v: ContactSubject; l: string }[] = [
  { v: 'course', l: 'Une formation' },
  { v: 'enrollment', l: 'Une inscription ou une candidature' },
  { v: 'organization', l: 'Une formation pour mon organisation' },
  { v: 'other', l: 'Autre demande' },
];

/** Formulaire de contact branché sur la fonction existante submit_contact_message. */
export function ContactForm({ defaultSubject = 'other', defaultMessage = '', submitLabel = 'Envoyer le message' }: { defaultSubject?: ContactSubject; defaultMessage?: string; submitLabel?: string }) {
  const [v, setV] = useState({ name: '', email: '', subject: defaultSubject, message: defaultMessage, ok: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [fail, setFail] = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = 'Indiquez votre nom (2 caractères minimum).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Saisissez une adresse e-mail valide.';
    if (v.message.trim().length < 10) e.message = 'Votre message doit contenir au moins 10 caractères.';
    if (v.message.length > 4000) e.message = 'Votre message ne doit pas dépasser 4 000 caractères.';
    if (!v.ok) e.ok = 'Vous devez accepter le traitement de vos données pour envoyer ce message.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setState('sending');
    try { await submitContact({ name: v.name.trim(), email: v.email.trim(), subject: v.subject, message: v.message.trim() }); setState('sent'); }
    catch (err) { setFail(authMessage(err)); setState('error'); }
  }

  if (state === 'sent') return <p className="alert ok" role="status"><b>Message envoyé.</b> Merci {v.name.split(' ')[0]}, l’Académie vous répondra à l’adresse {v.email}.</p>;

  const f = (k: string) => `field${errors[k] ? ' invalid' : ''}`;
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="row2">
        <div className={f('name')}><label htmlFor="c-name">Nom complet <span className="req">*</span></label><input id="c-name" autoComplete="name" maxLength={120} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-invalid={!!errors.name} />{errors.name && <span className="error">{errors.name}</span>}</div>
        <div className={f('email')}><label htmlFor="c-email">Adresse e-mail <span className="req">*</span></label><input id="c-email" type="email" autoComplete="email" maxLength={254} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} aria-invalid={!!errors.email} />{errors.email && <span className="error">{errors.email}</span>}</div>
      </div>
      <div className="field"><label htmlFor="c-subject">Votre demande concerne</label><select id="c-subject" value={v.subject} onChange={(e) => setV({ ...v, subject: e.target.value as ContactSubject })}>{SUBJECTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
      <div className={f('message')}><label htmlFor="c-msg">Message <span className="req">*</span></label><textarea id="c-msg" maxLength={4000} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} aria-invalid={!!errors.message} /><span className="hint">{v.message.length} / 4 000</span>{errors.message && <span className="error">{errors.message}</span>}</div>
      <label className="check"><input type="checkbox" checked={v.ok} onChange={(e) => setV({ ...v, ok: e.target.checked })} /> <span>J’accepte que l’Académie utilise ces informations pour répondre à ma demande.</span></label>
      {errors.ok && <span className="error" style={{ color: 'var(--red)', fontSize: '.8rem' }}>{errors.ok}</span>}
      {state === 'error' && <p className="alert err" role="alert">{fail}</p>}
      <div><button className="btn btn-red" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi…' : submitLabel}</button></div>
    </form>
  );
}
