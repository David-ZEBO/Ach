/**
 * Modèle de certificat de FORMATION (les diplômes gardent leur générateur serveur « certificate-pdf »).
 *
 * Le modèle est enregistré dans site_settings, clé « certificate.template » (lecture publique,
 * écriture réservée aux administrateurs par les règles RLS existantes). Les images (logo partenaire,
 * signature, cachet) sont déposées dans le bucket public « site-assets », lui aussi réservé aux admins.
 * Le PDF est dessiné dans le navigateur (canvas A4 paysage 300 dpi) puis exporté avec jsPDF.
 */
import qrcode from 'qrcode-generator';
import { supabase } from './supabase';

export interface CertificateTemplate {
  title: string;
  subtitle: string;
  intro: string;
  organizer_prefix: string;
  organizer: string;
  place: string;
  signatory_name: string;   // fondateur, signature à droite
  signatory_title: string;
  trainer_label: string;    // libellé sous le nom du formateur, signature à gauche
  partner_logo_url: string;
  signature_url: string;
  stamp_url: string;
  show_qr: boolean;
}

export const DEFAULT_TEMPLATE: CertificateTemplate = {
  title: 'CERTIFICAT',
  subtitle: 'DE FORMATION',
  intro: 'a participé avec succès à la formation',
  organizer_prefix: 'organisée par',
  organizer: 'l’Académie du Capital Humain.',
  place: 'Kinshasa',
  signatory_name: 'Dr Michel Muvudi, MPH, MBA, PhDc',
  signatory_title: 'Fondateur',
  trainer_label: 'Formateur',
  partner_logo_url: '',
  signature_url: '',
  stamp_url: '',
  show_qr: true,
};

const KEY = 'certificate.template';

export async function loadTemplate(): Promise<CertificateTemplate> {
  const { data } = await supabase.from('site_settings').select('value').eq('key', KEY).maybeSingle();
  return { ...DEFAULT_TEMPLATE, ...((data?.value as Partial<CertificateTemplate>) ?? {}) };
}

export async function saveTemplate(t: CertificateTemplate, userId: string) {
  const { error } = await supabase.from('site_settings').upsert({ key: KEY, value: t, is_public: true, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Dépose une image du modèle dans site-assets et renvoie son URL publique. */
export async function uploadTemplateImage(kind: 'partner' | 'signature' | 'stamp', file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Formats acceptés : PNG, JPEG ou WebP.');
  if (file.size > 3 * 1024 * 1024) throw new Error('L’image ne doit pas dépasser 3 Mo.');
  const path = `certificates/${kind}-${Date.now()}.${file.type.split('/')[1].replace('jpeg', 'jpg')}`;
  const { error } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl;
}

export interface CertificateData { learner_name: string; course_title: string; issued_at: string; code: string; course_id?: string; trainer_name?: string }

/** Nom du formateur affiché sur le certificat : champ « instructor_name » de la formation. */
export async function trainerName(courseId?: string): Promise<string> {
  if (!courseId) return '';
  const { data } = await supabase.from('courses').select('instructor_name').eq('id', courseId).maybeSingle();
  return (data?.instructor_name as string | null)?.trim() ?? '';
}

/* ---------------------------------------------------------------- Dessin */
const NAVY = '#0B1B4D', NAVY2 = '#16307A', RED = '#E1141E', TINT = '#DCE3F3', PALE = '#EEF2FA', PINK = '#FBE3E4', MUTED = '#4A5372';
const W = 3508, H = 2480, S = W / 2000; // coordonnées de travail : 2000 × 1414

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts() {
  if (!document.fonts) return;
  await Promise.all([
    '700 100px "Cormorant Garamond"', '600 100px "Cormorant Garamond"',
    '400 40px Montserrat', '500 40px Montserrat', '700 40px Montserrat',
  ].map((f) => document.fonts.load(f).catch(() => undefined)));
}

type Seg = { text: string; font: string; color: string };

/** Paragraphe centré à plusieurs styles, avec retour à la ligne automatique. */
function richText(ctx: CanvasRenderingContext2D, segs: Seg[], cx: number, y: number, maxW: number, lh: number) {
  const words: Seg[] = segs.flatMap((s) => s.text.split(/(\s+)/).filter(Boolean).map((w) => ({ ...s, text: w })));
  const lines: Seg[][] = [[]];
  let lineW = 0;
  for (const w of words) {
    ctx.font = w.font;
    const ww = ctx.measureText(w.text).width;
    if (lineW + ww > maxW && lines[lines.length - 1].length && !/^\s+$/.test(w.text)) { lines.push([]); lineW = 0; }
    if (!lines[lines.length - 1].length && /^\s+$/.test(w.text)) continue;
    lines[lines.length - 1].push(w); lineW += ww;
  }
  lines.forEach((line, i) => {
    while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
    const width = line.reduce((n, w) => { ctx.font = w.font; return n + ctx.measureText(w.text).width; }, 0);
    let x = cx - width / 2;
    for (const w of line) { ctx.font = w.font; ctx.fillStyle = w.color; ctx.textAlign = 'left'; ctx.fillText(w.text, x, y + i * lh); x += ctx.measureText(w.text).width; }
  });
}

function seal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.globalAlpha = 0.55; ctx.strokeStyle = NAVY2; ctx.fillStyle = NAVY2;
  ctx.lineWidth = 3 * S; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5 * S; ctx.beginPath(); ctx.arc(0, 0, r - 10 * S, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2); ctx.stroke();
  const text = 'ACADÉMIE DU CAPITAL HUMAIN • KINSHASA • ';
  ctx.font = `600 ${17 * S}px Montserrat`; ctx.textAlign = 'center';
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    ctx.save(); ctx.rotate(i * step); ctx.translate(0, -(r - 30 * S)); ctx.fillText(text[i], 0, 0); ctx.restore();
  }
  ctx.font = `700 ${40 * S}px "Cormorant Garamond"`; ctx.fillText('ACH', 0, 14 * S);
  ctx.restore();
}

function drawQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), cell = size / n;
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 6 * S, y - 6 * S, size + 12 * S, size + 12 * S);
  ctx.fillStyle = NAVY;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
}

