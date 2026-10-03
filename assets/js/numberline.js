// Recta numérica interactiva: arrastrar un punto o tocar puntos para medir distancias.
const NS = 'http://www.w3.org/2000/svg';
const fmt = (v) => String(v).replace('-', '−');

export function createNumberLine({ mode, center = 0, target, dist, targets = [], min = -8, max = 8, compact = false, onDone, onTry, onFound }) {
  const W = compact ? 440 : 720, H = 150, pad = compact ? 20 : 36, Y = 100;
  const X = (v) => pad + ((v - min) * (W - 2 * pad)) / (max - min);
  const V = (x) => Math.round(min + ((x - pad) * (max - min)) / (W - 2 * pad));
  const clamp = (v) => Math.max(min, Math.min(max, v));
  const root = document.createElement('div');
  root.className = 'nline' + (compact ? ' compact' : '');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  root.appendChild(svg);
  const el = (tag, attrs, parent = svg) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };

  el('line', { x1: pad - 10, x2: W - pad + 10, y1: Y, y2: Y, class: 'nl-axis' });
  for (let v = min; v <= max; v++) {
    const big = v === 0 || v === center;
    el('line', { x1: X(v), x2: X(v), y1: Y - (big ? 9 : 5), y2: Y + (big ? 9 : 5), class: 'nl-tick' + (v === 0 ? ' is-zero' : '') });
    const t = el('text', { x: X(v), y: Y + 30, class: 'nl-num' + (v === 0 ? ' is-zero' : '') });
    t.textContent = fmt(v);
  }
  if (center !== 0) {
    el('circle', { cx: X(center), cy: Y, r: 5, class: 'nl-center' });
    const c = el('text', { x: X(center), y: Y - 16, class: 'nl-cap' }); c.textContent = `centro ${fmt(center)}`;
  }
  const layer = el('g', {});
  let done = false;
  const finish = () => { if (done) return; done = true; root.classList.add('is-done'); setTimeout(() => onDone && onDone(), 450); };

  function bar(v, cls, label) {
    const g = el('g', { class: 'nl-bar ' + cls }, layer);
    const a = Math.min(center, v), b = Math.max(center, v);
    el('rect', { x: X(a), y: Y - 38, width: Math.max(X(b) - X(a), 2), height: 8, rx: 4 }, g);
    const t = el('text', { x: (X(a) + X(b)) / 2, y: Y - 48, class: 'nl-dist' }, g); t.textContent = label;
    return g;
  }

  if (mode === 'drag') {
    let value = center;
    const hint = el('g', { class: 'nl-goal' });
    el('circle', { cx: X(target), cy: Y, r: 14 }, hint);
    svg.insertBefore(hint, layer);
    let live = null;
    const knob = el('circle', { cx: X(value), cy: Y, r: 12, class: 'nl-knob', tabindex: 0, role: 'slider', 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-label': 'Punto en la recta' });
    const draw = () => {
      knob.setAttribute('cx', X(value)); knob.setAttribute('aria-valuenow', value);
      if (live) live.remove();
      if (value !== center) live = bar(value, 'is-live', `distancia ${Math.abs(value - center)}`);
      else live = null;
      if (value === target) finish();
    };
    const toVal = (ev) => { const r = svg.getBoundingClientRect(); return clamp(V(((ev.clientX - r.left) / r.width) * W)); };
    let dragging = false;
    svg.addEventListener('pointerdown', (ev) => { if (done) return; dragging = true; svg.setPointerCapture(ev.pointerId); value = toVal(ev); draw(); });
    svg.addEventListener('pointermove', (ev) => { if (!dragging || done) return; const v = toVal(ev); if (v !== value) { value = v; draw(); } });
    svg.addEventListener('pointerup', () => { dragging = false; });
    knob.addEventListener('keydown', (ev) => { if (done) return; if (ev.key === 'ArrowRight') value = clamp(value + 1); else if (ev.key === 'ArrowLeft') value = clamp(value - 1); else return; ev.preventDefault(); draw(); });
    layer.after(knob);
    root.dataset.hint = `Arrastra el punto hasta ${fmt(target)}`;
  } else {
    const found = new Set();
    const hits = el('g', { class: 'nl-hits' });
    for (let v = min; v <= max; v++) {
      const hw = Math.min(16, (X(1) - X(0)) / 2);
      const r = el('rect', { x: X(v) - hw, y: Y - 26, width: 2 * hw, height: 64, class: 'nl-hit', tabindex: 0, role: 'button', 'aria-label': `Punto ${fmt(v)}`, 'data-v': v }, hits);
      const act = () => {
        if (done || found.has(v)) return;
        const d = Math.abs(v - center);
        onTry && onTry(v, d);
        root.dataset.tries = String(Number(root.dataset.tries || 0) + 1);
        if (mode === 'pick' && d === dist) {
          found.add(v);
          r.classList.add('is-found');
          if (!targets.every((t) => found.has(t))) onFound && onFound(found.size, targets.length);
          bar(v, 'is-ok', `${d}`);
          el('circle', { cx: X(v), cy: Y, r: 9, class: 'nl-dot is-ok' }, layer);
          if (targets.every((t) => found.has(t))) finish();
        } else {
          const g = bar(v, 'is-no', `distancia ${d}`);
          const dot = el('circle', { cx: X(v), cy: Y, r: 8, class: 'nl-dot is-no' }, layer);
          setTimeout(() => { g.classList.add('is-fading'); dot.classList.add('is-fading'); }, 900);
          setTimeout(() => { g.remove(); dot.remove(); }, 1300);
          if (mode === 'none') { found.add(v); if (found.size >= 2) finish(); }
        }
      };
      r.addEventListener('click', act);
      r.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); } });
    }
    // cuántos puntos hay que tocar, dicho con claridad (antes decía «los puntos» y no se sabía que eran dos)
    const ref = center === 0 ? 'del 0' : `de ${fmt(center)}`;
    root.dataset.targets = targets.join(' ');
    root.dataset.center = String(center);
    root.dataset.hint = mode === 'pick'
      ? (targets.length > 1 ? `Toca los ${targets.length} puntos que están a distancia ${dist} ${ref}` : `Toca el punto que está a distancia ${dist} ${ref}`)
      : `Busca un punto a distancia ${fmt(dist)} del 0`;
  }
  return root;
}
