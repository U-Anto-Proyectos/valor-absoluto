// Modelo de expresiones, formato y resolución exacta de ecuaciones con valor absoluto.
import { Q, q } from './q.js';

export const MINUS = '−';

// ---------- Construcción ----------
export const lin = (a, b = 0, order) => ({ k: 'lin', a: Q.of(a), b: Q.of(b), order });
export const absT = (A, p = 1, qq = 0) => ({ k: 'abs', A, p: Q.of(p), q: Q.of(qq) });
export const eq = (L, R) => ({ L, R });
export const eqsLine = (...cases) => ({ kind: 'eqs', cases });
export const setLine = (vals) => ({ kind: 'set', vals: uniqSorted(vals) });
export const noneLine = (note = '') => ({ kind: 'none', note });
export const condLine = (B, rel, m) => ({ kind: 'cond', B, rel, m: Q.of(m) });
export const rawLine = (markup, key) => ({ kind: 'raw', markup, rkey: key ?? markup });

export function uniqSorted(vals) {
  const seen = new Map();
  for (const v of vals) seen.set(v.key(), v);
  return [...seen.values()].sort((x, y) => x.cmp(y));
}

// ---------- Formato (marcado intermedio) ----------
// Fracciones como ⟦n/d⟧; el renderizador las convierte en fracciones apiladas.
export function fmtNum(v) {
  v = Q.of(v);
  const s = v.sign < 0 ? MINUS : '';
  const a = v.abs();
  return s + (a.isInt ? String(a.n) : `⟦${a.n}/${a.d}⟧`);
}
function coefX(a) {
  if (a.eq(1)) return 'x';
  if (a.eq(-1)) return MINUS + 'x';
  return fmtNum(a) + 'x';
}
export function fmtLin(e) {
  const { a, b } = e;
  if (a.isZero) return fmtNum(b);
  if (b.isZero) return coefX(a);
  if (e.order === 'cf') {
    // constante primero: 5 − 2x
    const xa = a.abs();
    const xs = xa.eq(1) ? 'x' : fmtNum(xa) + 'x';
    return `${fmtNum(b)} ${a.sign < 0 ? MINUS : '+'} ${xs}`;
  }
  return `${coefX(a)} ${b.sign < 0 ? MINUS : '+'} ${fmtNum(b.abs())}`;
}
export function fmtSide(s) {
  if (s.k === 'lin') return fmtLin(s);
  let out = '';
  if (s.p.eq(-1)) out = MINUS;
  else if (!s.p.eq(1)) out = fmtNum(s.p);
  out += `|${fmtLin(s.A)}|`;
  if (!s.q.isZero) out += ` ${s.q.sign < 0 ? MINUS : '+'} ${fmtNum(s.q.abs())}`;
  return out;
}
export const fmtEq = (e) => `${fmtSide(e.L)} = ${fmtSide(e.R)}`;
export function fmtSet(vals) {
  return vals.length ? `S = {${vals.map(fmtNum).join(', ')}}` : 'S = ∅';
}

// Partes visibles de una línea: [{m: marcado}, ...] + conector
export function lineParts(line) {
  switch (line.kind) {
    case 'eqs': return { parts: line.cases.map(fmtEq), joiner: 'o' };
    case 'set': return { parts: [fmtSet(line.vals)], joiner: '' };
    case 'none': return { parts: ['Sin solución'], joiner: '', note: line.note, text: true };
    case 'cond': return { parts: [`${fmtLin(line.B)} ≥ 0`, `x ${line.rel} ${fmtNum(line.m)}`], joiner: '⇒', label: 'Condición' };
    case 'raw': return { parts: [line.markup], joiner: '' };
  }
}
export const lineText = (line) => { const p = lineParts(line); return (p.label ? p.label + ': ' : '') + p.parts.join(` ${p.joiner} `); };

// ---------- Evaluación y resolución ----------
export const evalLin = (e, x) => e.a.mul(x).add(e.b);
export function evalSide(s, x) {
  if (s.k === 'lin') return evalLin(s, x);
  return s.p.mul(evalLin(s.A, x).abs()).add(s.q);
}
export const holds = (e, x) => evalSide(e.L, x).eq(evalSide(e.R, x));

// Resuelve L = R con L, R lineales. Devuelve arreglo de Q o 'ALL'.
function solveLinLin(L, R) {
  const A = L.a.sub(R.a), B = R.b.sub(L.b);
  if (A.isZero) return B.isZero ? 'ALL' : [];
  return [B.div(A)];
}
// Resolución exacta general (por casos). Verifica cada candidato en la ecuación original.
export function solveEq(e) {
  let { L, R } = e;
  if (L.k === 'lin' && R.k === 'lin') return solveLinLin(L, R);
  if (L.k === 'lin' && R.k === 'abs') [L, R] = [R, L];
  const cands = [];
  const push = (r) => { if (r === 'ALL') throw new Error('Identidad no soportada'); cands.push(...r); };
  if (R.k === 'lin') {
    // p|A| + q = R  ⇒  |A| = (R − q)/p  =: T ; A = T o A = −T
    const T = lin(R.a.div(L.p), R.b.sub(L.q).div(L.p));
    push(solveLinLin(L.A, T));
    push(solveLinLin(L.A, lin(T.a.neg(), T.b.neg())));
  } else {
    // p|A| + q = s|B| + t  (solo usamos p = s = 1, q = t = 0)
    if (!(L.p.eq(1) && R.p.eq(1) && L.q.isZero && R.q.isZero)) throw new Error('Forma no soportada');
    push(solveLinLin(L.A, R.A));
    push(solveLinLin(L.A, lin(R.A.a.neg(), R.A.b.neg())));
  }
  return uniqSorted(cands.filter((x) => holds(e, x)));
}

export function solveLine(line) {
  if (line.kind === 'eqs') {
    const all = [];
    for (const c of line.cases) { const r = solveEq(c); if (r === 'ALL') return 'ALL'; all.push(...r); }
    return uniqSorted(all);
  }
  if (line.kind === 'set') return line.vals;
  if (line.kind === 'none') return [];
  return null;
}

// Clave semántica: dos líneas con la misma clave son equivalentes (misma solución).
// Si no hay solución, se compara además la forma aislada |A| = T de cada caso, para
// no confundir un despeje erróneo con uno válido solo porque ambos dan ∅.
function canonEmpty(e) {
  let { L, R } = e;
  if (L.k === 'lin' && R.k === 'abs') [L, R] = [R, L];
  if (L.k === 'abs' && R.k === 'lin' && R.a.isZero) {
    const T = R.b.sub(L.q).div(L.p);
    const A = L.A.a.sign < 0 ? lin(L.A.a.neg(), L.A.b.neg()) : L.A;
    return `|${A.a.key()},${A.b.key()}|=${T.key()}`;
  }
  if (L.k === 'lin' && R.k === 'lin') return 'F';
  return fmtEq(e);
}
export function lineKey(line) {
  if (line.kind === 'cond') return `C:${line.rel}:${line.m.key()}`;
  if (line.kind === 'raw') return `R:${line.rkey}`;
  if (line.kind === 'none') return 'S:|NONE';
  const s = solveLine(line);
  if (s === 'ALL') return 'ALL';
  if (!s.length && line.kind === 'eqs') return 'S:|' + line.cases.map(canonEmpty).sort().join(';');
  return 'S:' + s.map((v) => v.key()).join(',');
}

export { Q, q };
