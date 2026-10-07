// Convierte el marcado matemático en HTML (cursiva para variables, fracciones apiladas).
import { lineParts } from './math.js';

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function mathHTML(markup) {
  let h = esc(markup);
  h = h.replace(/⟦(\d+)\/(\d+)⟧/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  h = h.replace(/C\.S\./g, '⟪CS⟫'); // «C.S.» va recto, no en cursiva
  h = h.replace(/(^|[^A-Za-zÁ-ú])([xSAk])(?![A-Za-zÁ-ú])/g, '$1<i>$2</i>');
  h = h.replace(/⟪CS⟫/g, '<span class="cs">C.S.</span>');
  h = h.replace(/ ([=≥≤≠⇒]) /g, '<span class="op">$1</span>');
  return h;
}

// Texto normal con números del marcado (para retroalimentación).
export function proseHTML(text) {
  return esc(text).replace(/⟦(\d+)\/(\d+)⟧/g, '$1/$2');
}

export function lineHTML(line) {
  const p = lineParts(line);
  const parts = p.parts.map((m) => (p.text ? `<span class="m m-text">${esc(m)}</span>` : `<span class="m">${mathHTML(m)}</span>`));
  let body = parts.join(p.joiner ? `<span class="join">${p.joiner === 'o' ? 'o' : p.joiner}</span>` : '');
  if (p.label) body = `<span class="lab">${esc(p.label)}</span>` + body;
  if (p.note) body += `<span class="note">${mathHTML(p.note)}</span>`;
  return body;
}
