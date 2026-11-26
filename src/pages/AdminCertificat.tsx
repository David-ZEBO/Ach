import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useAsync, usePageMeta } from '../lib/hooks';
import {
  DEFAULT_TEMPLATE, downloadCertificate, isAdmin, loadTemplate, renderCertificate, saveTemplate, uploadTemplateImage,
  type CertificateData, type CertificateTemplate,
} from '../lib/certificate';
import { ErrorNote } from '../components/ui';

const SAMPLE: CertificateData = {
  learner_name: 'Prénom Nom', course_title: 'Leadership et performance organisationnelle',
  issued_at: new Date().toISOString(), code: 'ACH-2026-EXEMPLE0', trainer_name: 'Nom du formateur',
};

const TEXT_FIELDS: { k: keyof CertificateTemplate; label: string; hint?: string; max: number }[] = [
  { k: 'title', label: 'Titre', max: 30 },
  { k: 'subtitle', label: 'Sous-titre', max: 40 },
  { k: 'intro', label: 'Texte avant l’intitulé de la formation', hint: 'L’intitulé de la formation s’insère automatiquement après ce texte.', max: 120 },
  { k: 'organizer_prefix', label: 'Liaison', max: 40 },
  { k: 'organizer', label: 'Organisateur (en rouge)', hint: 'Ex. « le Groupe CIDE Solidarité et l’Académie du Capital Humain. »', max: 140 },
  { k: 'place', label: 'Lieu', max: 40 },
  { k: 'trainer_label', label: 'Libellé sous le formateur (signature à gauche)', hint: 'Le nom du formateur vient de chaque formation (champ « Formateur » de sa présentation).', max: 40 },
  { k: 'signatory_name', label: 'Fondateur (signature à droite)', max: 80 },
  { k: 'signatory_title', label: 'Libellé sous le fondateur', max: 60 },
];

const IMAGES: { k: 'partner_logo_url' | 'signature_url' | 'stamp_url'; kind: 'partner' | 'signature' | 'stamp'; label: string; hint: string }[] = [
  { k: 'partner_logo_url', kind: 'partner', label: 'Logo partenaire (facultatif)', hint: 'Affiché à gauche du logo ACH, par exemple CIDE Solidarité.' },
  { k: 'signature_url', kind: 'signature', label: 'Signature du fondateur', hint: 'PNG à fond transparent recommandé.' },
  { k: 'stamp_url', kind: 'stamp', label: 'Cachet', hint: 'Sans cachet, un sceau ACH est dessiné automatiquement.' },
];

/** Administration : modèle des certificats de formation (les diplômes ne sont pas concernés). */
export default function AdminCertificat() {
  usePageMeta('Modèle de certificat');
  const { session, ready } = useAuth();
  const admin = useAsync(() => (session ? isAdmin(session.user.id) : Promise.resolve(false)), [session?.user.id]);
  const stored = useAsync(loadTemplate, []);
  const [t, setT] = useState<CertificateTemplate>(DEFAULT_TEMPLATE);
  const [saved, setSaved] = useState<CertificateTemplate>(DEFAULT_TEMPLATE);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => { if (stored.data) { setT(stored.data); setSaved(stored.data); } }, [stored.data]);
  // Aperçu en direct (léger différé pendant la saisie).
  useEffect(() => {
    const id = setTimeout(() => { if (canvas.current) renderCertificate(canvas.current, t, SAMPLE).catch(() => undefined); }, 250);
    return () => clearTimeout(id);
  }, [t]);

  if (!ready || admin.loading) return null;
  if (!session) return <Navigate to="/connexion?retour=/admin/certificat" replace />;
  if (!admin.data) return <div className="wrap sec"><p className="alert err">Cette page est réservée aux administrateurs de l’Académie.</p></div>;

  const dirty = JSON.stringify(t) !== JSON.stringify(saved);
  const set = <K extends keyof CertificateTemplate>(k: K, v: CertificateTemplate[K]) => setT((x) => ({ ...x, [k]: v }));

  async function upload(k: (typeof IMAGES)[number]['k'], kind: (typeof IMAGES)[number]['kind'], file?: File | null) {
    if (!file) return;
    setBusy(k); setMsg(null);
    try { set(k, await uploadTemplateImage(kind, file)); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  }
  async function save() {
    setBusy('save'); setMsg(null);
    try { await saveTemplate(t, session!.user.id); setSaved(t); setMsg({ ok: true, text: 'Modèle enregistré. Il s’applique à tous les certificats de formation téléchargés à partir de maintenant.' }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); }
  }

  return (
    <section className="sec soft">
      <div className="wrap wide">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Administration</span>
            <h1 className="h2">Modèle de certificat de formation</h1>
            <p className="lede">Ce modèle s’applique aux certificats des formations. Les diplômes des programmes universitaires gardent leur propre modèle.</p>
          </div>
          <Link className="btn btn-outline btn-sm" to="/mon-compte">← Mon compte</Link>
        </div>
        {stored.error && <ErrorNote error={stored.error} />}

        <div className="cert-admin">
          <div className="acc-card form">
            <h2>Textes</h2>
            {TEXT_FIELDS.map((f) => (
              <div key={f.k} className="field">
                <label htmlFor={`t-${f.k}`}>{f.label}</label>
                <input id={`t-${f.k}`} maxLength={f.max} value={t[f.k] as string} onChange={(e) => set(f.k, e.target.value as never)} />
                {f.hint && <span className="hint">{f.hint}</span>}
              </div>
            ))}
            <h2 style={{ marginTop: 10 }}>Images</h2>
            {IMAGES.map((im) => (
              <div key={im.k} className="field">
                <label htmlFor={`i-${im.k}`}>{im.label}</label>
                <div className="img-row">
                  {t[im.k] ? <img src={t[im.k]} alt="" /> : <span className="img-empty">Aucune</span>}
                  <input id={`i-${im.k}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(im.k, im.kind, e.target.files?.[0])} disabled={busy === im.k} />
                  {t[im.k] && <button type="button" className="linkbtn" onClick={() => set(im.k, '')}>Retirer</button>}
                </div>
                <span className="hint">{busy === im.k ? 'Envoi…' : im.hint}</span>
              </div>
            ))}
            <label className="check"><input type="checkbox" checked={t.show_qr} onChange={(e) => set('show_qr', e.target.checked)} /> <span>Afficher le QR code de vérification</span></label>
            {msg && <p className={`alert ${msg.ok ? 'ok' : 'err'}`} role="status">{msg.text}</p>}
            <div className="btns">
              <button className="btn btn-red" onClick={save} disabled={!dirty || busy === 'save'}>{busy === 'save' ? 'Enregistrement…' : dirty ? 'Enregistrer le modèle' : 'Modèle enregistré'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setT(saved)} disabled={!dirty}>Annuler</button>
              <button type="button" className="linkbtn" onClick={() => setT({ ...DEFAULT_TEMPLATE })}>Revenir au modèle par défaut</button>
            </div>
          </div>

          <div className="cert-preview">
            <div className="acc-card">
              <h2>Aperçu</h2>
              <canvas ref={canvas} className="cert-canvas" aria-label="Aperçu du certificat" />
              <p className="hint" style={{ marginTop: 10 }}>Exemple avec un apprenant fictif. Le nom, l’intitulé de la formation, la date et le code sont remplis automatiquement.</p>
              <button type="button" className="btn btn-navy btn-sm" style={{ marginTop: 12 }} onClick={() => downloadCertificate(SAMPLE, t)}>Télécharger l’aperçu en PDF</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
