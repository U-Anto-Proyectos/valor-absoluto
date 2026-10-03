// Valor Absoluto — lógica de la experiencia.
import { generate, DESDE0_STAGES, substSide } from './generator.js';
import { lineHTML, mathHTML, proseHTML } from './render.js';
import { solveLine, holds, evalSide, fmtNum, fmtSide, fmtLin, lineText } from './math.js';
import { broteSVG, landscapeSVG, ICON } from './art.js';
import { createNumberLine } from './numberline.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LEVELS = { desde0: { name: 'Desde 0', color: '#3AA7A3' }, facil: { name: 'Fácil', color: '#2E9E6A' }, medio: { name: 'Medio', color: '#0071E3' }, alto: { name: 'Alto', color: '#7A5AF8' } };
const GOAL = 5;
const UNLOCKS = [
  { id: 'brote', name: 'Brote', at: 0, c: '#C9DDB4' },
  { id: 'arboleda', name: 'Arboleda', at: 3, c: '#A9C99A' },
  { id: 'rio', name: 'Río', at: 8, c: '#9CC7D6' },
  { id: 'cometa', name: 'Cometa al atardecer', at: 15, c: '#F4C9A0' },
];
const exploreBox = document.getElementById('explore');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Persistencia (opcional: si el navegador la bloquea, todo sigue funcionando) ----------
const KEY = 'valor-absoluto:v1';
const blank = () => ({ xp: 0, solved: { desde0: 0, facil: 0, medio: 0, alto: 0 }, stars: { desde0: 0, facil: 0, medio: 0, alto: 0 }, best: 0, first: { ok: 0, total: 0 } });
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.solved) return { ...blank(), ...d }; } catch {} return blank(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S.saved)); } catch {} }

const S = {
  view: 'home', level: 'facil', ex: null, step: 0, lines: [],
  stepErr: 0, exErr: 0, hints: 0, gain: 0, stepHinted: false, busy: false, explored: true,
  session: { solved: 0, streak: 0, recent: new Set(), count: { desde0: 0, facil: 0, medio: 0, alto: 0 }, stage: 0 },
  saved: load(),
};
const totalSolved = () => Object.values(S.saved.solved).reduce((a, b) => a + b, 0);
const unlocked = () => Object.fromEntries(UNLOCKS.map((u) => [u.id, totalSolved() >= u.at]));

// ---------- Escena, guía e indicadores ----------
function paintScene() { $('#scene').innerHTML = landscapeSVG(unlocked()); }
let broteTimer;
function brote(state = 'neutral', msg = '') {
  const d = $('#broteDock');
  d.innerHTML = broteSVG(state, 84);
  if (state !== 'neutral') d.firstElementChild.classList.add('brote-pop');
  const b = $('#bubble');
  b.textContent = msg; b.classList.toggle('is-on', !!msg);
  clearTimeout(broteTimer);
  if (state !== 'neutral') broteTimer = setTimeout(() => { brote('neutral'); }, msg ? 2600 : 1400);
}
function hud(bump) {
  $('#xpVal').textContent = S.saved.xp;
  $('#streakVal').textContent = S.session.streak;
  $('#streakChip').classList.toggle('is-dim', !S.session.streak);
  $('#goalRing').innerHTML = ICON.ring(S.session.solved / GOAL);
  $('#goalVal').textContent = `${Math.min(S.session.solved, GOAL)}/${GOAL}`;
  if (bump) for (const id of bump) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('is-on'), 2600); }
