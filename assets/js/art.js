// Ilustraciones originales en SVG: Brote (guía), paisaje pintado y pequeños íconos.

let gid = 0;
export function broteSVG(state = 'neutral', size = 96) {
  const id = `bg${++gid}`;
  const eyes = {
    neutral: `<g class="eyes"><ellipse cx="35.5" cy="51.5" rx="3.5" ry="4.5"/><ellipse cx="60.5" cy="51.5" rx="3.5" ry="4.5"/><circle cx="36.6" cy="50" r="1.3" fill="#fff"/><circle cx="61.6" cy="50" r="1.3" fill="#fff"/></g>`,
    feliz: `<path d="M30 52 Q35.5 45 41 52 M55 52 Q60.5 45 66 52" fill="none" stroke="#1D1D1F" stroke-width="2.6" stroke-linecap="round"/>`,
    pensando: `<g class="eyes"><ellipse cx="35.5" cy="48.5" rx="3.5" ry="4.5"/><ellipse cx="60.5" cy="48.5" rx="3.5" ry="4.5"/><circle cx="36.6" cy="47" r="1.3" fill="#fff"/><circle cx="61.6" cy="47" r="1.3" fill="#fff"/></g><path d="M55 38 L64 36" stroke="#1D1D1F" stroke-width="2" stroke-linecap="round"/>`,
    ups: `<g class="eyes"><ellipse cx="35.5" cy="51.5" rx="3.5" ry="4.5"/><ellipse cx="60.5" cy="51.5" rx="3.5" ry="4.5"/><circle cx="36.6" cy="50" r="1.3" fill="#fff"/><circle cx="61.6" cy="50" r="1.3" fill="#fff"/></g>`,
  }[state];
  const mouth = {
    neutral: `<path d="M43 61 Q48 65 53 61" fill="none" stroke="#1D1D1F" stroke-width="2.2" stroke-linecap="round"/>`,
    feliz: `<path d="M42 60 Q48 69 54 60 Z" fill="#7A2E2E" stroke="#1D1D1F" stroke-width="1.5" stroke-linejoin="round"/>`,
    pensando: `<path d="M44 62 L52 61" stroke="#1D1D1F" stroke-width="2.2" stroke-linecap="round"/><circle cx="83" cy="27" r="3" fill="#A1A1A6"/><circle cx="90" cy="16" r="4" fill="#A1A1A6"/><circle cx="78.5" cy="36.5" r="2.5" fill="#A1A1A6"/>`,
    ups: `<ellipse cx="48" cy="63" rx="3.5" ry="4" fill="#1D1D1F"/><path d="M78 34 Q74 42 78 44 Q82 42 78 34 Z" fill="#8EC5F0"/>`,
  }[state];
  return `<svg class="brote brote--${state}" viewBox="0 0 96 96" width="${size}" height="${size}" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8D595"/><stop offset="1" stop-color="#5E9C6B"/></linearGradient></defs>
  <g class="leaves"><ellipse cx="40" cy="15" rx="8" ry="14" transform="rotate(-28 40 15)" fill="#6FB26A"/><ellipse cx="57" cy="13" rx="8" ry="14" transform="rotate(28 57 13)" fill="#8CCB7C"/><rect x="46.5" y="16" width="3" height="12" rx="1.5" fill="#5E9C6B"/></g>
  <ellipse cx="48" cy="61" rx="38" ry="33" fill="url(#${id})"/>
  <ellipse cx="48" cy="73" rx="20" ry="11" fill="#F4F1DE" opacity=".55"/>
  <ellipse cx="27.5" cy="65" rx="5.5" ry="3" fill="#F2A7A0" opacity=".8"/><ellipse cx="68.5" cy="65" rx="5.5" ry="3" fill="#F2A7A0" opacity=".8"/>
  ${eyes}${mouth}
</svg>`;
}