export function verifyUrl(code: string) { return `${location.origin}/certificates/verify/${code}`; }

export async function renderCertificate(canvas: HTMLCanvasElement, t: CertificateTemplate, d: CertificateData) {
  await ensureFonts();
  const [logo, partner, signature, stamp] = await Promise.all([loadImage('/images/logo-ach.jpg'), loadImage(t.partner_logo_url), loadImage(t.signature_url), loadImage(t.stamp_url)]);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const R = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S); };
  const V = (x: number, y1: number, y2: number, c: string, w = 2) => { ctx.strokeStyle = c; ctx.lineWidth = w * S; ctx.beginPath(); ctx.moveTo(x * S, y1 * S); ctx.lineTo(x * S, y2 * S); ctx.stroke(); };

  // Fond et trame géométrique discrète
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#F1F4FA'; ctx.lineWidth = 2 * S;
  for (let i = -1414; i < 2000; i += 260) { ctx.beginPath(); ctx.moveTo(i * S, 0); ctx.lineTo((i + 1414 * 0.85) * S, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo((i + 1414 * 0.85) * S, 0); ctx.lineTo(i * S, H); ctx.stroke(); }

  // Bande décorative gauche (aux couleurs ACH)
  R(28, 435, 93, 114, PALE); R(28, 1047, 68, 78, PALE); R(89, 1200, 52, 52, PALE);
  R(89, 153, 52, 52, RED); R(180, 117, 127, 142, NAVY2); R(180, 273, 127, 140, TINT);
  R(158, 583, 126, 120, NAVY); R(28, 703, 132, 156, RED); R(98, 874, 104, 111, NAVY2);
  R(180, 999, 127, 142, NAVY); R(180, 1156, 127, 141, TINT);
  V(158, 0, 1414, NAVY2, 2); V(135, 220, 687, RED, 1.5); V(243, 0, 103, RED, 1.5); V(237, 713, 985, RED, 1.5); V(117, 999, 1185, RED, 1.5); V(243, 1310, 1414, RED, 1.5); V(189, 424, 575, NAVY2, 1.5);
  // Accents droite
  R(1801, 27, 90, 96, TINT); R(1909, 27, 91, 96, PINK); R(1701, 143, 192, 119, PALE); R(1938, 320, 62, 68, PALE);
  V(1914, 147, 325, RED, 1.5); R(1926, 1233, 74, 96, RED); R(1832, 1338, 88, 76, NAVY);

  // Logos
  const drawFit = (img: HTMLImageElement, cx: number, top: number, maxW: number, maxH: number) => {
    const k = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * k, h = img.height * k;
    ctx.drawImage(img, (cx - w / 2) * S, top * S, w * S, h * S);
  };
  if (partner && logo) { drawFit(partner, 900, 92, 200, 150); drawFit(logo, 1225, 92, 360, 150); ctx.fillStyle = TINT; ctx.fillRect(1022 * S, 100 * S, 2 * S, 135 * S); }
  else if (logo) drawFit(logo, 1100, 88, 400, 160);

  // Titre
  ctx.textAlign = 'center'; ctx.fillStyle = NAVY;
  ctx.font = `700 ${178 * S}px "Cormorant Garamond"`; ctx.fillText(t.title, 1100 * S, 548 * S);
  ctx.font = `600 ${62 * S}px "Cormorant Garamond"`; ctx.fillText(t.subtitle, 1100 * S, 630 * S);

  // Nom (réduit automatiquement s'il est long)
  let size = 104;
  ctx.font = `500 ${size * S}px Montserrat`;
  while (ctx.measureText(d.learner_name.toUpperCase()).width > 1420 * S && size > 50) { size -= 4; ctx.font = `500 ${size * S}px Montserrat`; }
  ctx.fillStyle = NAVY; ctx.fillText(d.learner_name.toUpperCase(), 1100 * S, 838 * S);
  ctx.fillStyle = RED; ctx.fillRect(391 * S, 880 * S, 1435 * S, 3 * S);

  // Phrase de réussite
  richText(ctx, [
    { text: `${t.intro} `, font: `500 ${35 * S}px Montserrat`, color: NAVY },
    { text: `${d.course_title.replace(/[.\s]+$/, '')}, `, font: `700 ${35 * S}px Montserrat`, color: NAVY },
    { text: `${t.organizer_prefix} `, font: `500 ${35 * S}px Montserrat`, color: NAVY },
    { text: t.organizer, font: `700 ${35 * S}px Montserrat`, color: RED },
  ], 1100 * S, 958 * S, 1480 * S, 48 * S);

  // Lieu et date
  const date = new Date(d.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.textAlign = 'center'; ctx.fillStyle = NAVY; ctx.font = `400 ${31 * S}px Montserrat`;
  ctx.fillText(`${t.place}, le ${date}`, 1100 * S, 1080 * S);

  // Deux signatures : le formateur à gauche, le fondateur à droite ; le cachet entre les deux.
  const sigBlock = (cx: number, name: string, role: string, img: HTMLImageElement | null) => {
    if (img) drawFit(img, cx, 1150, 300, 110);
    ctx.fillStyle = NAVY2; ctx.fillRect((cx - 165) * S, 1264 * S, 330 * S, 2.5 * S);
    ctx.textAlign = 'center';
    let fs = 30; ctx.font = `600 ${fs * S}px Montserrat`;
    while (ctx.measureText(name).width > 420 * S && fs > 18) { fs -= 2; ctx.font = `600 ${fs * S}px Montserrat`; }
    ctx.fillStyle = NAVY; ctx.fillText(name, cx * S, 1312 * S);
    if (role) { ctx.fillStyle = RED; ctx.font = `600 ${21 * S}px Montserrat`; ctx.fillText(role.toUpperCase(), cx * S, 1346 * S); }
  };
  if (stamp) { ctx.globalAlpha = 0.9; drawFit(stamp, 1100, 1105, 210, 210); ctx.globalAlpha = 1; } else seal(ctx, 1100 * S, 1215 * S, 100 * S);
  sigBlock(740, d.trainer_name?.trim() || 'L’équipe pédagogique', t.trainer_label, null);
  sigBlock(1460, t.signatory_name, t.signatory_title, signature);

  // QR code et numéro
  if (t.show_qr) {
    drawQr(ctx, verifyUrl(d.code), 1680 * S, 1150 * S, 118 * S);
    ctx.fillStyle = MUTED; ctx.font = `500 ${15 * S}px Montserrat`; ctx.textAlign = 'center'; ctx.fillText('Scannez pour vérifier', 1739 * S, 1296 * S);
  }
  ctx.textAlign = 'right'; ctx.fillStyle = NAVY; ctx.font = `600 ${25 * S}px Montserrat`;
  ctx.fillText(`N° ${d.code}`, 1815 * S, 1392 * S);
}

export async function downloadCertificate(d: CertificateData, template?: CertificateTemplate) {
  const t = template ?? (await loadTemplate());
  if (d.trainer_name === undefined) d = { ...d, trainer_name: await trainerName(d.course_id) };
  const canvas = document.createElement('canvas');
  await renderCertificate(canvas, t, d);
  const { jsPDF } = await import('jspdf'); // chargé seulement au téléchargement
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 297, 210);
  pdf.setProperties({ title: `Certificat ${d.code}`, author: 'Académie du Capital Humain', subject: d.course_title });
  pdf.save(`certificat-${d.code}.pdf`);
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  return !!data;
}