function say(msg) { $('#live').textContent = msg; }
function confetti(n = 40) {
  if (reduced) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#F2B233', '#2E9E6A', '#0071E3', '#F2A7A0', '#7A5AF8'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % cols.length];
    p.style.animationDuration = 1.4 + Math.random() * 1.2 + 's'; p.style.animationDelay = Math.random() * 0.25 + 's';
    p.style.transform = `rotate(${Math.random() * 180}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3000);
}

// ---------- Selector de nivel ----------
function paintLevels() {
  $$('.lv').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.level === S.level && S.view !== 'home')));
  const act = $(`.lv[data-level="${S.level}"]`), ind = $('#ind');
  if (S.view === 'home') { ind.style.opacity = 0; return; }
  ind.style.opacity = 1; ind.style.width = act.offsetWidth + 'px'; ind.style.transform = `translateX(${act.offsetLeft}px)`;
  document.documentElement.style.setProperty('--lv', LEVELS[S.level].color);
}
function setView(v) {
  S.view = v;
  for (const id of ['home', 'play', 'progress']) $('#' + id).classList.toggle('is-on', id === v);
  paintLevels();
  if (v === 'progress') paintProgress();
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

// ---------- Ejercicios ----------
function startLevel(level) {
  S.level = level;
  if (location.hash !== '#' + level) history.replaceState(null, '', '#' + level);
  setView('play');
  newExercise(true);
}
function newExercise(immediate) {
  const sheet = $('#sheet');
  const go = () => {
    const ex = generate(S.level, { recent: S.session.recent, stage: S.session.stage });
    S.session.recent.add(ex.key); if (S.session.recent.size > 40) S.session.recent.delete(S.session.recent.values().next().value);
    Object.assign(S, { ex, step: 0, lines: [ex.statement], stepErr: 0, exErr: 0, hints: 0, gain: 0, stepHinted: false, busy: false, explored: !ex.explore });
    paintSheet();
    sheet.classList.remove('leaving'); sheet.classList.add('entering');
    setTimeout(() => sheet.classList.remove('entering'), 400);
    $('#done').classList.add('is-hidden'); $('#done').innerHTML = '';
    for (const id of ['#cap', '#opts', '#foot', '#panel']) $(id).classList.remove('is-hidden');
    if (S.explored) paintStep(); else paintExplore();
    brote('neutral');
  };
  if (immediate || reduced) go(); else { sheet.classList.add('leaving'); setTimeout(go, 280); }
}

function paintSheet() {
  const ex = S.ex;
  $('#tag').textContent = `${LEVELS[S.level].name} · Ejercicio ${S.session.count[S.level] + 1}`;
  const lines = $('#lines'); lines.innerHTML = '';
  S.lines.forEach((l, i) => lines.appendChild(sheetLine(l, i === 0)));
  if (ex.explore) lines.appendChild(exploreBox); else { exploreBox.classList.add('is-hidden'); exploreBox.innerHTML = ''; }
  $('#slot').classList.toggle('is-hidden', !S.explored);
  paintDots();
  if (ex.statement.kind === 'raw') lines.firstElementChild.classList.add('raw-q');
}
function sheetLine(line, first, isFinal) {
  const wrap = document.createDocumentFragment();
  if (!first) { const a = document.createElement('div'); a.className = 'arrow'; a.textContent = '↓'; a.setAttribute('aria-hidden', 'true'); wrap.appendChild(a); }
  const d = document.createElement('div');
  d.className = 'sline' + (first ? ' first' : '') + (isFinal ? ' final' : '');
  d.innerHTML = lineHTML(line);
  d.setAttribute('aria-label', lineText(line));
  wrap.appendChild(d);
  return wrap;
}
function paintDots() {
  const n = S.ex.steps.length;
  $('#dots').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < S.step ? 'on' : ''}"></i>`).join('');
}

// Exploración de Desde 0 con recta numérica
function paintExplore() {
  const ex = S.ex, box = exploreBox;
  box.classList.remove('is-hidden', 'is-done'); box.innerHTML = '';
  for (const id of ['#cap', '#opts', '#foot']) $(id).classList.add('is-hidden');
  $('#panel').classList.add('is-hidden');
  $('#hintBox').innerHTML = ''; $('#tool').innerHTML = '';
  const compact = matchMedia('(max-width: 600px)').matches;
  const reach = Math.max(...[ex.explore.center, ex.explore.target ?? 0, ...(ex.explore.targets || [])].map(Math.abs), 4) + 1;
  const span = compact ? Math.max(6, reach) : 8;
  const nl = createNumberLine({
    ...ex.explore, compact, min: -span, max: span,
    onTry: (v, d) => { if (ex.explore.mode === 'none') brote('pensando', `distancia ${d}`); },
    onFound: (k, n) => {
      // se encontró un punto pero faltan otros: decirlo para que no parezca que la web se trabó
      const falta = n - k;
      hint.textContent = `¡Bien! Falta ${falta === 1 ? 'otro punto' : falta + ' puntos'} a distancia ${ex.explore.dist}, al otro lado ${ex.explore.center === 0 ? 'del 0' : 'del centro'}`;
      hint.classList.remove('nudge'); void hint.offsetWidth; hint.classList.add('nudge');
      brote('feliz', 'Falta otro punto');
      say(`Correcto. Falta ${falta === 1 ? 'otro punto' : falta + ' puntos'}.`);
    },
    onDone: () => {
      box.classList.add('is-done');
      hint.textContent = ex.explore.mode === 'none' ? 'Ninguna distancia es negativa' : '¡Eso es! Ahora elige la línea';
      brote('feliz');
      S.explored = true;
      $('#panel').classList.remove('is-hidden');
      $('#slot').classList.remove('is-hidden');
      for (const id of ['#cap', '#opts', '#foot']) $(id).classList.remove('is-hidden');
      paintStep();
      if (matchMedia('(max-width: 1100px)').matches) setTimeout(() => $('#panel').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 200);
    },
  });
  const hint = document.createElement('div'); hint.className = 'ex-hint'; hint.textContent = nl.dataset.hint;
  box.append(nl, hint);
  brote('pensando', ex.explore.mode === 'drag' ? '¿Qué tan lejos del 0?' : '');
}