// Paisaje: cada desbloqueo agrega un detalle pintado.
export function landscapeSVG(unlocks = {}) {
  const w = 1440, h = 320;
  const hill = (a, b, c, d) => `M0 ${h * a} C${w * 0.18} ${h * b} ${w * 0.36} ${h * c} ${w * 0.55} ${h * d} C${w * 0.72} ${h * (d - 0.1)} ${w * 0.86} ${h * (b + 0.04)} ${w} ${h * (a - 0.04)} L${w} ${h} L0 ${h}Z`;
  const tree = (x, y, s = 1, c = '#5E9C6B') => `<g class="tree" transform="translate(${x} ${y}) scale(${s})"><rect x="10" y="24" width="4" height="16" rx="2" fill="#6B5A45"/><ellipse cx="12" cy="15" rx="12" ry="15" fill="${c}"/><ellipse cx="8" cy="10" rx="4" ry="6" fill="#fff" opacity=".12"/></g>`;
  const baseTrees = [[0.08, 1], [0.12, 0.7], [0.63, 0.9], [0.67, 0.6], [0.9, 0.8]].map(([x, s]) => tree(w * x, h * 0.6 - 26 * s, s)).join('');
  const grove = unlocks.arboleda ? [[0.22, 0.8, '#6FA877'], [0.25, 1.1, '#5E9C6B'], [0.285, 0.75, '#7FB57F'], [0.44, 0.9, '#5E9C6B'], [0.77, 1, '#6FA877'], [0.8, 0.7, '#5E9C6B']].map(([x, s, c]) => tree(w * x, h * 0.66 - 26 * s, s, c)).join('') : '';
  const river = unlocks.rio ? `<path class="river" d="M${w * 0.34} ${h} C${w * 0.38} ${h * 0.9} ${w * 0.46} ${h * 0.88} ${w * 0.5} ${h * 0.8} S${w * 0.6} ${h * 0.74} ${w * 0.62} ${h * 0.72}" fill="none" stroke="#9CC7D6" stroke-width="18" stroke-linecap="round" opacity=".9"/><path d="M${w * 0.36} ${h} C${w * 0.4} ${h * 0.9} ${w * 0.46} ${h * 0.89} ${w * 0.5} ${h * 0.81}" fill="none" stroke="#fff" stroke-width="2" opacity=".5" stroke-dasharray="10 14"/>` : '';
  const kite = unlocks.cometa ? `<g class="kite"><path d="M${w * 0.33} ${h * 0.12} l18 -22 l18 22 l-18 30 z" fill="#F28C38"/><path d="M${w * 0.33 + 18} ${h * 0.12 - 22} v52 M${w * 0.33} ${h * 0.12} h36" stroke="#fff" stroke-width="1.5" opacity=".7"/><path d="M${w * 0.33 + 18} ${h * 0.12 + 30} C${w * 0.34} ${h * 0.4} ${w * 0.3} ${h * 0.5} ${w * 0.27} ${h * 0.62}" fill="none" stroke="#6B5A45" stroke-width="1.2" opacity=".6"/></g>` : '';
  const warm = unlocks.cometa ? '#F7D9B8' : '#DDEBF0';
  return `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F3EC" stop-opacity="0"/><stop offset="1" stop-color="${warm}"/></linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter></defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${w * 0.84}" cy="${h * 0.5}" r="${h * 0.2}" fill="#FCE3A6" opacity=".9" filter="url(#soft)"/>
  <g class="clouds"><rect x="${w * 0.2}" y="${h * 0.14}" width="120" height="30" rx="15" fill="#fff" opacity=".75"/><rect x="${w * 0.52}" y="${h * 0.06}" width="84" height="21" rx="10.5" fill="#fff" opacity=".7"/></g>
  ${kite}
  <path d="${hill(0.5, 0.3, 0.62, 0.38)}" fill="#C9DDB4"/>
  <path d="${hill(0.66, 0.52, 0.74, 0.58)}" fill="#A9C99A"/>
  ${baseTrees}${grove}
  <path d="${hill(0.8, 0.72, 0.86, 0.76)}" fill="#7FAE84"/>
  ${river}
</svg>`;
}

export const ICON = {
  star: (fill = '#F2B233', s = 14) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1L3.2 9.2l6.1-.8z" fill="${fill}" stroke="${fill}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  flame: `<svg viewBox="0 0 14 16" width="13" height="15" aria-hidden="true"><path d="M7 0Q12 6 11 10Q10 15 6 15Q1 15 1 10Q1 6 5 4Q5 7 7 8Q8 4 7 0Z" fill="#F28C38"/></svg>`,
  check: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="#2E9E6A"/><path d="M8 14.5l4.5 4.5L20 10" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cross: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="#D9543F"/><path d="M10 10l8 8M18 10l-8 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  ring: (frac, s = 18) => {
    const r = 7, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 18 18" width="${s}" height="${s}" aria-hidden="true" class="ring"><circle cx="9" cy="9" r="${r}" fill="none" stroke="#E4DED2" stroke-width="3"/><circle cx="9" cy="9" r="${r}" fill="none" stroke="#2E9E6A" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, frac))}" transform="rotate(-90 9 9)"/></svg>`;
  },
};
