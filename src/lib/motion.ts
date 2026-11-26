import { useEffect } from 'react';

/**
 * Apparition au défilement, appliquée automatiquement aux blocs du contenu (cartes, sections…).
 * Règle : seul ce qui est SOUS la ligne de flottaison au moment où il arrive dans la page est animé ;
 * le premier écran s'affiche immédiatement, sans attendre aucun script.
 * Les contenus chargés plus tard (listes venant de la base) sont pris en charge par un MutationObserver.
 */
const TARGETS = [
  '.sec-head', '.ccard', '.domain', '.pcard', '.fac-card', '.way', '.faculty', '.mv-card', '.why > div', '.research > div',
  '.values > div', '.numbered li', '.step', '.docs > div', '.gov-card', '.split > *', '.founder > *', '.b2b .wrap > *',
  '.final .box', '.kpi-row > div', '.admin-card', '.req-card', '.ann', '.live-card', '.contact-grid > *', '.form-card', '.af-section',
].join(',');

export function useReveal(routeKey: string) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.getElementById('contenu');
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    const prepare = (scope: ParentNode) => {
      const els = scope.querySelectorAll<HTMLElement>(TARGETS);
      els.forEach((el) => {
        if (el.dataset.rv) return;
        el.dataset.rv = '1';
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) return; // déjà visible : pas d'animation, pas de masquage
        // Décalage en cascade entre éléments frères (max 6 crans)
        const idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) % 6 : 0;
        el.style.setProperty('--rv-i', String(idx));
        el.classList.add('rv');
        if (el.matches('.ccard, .pcard, .fac-card, .admin-card, .req-card')) el.classList.add('rv-scale');
        io.observe(el);
      });
    };
    prepare(root);
    const mo = new MutationObserver((muts) => { for (const m of muts) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) prepare(n.parentElement ?? n); }); });
    mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [routeKey]);
}

/** Ombre de l'en-tête dès que la page défile. */
export function useScrolledHeader() {
  useEffect(() => {
    const h = document.querySelector('header.site');
    if (!h) return;
    const on = () => h.classList.toggle('scrolled', window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
}