function paintStep() {
  const st = S.ex.steps[S.step];
  S.stepErr = 0; S.stepHinted = false;
  $('#hintBox').innerHTML = ''; $('#tool').innerHTML = '';
  const tool = st.tool === 'pm' && !!absLine();
  $('#pmBtn').classList.toggle('is-hidden', !tool); $('#pmLab').classList.toggle('is-hidden', !tool);
  const box = $('#opts'); box.innerHTML = '';
  st.options.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'opt'; b.dataset.i = i;
    b.style.animationDelay = reduced ? '0s' : i * 40 + 'ms';
    b.innerHTML = `<span class="kbd" aria-hidden="true">${i + 1}</span><span class="mline">${lineHTML(o.line)}</span><span class="omark" aria-hidden="true"></span>`;
    b.setAttribute('aria-label', lineText(o.line));
    b.addEventListener('click', () => choose(i, b));
    box.appendChild(b);
  });
  paintDots();
}

function clearFeedback() { $$('#opts .fb, #opts .compare').forEach((n) => n.remove()); $$('#opts .opt.is-wrong').forEach((n) => { n.classList.remove('is-wrong'); n.classList.add('is-spent'); }); }

function choose(i, btn) {
  if (S.busy || btn.disabled) return;
  const st = S.ex.steps[S.step], o = st.options[i];
  clearFeedback();
  if (!o.correct) {
    S.stepErr++; S.exErr++;
    btn.classList.add('is-wrong'); btn.disabled = true;
    const fb = document.createElement('div'); fb.className = 'fb';
    const cmp = compareData(S.lines.at(-1), o.line);
    fb.innerHTML = `<span class="mini">${broteSVG('ups', 38)}</span><span class="pill err" role="status"><span class="t">${proseHTML(o.fb)}</span>${cmp ? '<button class="why" type="button">¿Por qué?</button>' : ''}</span>`;
    btn.after(fb);
    if (cmp) $('.why', fb).addEventListener('click', (e) => { e.currentTarget.remove(); fb.after(compareEl(cmp)); });
    brote('ups'); say('Incorrecto. ' + o.fb);
    return;
  }
  S.busy = true;
  const first = S.stepErr === 0 && !S.stepHinted;
  S.saved.first.total++; if (first) S.saved.first.ok++;
  const pts = first ? 10 : 3; S.gain += pts;
  btn.classList.add('is-right'); btn.disabled = true;
  $$('#opts .opt').forEach((b) => { if (b !== btn) { b.disabled = true; b.classList.add('is-dim'); } });
  $$('#opts .fb').forEach((n) => n.remove());
  say('Correcto.');
  const isLast = S.step === S.ex.steps.length - 1;
  setTimeout(() => flyIn(btn, o.line, isLast, () => {
    S.lines.push(o.line); S.step++;
    if (isLast) complete();
    else { brote(first ? 'feliz' : 'neutral'); paintStep(); S.busy = false; }
  }), reduced ? 0 : 160);
}

// La línea elegida viaja hasta la hoja (animación FLIP)
function flyIn(btn, line, isFinal, done) {
  const lines = $('#lines');
  const asFinal = isFinal && (line.kind === 'set' || line.kind === 'raw');
  const frag = sheetLine(line, false, asFinal);
  const nodes = [...frag.childNodes];
  lines.appendChild(frag);
  const target = nodes.at(-1);
  if (S.ex.rejected?.length && isFinal) {
    const note = document.createElement('div'); note.className = 'note-row';
    note.innerHTML = S.ex.rejected.map((r) => `<span class="m">${mathHTML(`x = ${fmtNum(r.x)}`)}</span> se descarta: <span class="m">${mathHTML(r.why)}</span>`).join(' · ');
    lines.appendChild(note);
  }
  if (isFinal) $('#slot').classList.add('is-hidden');
  const src = $('.mline', btn);
  if (reduced || !src.animate) { target.classList.add('glow'); requestAnimationFrame(() => setTimeout(() => target.classList.remove('glow'), 60)); return done(); }
  target.style.visibility = 'hidden';
  const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
  const fsA = parseFloat(getComputedStyle(btn).fontSize), fsB = parseFloat(getComputedStyle(target).fontSize);
  const ghost = document.createElement('div');
  ghost.className = 'ghost'; ghost.innerHTML = src.innerHTML;
  Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', fontSize: fsA + 'px', color: getComputedStyle(btn).color });
  document.body.appendChild(ghost);
  const padL = parseFloat(getComputedStyle(target).paddingLeft), padT = parseFloat(getComputedStyle(target).paddingTop);
  const sc = fsB / fsA;
  const dx = b.left + padL - a.left, dy = b.top + padT - a.top + (b.height - 2 * padT - a.height * sc) / 2;
  const anim = ghost.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${sc})` }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  anim.onfinish = () => {
    ghost.remove(); target.style.visibility = '';
    if (!asFinal) { target.classList.add('glow'); setTimeout(() => target.classList.remove('glow'), 80); }
    done();
  };
}

function complete() {
  const ex = S.ex;
  const penal = S.exErr + S.hints;
  const stars = penal === 0 ? 3 : penal <= 2 ? 2 : 1;
  const bonus = 10 * stars;
  S.gain += bonus;
  const before = unlocked();
  S.saved.xp += S.gain; S.saved.solved[S.level]++; S.saved.stars[S.level] += stars;
  S.session.solved++; S.session.count[S.level]++;
  S.session.streak = S.exErr === 0 ? S.session.streak + 1 : 0;
  S.saved.best = Math.max(S.saved.best, S.session.streak);
  if (S.level === 'desde0') S.session.stage++;
  save(); hud(['#xpChip', '#goalChip']);
  paintDots();
  for (const id of ['#cap', '#opts', '#foot']) $(id).classList.add('is-hidden');
  $('#hintBox').innerHTML = ''; $('#tool').innerHTML = '';
  const d = $('#done');
  const checks = ex.checks?.length ? `<div class="checks"><span class="cap2">Comprobación</span>${ex.checks.map((c) => `<div class="row">${c.parts.map((t) => `<span class="m">${mathHTML(t)}</span>`).join('<span class="join">y</span>')}</div>`).join('')}${(ex.rejected || []).map((r) => `<div class="row rej"><span class="m">${mathHTML(`x = ${fmtNum(r.x)}`)}</span> no cumple la condición</div>`).join('')}</div>` : '';
  const nextLevel = S.level === 'desde0' && S.session.stage >= DESDE0_STAGES.length ? '<button class="btn sec" id="toFacil">Probar Fácil</button>' : '<button class="btn sec" id="toProg">Tu progreso</button>';
  d.innerHTML = `${broteSVG('feliz', 110)}
    <div class="stars" aria-label="${stars} de 3 estrellas">${[0, 1, 2].map((i) => ICON.star(i < stars ? '#F2B233' : '#E4DED2', 30)).join('')}</div>
    <h2>Resuelto</h2>
    <div class="meta"><b>+${S.gain} XP</b><span>·</span><span>${S.exErr === 0 ? 'sin errores' : S.exErr === 1 ? '1 error' : S.exErr + ' errores'}</span></div>
    ${checks}
    <div class="btns"><button class="btn" id="nextBtn">Otro ejercicio <span aria-hidden="true">→</span></button>${nextLevel}</div>`;
  d.classList.remove('is-hidden');
  $('#nextBtn').addEventListener('click', () => newExercise());
  $('#toProg')?.addEventListener('click', () => setView('progress'));
  $('#toFacil')?.addEventListener('click', () => startLevel('facil'));
  $('#nextBtn').focus({ preventScroll: true });
  brote('feliz', stars === 3 ? '¡Perfecto!' : '¡Resuelto!');
  say(`Resuelto. ${stars} estrellas.`);
  if (stars === 3) confetti(28);
  if (S.session.solved === GOAL) setTimeout(() => { toast('Meta de la sesión cumplida'); confetti(60); }, 700);
  const after = unlocked();
  const nu = UNLOCKS.find((u) => after[u.id] && !before[u.id]);
  if (nu) setTimeout(() => { paintScene(); toast(`Nuevo en tu paisaje: ${nu.name}`); }, S.session.solved === GOAL ? 3400 : 700);
  if (matchMedia('(max-width: 1100px)').matches) setTimeout(() => d.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 300);
  S.busy = false;
}

// ---------- Comparador: ¿por qué no es equivalente? ----------
function compareData(prev, wrong) {
  if (!prev || prev.kind !== 'eqs' || wrong.kind !== 'eqs') return null;
  let ps, ws;
  try { ps = solveLine(prev); ws = solveLine(wrong); } catch { return null; }
  if (ps === 'ALL' || ws === 'ALL') return null;
  const miss = ps.find((v) => !ws.some((w) => w.eq(v)));
  if (!miss) return null;
  const idx = Math.max(0, prev.cases.findIndex((c) => holds(c, miss)));
  const wc = wrong.cases[idx] ?? wrong.cases[0];
  const side = (s) => { const t = substSide(s, miss); const v = evalSide(s, miss); return t ? `${t} = ${fmtNum(v)}` : fmtNum(v); };
  return { x: miss, text: `${side(wc.L)} ≠ ${side(wc.R)}` };
}
function compareEl(c) {
  const d = document.createElement('div'); d.className = 'compare';
  d.innerHTML = `<div class="row"><span class="m">${mathHTML(`x = ${fmtNum(c.x)}`)}</span> cumple la línea anterior</div>
    <div class="row bad"><span>en tu línea:</span><span class="m">${mathHTML(c.text)}</span></div>
    <small>Un paso válido no pierde soluciones.</small>`;
  return d;
}

// ---------- Pista y explorador ± ----------
function showHint() {
  if (S.busy || !S.ex) return;
  const st = S.ex.steps[S.step];
  if (!S.stepHinted) { S.stepHinted = true; S.hints++; }
  $('#hintBox').innerHTML = `<div class="fb"><span class="mini">${broteSVG('pensando', 38)}</span><span class="pill hint"><span class="t">${proseHTML(st.hint || 'Observa la línea anterior.')}</span></span></div>`;
  brote('pensando');
}
function absLine() { return [...S.lines].reverse().find((l) => l.kind === 'eqs' && l.cases[0].L.k === 'abs' && l.cases[0].L.p.eq(1) && l.cases[0].L.q.isZero); }
function showPM() {
  const tool = $('#tool');
  if (tool.firstChild) { tool.innerHTML = ''; return; }
  const c = absLine().cases[0];
  const isConst = c.R.k === 'lin' && c.R.a.isZero;
  const R = isConst ? 'k' : 'B';
  if (!S.stepHinted) { S.stepHinted = true; S.hints++; }
  const card = document.createElement('div'); card.className = 'pm-card';
  card.innerHTML = `<div class="pm-eq"><span class="bar l">|</span><i>A</i><span class="bar r">|</span><span class="rest">= ${isConst ? '<i>k</i>' : (c.R.k === 'abs' ? '|<i>B</i>|' : '<i>B</i>')}</span></div>
    <button class="pm-handle" aria-label="Abrir el valor absoluto"></button><span class="pm-cap">Desliza hacia abajo</span>`;
  tool.appendChild(card);
  const bars = $$('.bar', card), handle = $('.pm-handle', card);
  let y0 = null, opened = false;
  const setOpen = (t) => { bars[0].style.transform = `translateX(${-t * 22}px)`; bars[1].style.transform = `translateX(${t * 22}px)`; };
  const open = () => {
    if (opened) return; opened = true; setOpen(1);
    setTimeout(() => {
      const legend = `<span class="m">${mathHTML('A = ' + fmtLin(c.L.A))}</span>` + (isConst ? ` y <span class="m">${mathHTML('k = ' + fmtNum(c.R.b))}</span>` : ` y <span class="m">${mathHTML('B = ' + (c.R.k === 'abs' ? fmtLin(c.R.A) : fmtSide(c.R)))}</span>`);
      card.innerHTML = `<div class="pm-split"><div class="pm-case pos"><span class="m">${mathHTML(`A = ${R}`)}</span><small>caso +</small></div><div class="pm-case neg"><span class="m">${mathHTML(`A = −${R}`)}</span><small>caso −</small></div></div>
        <div class="pm-legend">${isConst ? '<i>A</i> está a distancia <i>k</i> del 0: a la derecha o a la izquierda.' : 'Mismo valor absoluto: iguales u opuestos.'}<br>Aquí ${legend}</div>`;
    }, reduced ? 0 : 260);
  };
  card.addEventListener('pointerdown', (e) => { y0 = e.clientY; card.setPointerCapture(e.pointerId); });
  card.addEventListener('pointermove', (e) => { if (y0 == null || opened) return; const t = Math.max(0, Math.min(1, (e.clientY - y0) / 60)); setOpen(t); if (t >= 1) open(); });
  card.addEventListener('pointerup', (e) => { if (y0 == null) return; const moved = e.clientY - y0; y0 = null; if (moved > 30 || Math.abs(moved) < 6) open(); else if (!opened) setOpen(0); });
  handle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(); } });
  brote('pensando');
}

// ---------- Progreso ----------
function paintProgress() {
  const s = S.saved, ses = S.session;
  const pct = s.first.total ? Math.round((100 * s.first.ok) / s.first.total) + '%' : '—';
  const starsTotal = Object.values(s.stars).reduce((a, b) => a + b, 0);
  const tot = totalSolved();
  $('#prog').innerHTML = `
    <div class="prog-head"><div><h2>Tu progreso</h2><p>Meta de hoy: ${GOAL} ecuaciones</p></div>
      <div class="goal">${ICON.ring(ses.solved / GOAL, 88)}<div><b>${Math.min(ses.solved, GOAL)} de ${GOAL}</b><span>${ses.solved >= GOAL ? '¡Meta cumplida!' : ses.solved ? '¡Vas muy bien!' : 'Empieza cuando quieras'}</span></div></div></div>
    <div class="stats">
      <div class="stat"><b style="color:var(--oro-tinta)">${s.xp}</b><span>XP</span></div>
      <div class="stat"><b style="color:var(--oro-tinta)">${starsTotal}</b><span>estrellas</span></div>
      <div class="stat"><b style="color:#D9722B">${s.best}</b><span>mejor racha</span></div>
      <div class="stat"><b style="color:var(--ok-tinta)">${pct}</b><span>aciertos al primer intento</span></div>
    </div>
    <div class="lvrows">${Object.entries(LEVELS).map(([k, L]) => { const n = s.solved[k]; const f = Math.min(1, n / 10); return `<div class="lvrow" style="--c:${L.color}"><span class="n">${L.name}</span><span class="track"><i style="width:${f * 100}%"></i></span><small>${n >= 10 ? 'Dominado' : n ? `${n} resueltos` : 'Por empezar'}</small></div>`; }).join('')}</div>
    <h3>Tu paisaje crece</h3>
    <div class="scenes">${UNLOCKS.map((u) => { const on = tot >= u.at; return `<div class="scn ${on ? '' : 'locked'}" style="--c:${u.c}"><div class="pic"></div><span>${on ? u.name : `${u.name} · ${u.at - tot} más`}</span></div>`; }).join('')}</div>
    <div class="btns" style="justify-content:flex-start"><button class="btn" id="backPlay">Seguir practicando <span aria-hidden="true">→</span></button></div>`;
  $('#backPlay').addEventListener('click', () => { if (S.ex) { setView('play'); } else startLevel(S.level); });
}

// ---------- Eventos ----------
$$('.lv').forEach((b) => b.addEventListener('click', () => startLevel(b.dataset.level)));
$$('.lcard').forEach((b) => b.addEventListener('click', () => startLevel(b.dataset.level)));
$('#homeBtn').addEventListener('click', () => { history.replaceState(null, '', location.pathname); setView('home'); });
$('#goalChip').addEventListener('click', () => setView(S.view === 'progress' && S.ex ? 'play' : 'progress'));
$('#hintBtn').addEventListener('click', showHint);
$('#pmBtn').addEventListener('click', showPM);
addEventListener('resize', paintLevels);
addEventListener('keydown', (e) => {
  if (S.view !== 'play' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[1-4]$/.test(e.key)) { const b = $$('#opts .opt')[Number(e.key) - 1]; if (b && !$('#opts').classList.contains('is-hidden')) b.click(); }
});

// ---------- Inicio ----------
$('#xpIcon').innerHTML = ICON.star();
$('#flame').innerHTML = ICON.flame;
paintScene(); brote('neutral'); hud();
const h = location.hash.slice(1);
if (LEVELS[h]) startLevel(h); else setView('home');
document.fonts?.ready.then(paintLevels);
