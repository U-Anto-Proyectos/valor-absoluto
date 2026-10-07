// Generador de ejercicios: conoce de antemano cada paso correcto y construye
// distractores a partir de errores reales, con retroalimentación específica.
import {
  Q, q, lin, absT, eq, eqsLine, setLine, noneLine, condLine, rawLine,
  fmtNum, fmtLin, fmtSide, lineKey, lineText, solveEq, evalSide, evalLin, uniqSorted, MINUS,
} from './math.js';

// ---------- Azar ----------
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mkR = (rng) => ({
  int: (a, b) => a + Math.floor(rng() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(rng() * arr.length)],
  chance: (p) => rng() < p,
  nz: (a, b) => { let v = 0; while (v === 0) v = a + Math.floor(rng() * (b - a + 1)); return v; },
  shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  weighted: (pairs) => { const t = pairs.reduce((s, p) => s + p[1], 0); let x = rng() * t; for (const [v, w] of pairs) { if ((x -= w) < 0) return v; } return pairs[0][0]; },
});

// ---------- Textos de retroalimentación ----------
const plain = (v) => fmtNum(v).replace(/⟦(\d+)\/(\d+)⟧/g, '$1/$2');
const fbMove = (b) => (Q.of(b).sign > 0
  ? `El ${plain(Q.of(b).abs())} estaba sumando: pasa restando.`
  : `El ${plain(Q.of(b).abs())} estaba restando: pasa sumando.`);
const FB = {
  twoCases: 'El valor absoluto genera dos casos.',
  missingPos: 'Falta el caso positivo.',
  insideSigns: 'Quitar las barras no cambia los signos de adentro.',
  negateAll: 'Al negar, cambian todos los signos.',
  neverNeg: 'Un valor absoluto nunca es negativo.',
  posOk: 'Un valor absoluto sí puede ser un número positivo.',
  zeroOk: 'Si |A| = 0, entonces A = 0.',
  divideAll: 'Si divides, divide todos los términos.',
  divideNotSub: 'El coeficiente multiplica a x: pasa dividiendo.',
  divideNotMul: 'Pasa dividiendo, no multiplicando.',
  signPos: 'Dividir entre un positivo no cambia el signo.',
  signNeg: 'Al dividir entre un negativo, el signo cambia.',
  arith: 'Revisa los signos al operar.',
  isolateFirst: 'Primero aísla |A|; después abre los dos casos.',
  missingSol: 'Te faltó una solución.',
  signsSol: 'Revisa los signos de las soluciones.',
  hasSol: 'Sí hay soluciones: míralas en la línea anterior.',
  emptyIsEmpty: 'Sin solución significa conjunto vacío.',
  sameCase: 'Ese caso repite el primero.',
  negateB: 'El signo menos afecta a todo el otro lado.',
  condSide: 'La condición es sobre el lado sin barras.',
  condSolve: 'Revisa el despeje de la condición.',
  condDir: 'Al dividir entre un positivo, ≥ no cambia.',
};
const HINT = {
  split: 'Si |A| = k con k > 0: A = k o A = −k.',
  negative: '¿Puede un valor absoluto ser negativo?',
  zero: 'Solo |0| vale 0: si |A| = 0, entonces A = 0.',
  collect: 'Agrupa las x en un lado y los números en el otro.',
  transpose: 'Deja sola la x: mueve el número al otro lado.',
  divide: 'Quita el coeficiente de x dividiendo.',
  isolate: 'Antes de abrir casos, deja solo el valor absoluto.',
  final: 'Escribe el conjunto solución (C.S.) con todas las soluciones válidas.',
  splitAB: '|A| = |B| significa A = B o A = −B.',
  splitAL: 'Con la condición, |A| = B da A = B o A = −B.',
  cond: 'El lado sin barras debe ser ≥ 0.',
  checkCond: 'Descarta lo que no cumple la condición.',
};

// ---------- Constructor de pasos ----------
function makeStep(R, correct, cands, { hint, tool, fallback = [], maxD = 3 } = {}) {
  const ck = lineKey(correct);
  const seen = new Set([lineText(correct)]);
  const ok = (c) => {
    const t = lineText(c.line);
    if (seen.has(t)) return false;
    let k;
    try { k = lineKey(c.line); } catch { return false; }
    if (k === ck || k === 'ALL') return false; // equivalente: no sería un error real
    seen.add(t); return true;
  };
  const picked = [];
  for (const c of R.shuffle(cands)) { if (picked.length >= maxD) break; if (ok(c)) picked.push(c); }
  for (const c of fallback) { if (picked.length >= 2) break; if (ok(c)) picked.push(c); }
  const options = R.shuffle([{ line: correct, correct: true }, ...picked.map((c) => ({ line: c.line, correct: false, fb: c.fb }))]);
  return { line: correct, options, hint, tool };
}

// ---------- Resolución lineal (caso por caso) ----------
function nextLinear(e) {
  const { L, R } = e;
  if (!R.a.isZero) {
    const nL = lin(L.a.sub(R.a)), nR = lin(0, R.b.sub(L.b));
    const errs = {};
    const wrongA = L.a.add(R.a);
    if (!wrongA.isZero) errs.xsign = { e: eq(lin(wrongA), nR), fb: R.a.sign > 0 ? 'El término con x estaba sumando: pasa restando.' : 'El término con x estaba restando: pasa sumando.' };
    if (!L.b.isZero) errs.bsign = { e: eq(nL, lin(0, R.b.add(L.b))), fb: fbMove(L.b) };
    return { kind: 'collect', next: eq(nL, nR), errs };
  }
  if (!L.b.isZero) {
    const v = R.b.sub(L.b);
    const errs = { bsign: { e: eq(lin(L.a), lin(0, R.b.add(L.b))), fb: fbMove(L.b) } };
    if (!v.neg().eq(v)) errs.arith = { e: eq(lin(L.a), lin(0, v.neg())), fb: FB.arith };
    errs.drop = { e: eq(lin(L.a), lin(0, R.b)), fb: 'El número no desaparece: pasa al otro lado.' };
    if (!L.a.abs().eq(1)) errs.divone = { e: eq(lin(1, L.b), lin(0, R.b.div(L.a))), fb: FB.divideAll };
    return { kind: 'transpose', next: eq(lin(L.a), lin(0, v)), errs };
  }
  if (!L.a.eq(1)) {
    const v = R.b.div(L.a);
    const errs = {};
    if (!v.isZero) errs.sign = { e: eq(lin(1), lin(0, v.neg())), fb: L.a.sign > 0 ? FB.signPos : FB.signNeg };
    if (!L.a.abs().eq(1)) {
      errs.sub = { e: eq(lin(1), lin(0, R.b.sub(L.a))), fb: FB.divideNotSub };
      errs.mul = { e: eq(lin(1), lin(0, R.b.mul(L.a))), fb: FB.divideNotMul };
      if (!R.b.isZero) errs.inv = { e: eq(lin(1), lin(0, L.a.div(R.b))), fb: 'Divide el número entre el coeficiente, no al revés.' };
      else errs.coef = { e: eq(lin(1), lin(0, L.a)), fb: `Si ${plain(L.a)}x = 0, entonces x = 0.` };
    }
    return { kind: 'divide', next: eq(lin(1), lin(0, v)), errs };
  }
  return null;
}

function linearChain(R, cases) {
  const steps = [];
  let cur = cases;
  for (let guard = 0; guard < 6; guard++) {
    const nx = cur.map(nextLinear);
    if (nx.every((n) => !n)) break;
    const nextCases = cur.map((c, i) => (nx[i] ? nx[i].next : c));
    const cands = [];
    const types = new Set(nx.flatMap((n) => (n ? Object.keys(n.errs) : [])));
    for (const t of types) {
      let fb = null;
      const all = nextCases.map((c, i) => { const er = nx[i]?.errs[t]; if (er) { fb ??= er.fb; return er.e; } return c; });
      cands.push({ line: eqsLine(...all), fb });
      if (cur.length > 1) nx.forEach((n, i) => {
        const er = n?.errs[t]; if (!er) return;
        const one = nextCases.map((c, j) => (j === i ? er.e : c));
        cands.push({ line: eqsLine(...one), fb: er.fb });
      });
    }
    const kind = nx.find(Boolean).kind;
    steps.push(makeStep(R, eqsLine(...nextCases), cands, { hint: HINT[kind] }));
    cur = nextCases;
  }
  return { steps, finals: cur };
}

// ---------- Casos del valor absoluto ----------
const negLin = (B) => lin(B.a.neg(), B.b.neg());
const insideAbs = (A) => lin(A.a.abs(), A.b.abs(), A.order);

// |A| = k (k constante). Devuelve pasos y soluciones.
function splitConst(R, A, k, extraCands = []) {
  k = Q.of(k);
  const K = lin(0, k), NK = lin(0, k.neg());
  if (k.sign < 0) {
    const cands = [
      { line: eqsLine(eq(A, K), eq(A, NK)), fb: FB.neverNeg },
      { line: eqsLine(eq(A, NK)), fb: 'No quites el signo: |A| no puede valer ' + plain(k) + '.' },
      { line: eqsLine(eq(A, K)), fb: 'Un valor absoluto nunca es negativo.' },
    ];
    const steps = [makeStep(R, noneLine(`|${fmtLin(A)}| nunca es negativo`), cands, { hint: HINT.negative, tool: 'number' })];
    steps.push(makeStep(R, setLine([]), [
      { line: setLine([q(0)]), fb: FB.emptyIsEmpty },
      { line: setLine(solveBoth(A, k.neg())), fb: FB.neverNeg },
      { line: setLine(solveBoth(A, k).slice(0, 1)), fb: FB.emptyIsEmpty },
    ], { hint: HINT.final }));
    return { steps, sol: [] };
  }
  if (k.isZero) {
    const cands = [
      { line: noneLine(), fb: FB.zeroOk },
      { line: eqsLine(eq(insideAbs(A), K)), fb: FB.insideSigns },
      { line: eqsLine(eq(A, lin(0, 1)), eq(A, lin(0, -1))), fb: FB.zeroOk },
    ];
    const s1 = makeStep(R, eqsLine(eq(A, K)), cands, { hint: HINT.zero });
    const ch = linearChain(R, [eq(A, K)]);
    const sol = uniqSorted(ch.finals.map((f) => f.R.b));
    return { steps: [s1, ...ch.steps, finalStep(R, sol)], sol };
  }
  const cands = [
    { line: eqsLine(eq(A, K)), fb: FB.twoCases },
    { line: eqsLine(eq(A, NK)), fb: FB.missingPos },
    { line: eqsLine(eq(insideAbs(A), K), eq(insideAbs(A), NK)), fb: FB.insideSigns },
    { line: noneLine(), fb: FB.posOk },
    ...extraCands,
  ];
  if (!A.b.isZero && !A.a.isZero) cands.push({ line: eqsLine(eq(A, K), eq(lin(A.a.neg(), A.b), K)), fb: FB.negateAll });
  const s1 = makeStep(R, eqsLine(eq(A, K), eq(A, NK)), cands, { hint: HINT.split, tool: 'pm' });
  const ch = linearChain(R, [eq(A, K), eq(A, NK)]);
  const sol = uniqSorted(ch.finals.map((f) => f.R.b));
  return { steps: [s1, ...ch.steps, finalStep(R, sol)], sol };
}
function solveBoth(A, k) { return uniqSorted([k.sub(A.b).div(A.a), k.neg().sub(A.b).div(A.a)]); }

function finalStep(R, vals, extra = []) {
  const cands = [...extra];
  if (vals.length === 2) vals.forEach((v) => cands.push({ line: setLine([v]), fb: FB.missingSol }));
  if (vals.length) {
    cands.push({ line: setLine(vals.map((v) => v.neg())), fb: FB.signsSol });
    cands.push({ line: setLine([]), fb: FB.hasSol });
    if (vals.length === 1) cands.push({ line: setLine([vals[0], vals[0].neg()]), fb: 'Solo hay una solución.' });
  }
  const fallback = [{ line: setLine([vals[0] ? vals[0].add(1) : q(1)]), fb: FB.signsSol }];
  return makeStep(R, setLine(vals), cands, { hint: HINT.final, fallback });
}

// ---------- Elección de números amables ----------
function pickAbsLinear(R, { aSet, xRange = 8, kMax = 16, frac = false, order }) {
  for (let t = 0; t < 400; t++) {
    const a = R.pick(aSet);
    const x1 = R.int(-xRange, xRange);
    const b = R.int(-9, 9);
    const k = a * x1 + b;
    if (k < 1 || k > kMax) continue;
    const x2 = new Q(-k - b, a);
    if (x2.eq(x1)) continue;
    if (!frac && !x2.isInt) continue;
    if (frac && (x2.isInt || x2.d > 4)) continue;
    if (Math.abs(x2.value) > 14) continue;
    return { A: lin(a, b, order), k: q(k) };
  }
  return { A: lin(1, 2), k: q(5) };
}

// ---------- Generadores por nivel ----------
function statementLine(L, Rr) { return eqsLine(eq(L, Rr)); }

function genFacil(R) {
  const t = R.weighted([['x', 25], ['xb', 75]]);
  const kind = R.weighted([['pos', 84], ['neg', 12], ['zero', 4]]);
  const A = t === 'x' ? lin(1) : lin(1, R.nz(-9, 9));
  let k;
  if (kind === 'neg') k = q(-R.int(1, 9));
  else if (kind === 'zero') k = q(0);
  else k = q(R.int(1, 12));
  const st = statementLine(absT(A), lin(0, k));
  const body = splitConst(R, A, k);
  return { type: t === 'x' ? '|x| = k' : '|x + b| = c', statement: st, steps: body.steps, solution: body.sol };
}

function genMedio(R) {
  const kind = R.weighted([['pos', 82], ['neg', 13], ['zero', 5]]);
  const style = R.weighted([['std', 70], ['neg', 15], ['cf', 15]]);
  let A, k;
  if (kind === 'pos') {
    const aSet = style === 'std' ? [2, 3, 4, 5] : [-2, -3, -4];
    ({ A, k } = pickAbsLinear(R, { aSet, frac: R.chance(0.25), order: style === 'cf' ? 'cf' : undefined }));
  } else {
    const a = R.pick(style === 'std' ? [2, 3, 4, 5] : [-2, -3]);
    let b = R.nz(-9, 9);
    if (kind === 'zero') b = a * R.nz(-6, 6);
    A = lin(a, b, style === 'cf' ? 'cf' : undefined);
    k = kind === 'neg' ? q(-R.int(1, 12)) : q(0);
  }
  const st = statementLine(absT(A), lin(0, k));
  const body = splitConst(R, A, k);
  return { type: '|ax + b| = c', statement: st, steps: body.steps, solution: body.sol };
}

// p|A| + q = r
function genIsolate(R) {
  const kind = R.weighted([['pos', 80], ['neg', 15], ['zero', 5]]);
  const p = R.weighted([[1, 15], [2, 30], [3, 25], [4, 10], [-2, 12], [-3, 8]]);
  const qq = p === 1 ? R.nz(-9, 9) : R.weighted([[0, 15], [1, 85]]) ? R.nz(-9, 9) : 0;
  let A, k;
  if (kind === 'pos') ({ A, k } = pickAbsLinear(R, { aSet: [1, 2, 3], kMax: 10, frac: R.chance(0.15) }));
  else { const a = R.pick([1, 2, 3]); A = lin(a, kind === 'zero' ? a * R.nz(-5, 5) : R.nz(-9, 9)); k = kind === 'neg' ? q(-R.int(1, 6)) : q(0); }
  const r = k.mul(p).add(qq);
  const Lside = absT(A, p, qq);
  const st = statementLine(Lside, lin(0, r));
  const steps = [];
  const isoA = (pp, rr) => eqsLine(eq(absT(A, pp, 0), lin(0, rr)));
  let curR = r;
  if (qq !== 0) {
    const moved = r.sub(qq);
    const cands = [
      { line: isoA(p, r.add(qq)), fb: fbMove(qq) },
      { line: isoA(p, r), fb: 'El número no desaparece: pasa al otro lado.' },
      { line: eqsLine(eq(lin(A.a.mul(p), A.b.mul(p).add(qq)), lin(0, r))), fb: FB.isolateFirst },
    ];
    if (p !== 1) cands.push({ line: eqsLine(eq(absT(A, 1, qq), lin(0, r.div(p)))), fb: FB.divideAll });
    steps.push(makeStep(R, isoA(p, moved), cands, { hint: HINT.isolate }));
    curR = moved;
  }
  if (p !== 1) {
    const kk = curR.div(p);
    const cands = [
      { line: isoA(1, curR.sub(p)), fb: FB.divideNotSub },
      { line: isoA(1, curR.mul(p)), fb: FB.divideNotMul },
      { line: eqsLine(eq(A, lin(0, kk))), fb: FB.isolateFirst },
    ];
    if (!kk.isZero) cands.push({ line: isoA(1, kk.neg()), fb: p > 0 ? FB.signPos : FB.signNeg });
    else cands.push({ line: isoA(1, q(p)), fb: `Si ${p}·|A| = 0, entonces |A| = 0.` });
    steps.push(makeStep(R, isoA(1, kk), cands, { hint: HINT.isolate }));
  }
  const body = splitConst(R, A, k);
  return { type: 'p|A| + q = r', statement: st, steps: [...steps, ...body.steps], solution: body.sol };
}

// |A| = |B|
function genAbsAbs(R) {
  for (let t = 0; t < 500; t++) {
    const a = R.pick([1, 2, 3, 4]), c = R.pick([1, 2, 3]);
    if (a === c) continue;
    const b = R.int(-9, 9), d = R.int(-9, 9);
    if (b === 0 && d === 0) continue;
    const x1 = new Q(d - b, a - c), x2 = new Q(-d - b, a + c);
    if (!x1.isInt || !x2.isInt || x1.eq(x2)) continue;
    if (Math.abs(x1.value) > 12 || Math.abs(x2.value) > 12) continue;
    const A = lin(a, b), B = lin(c, d);
    const st = statementLine(absT(A), absT(B));
    const NB = negLin(B);
    const cands = [
      { line: eqsLine(eq(A, B)), fb: 'Hay dos casos: A = B o A = −B.' },
      { line: eqsLine(eq(A, B), eq(negLin(A), NB)), fb: FB.sameCase },
      { line: eqsLine(eq(insideAbs(A), insideAbs(B)), eq(insideAbs(A), negLin(insideAbs(B)))), fb: FB.insideSigns },
    ];
    if (d !== 0) cands.push({ line: eqsLine(eq(A, B), eq(A, lin(-c, d))), fb: FB.negateB });
    const s1 = makeStep(R, eqsLine(eq(A, B), eq(A, NB)), cands, { hint: HINT.splitAB, tool: 'pm' });
    const ch = linearChain(R, [eq(A, B), eq(A, NB)]);
    const sol = uniqSorted(ch.finals.map((f) => f.R.b));
    return { type: '|A| = |B|', statement: st, steps: [s1, ...ch.steps, finalStep(R, sol)], solution: sol };
  }
  return null;
}

// |A| = cx + d (lado derecho con x: hay condición)
function genAbsLin(R) {
  for (let t = 0; t < 800; t++) {
    const a = R.pick([1, 2, 3]), c = R.pick([1, 2]);
    if (a === c) continue;
    const b = R.int(-9, 9), d = R.int(-8, 8);
    const x1 = new Q(d - b, a - c), x2 = new Q(-d - b, a + c);
    if (!x1.isInt || !x2.isInt || x1.eq(x2)) continue;
    if (Math.abs(x1.value) > 12 || Math.abs(x2.value) > 12) continue;
    const B = lin(c, d);
    const valid = (x) => evalLin(B, x).sign >= 0;
    const nValid = [x1, x2].filter(valid).length;
    if (nValid === 0) continue;
    if (nValid === 2 && R.chance(0.7)) continue; // preferimos que haya una extraña
    const m = new Q(-d, c);
    if (!m.isInt) continue;
    const A = lin(a, b);
    const st = statementLine(absT(A), B);
    const steps = [];
    steps.push(makeStep(R, condLine(B, '≥', m), [
      { line: condLine(A, '≥', new Q(-b, a)), fb: FB.condSide },
      { line: condLine(B, '≥', m.neg()), fb: FB.condSolve },
      { line: condLine(B, '≤', m), fb: FB.condDir },
    ], { hint: HINT.cond }));
    const NB = negLin(B);
    const cands = [
      { line: eqsLine(eq(A, B)), fb: 'Hay dos casos: A = B o A = −B.' },
      { line: eqsLine(eq(A, B), eq(negLin(A), NB)), fb: FB.sameCase },
    ];
    if (d !== 0) cands.push({ line: eqsLine(eq(A, B), eq(A, lin(-c, d))), fb: FB.negateB });
    if (b !== 0) cands.push({ line: eqsLine(eq(insideAbs(A), B), eq(insideAbs(A), NB)), fb: FB.insideSigns });
    steps.push(makeStep(R, eqsLine(eq(A, B), eq(A, NB)), cands, { hint: HINT.splitAL, tool: 'pm' }));
    const ch = linearChain(R, [eq(A, B), eq(A, NB)]);
    steps.push(...ch.steps);
    const cand = uniqSorted([x1, x2]);
    const sol = cand.filter(valid);
    const rejected = cand.filter((x) => !valid(x));
    const extra = rejected.length ? [{ line: setLine(cand), fb: `x = ${plain(rejected[0])} no cumple x ≥ ${plain(m)}.` }] : [];
    if (rejected.length) extra.push({ line: setLine(rejected), fb: `Revisa la condición x ≥ ${plain(m)}.` });
    const fs = finalStep(R, sol, extra);
    fs.hint = HINT.checkCond;
    fs.rejected = rejected.map((x) => ({ x, why: `x ${'<'} ${fmtNum(m)}` }));
    fs.cond = m;
    steps.push(fs);
    return { type: '|A| = cx + d', statement: st, steps, solution: sol, rejected: fs.rejected };
  }
  return null;
}

function genAlto(R) {
  const t = R.weighted([['iso', 45], ['ab', 30], ['al', 25]]);
  if (t === 'ab') return genAbsAbs(R) || genIsolate(R);
  if (t === 'al') return genAbsLin(R) || genIsolate(R);
  return genIsolate(R);
}

// ---------- Desde 0: primeros ejercicios, de menos a más ----------
export const DESDE0_STAGES = ['|k|', '|−k|', '|x| = k', '|x − c| = k', '|x| = −k'];
function genDesde0(R, stage) {
  const k = R.int(2, 7);
  if (stage === 0 || stage === 1) {
    const v = stage === 0 ? k : -k;
    const lab = `|${fmtNum(v)}|`;
    const st = rawLine(`${lab} = ?`);
    const cands = [
      { line: rawLine(`${lab} = ${fmtNum(-Math.abs(v))}`), fb: 'El valor absoluto nunca es negativo.' },
      { line: rawLine(`${lab} = 0`), fb: 'Solo |0| vale 0.' },
    ];
    if (stage === 0) cands.push({ line: rawLine(`${lab} = ${k * 2}`), fb: 'El número no cambia: solo se quita el signo, si lo tiene.' });
    else cands.push({ line: rawLine(`${lab} = ${k + 1}`), fb: 'El número no cambia: solo se quita el signo.' });
    const step = makeStep(R, rawLine(`${lab} = ${k}`), cands, { hint: 'El valor absoluto de un número es ese número sin su signo: nunca es negativo.' });
    return { type: 'valor absoluto', statement: st, steps: [step], solution: null };
  }
  if (stage === 2) {
    const A = lin(1);
    const body = splitConst(R, A, q(k));
    return { type: '|x| = k', statement: statementLine(absT(A), lin(0, k)), steps: body.steps, solution: body.sol };
  }
  if (stage === 3) {
    let c = R.nz(-3, 3), kk = R.int(2, 4);
    const A = lin(1, -c);
    const body = splitConst(R, A, q(kk));
    return { type: '|x − c| = k', statement: statementLine(absT(A), lin(0, kk)), steps: body.steps, solution: body.sol };
  }
  const A = lin(1);
  const body = splitConst(R, A, q(-k));
  return { type: '|x| = −k', statement: statementLine(absT(A), lin(0, -k)), steps: body.steps, solution: body.sol };
}

// ---------- API ----------
let uid = 0;
export function generate(level, { rng = Math.random, recent = new Set(), stage = 0 } = {}) {
  const R = mkR(rng);
  for (let t = 0; t < 40; t++) {
    let ex;
    if (level === 'desde0') ex = genDesde0(R, stage % DESDE0_STAGES.length);
    else if (level === 'facil') ex = genFacil(R);
    else if (level === 'medio') ex = genMedio(R);
    else ex = genAlto(R);
    const key = lineText(ex.statement);
    if (recent.has(key) && t < 39) continue;
    ex.id = ++uid; ex.level = level; ex.key = key;
    ex.checks = buildChecks(ex);
    return ex;
  }
}

// Comprobación por sustitución de cada solución en el enunciado.
function substLin(e, v) {
  const vs = fmtNum(v);
  const par = (v.sign < 0 || !v.isInt) && !e.b.isZero ? `(${vs})` : vs;
  let xs;
  if (e.a.eq(1)) xs = par; else if (e.a.eq(-1)) xs = `${MINUS}(${vs})`; else xs = `${fmtNum(e.a)}(${vs})`;
  if (e.b.isZero) return xs;
  if (e.order === 'cf') return `${fmtNum(e.b)} ${e.a.sign < 0 ? MINUS : '+'} ${e.a.abs().eq(1) ? par : fmtNum(e.a.abs()) + `(${vs})`}`;
  return `${xs} ${e.b.sign < 0 ? MINUS : '+'} ${fmtNum(e.b.abs())}`;
}
export function substSide(s, v) {
  if (s.k === 'lin') return s.a.isZero ? null : substLin(s, v);
  let out = s.p.eq(1) ? '' : s.p.eq(-1) ? MINUS : fmtNum(s.p);
  out += `|${substLin(s.A, v)}|`;
  if (!s.q.isZero) out += ` ${s.q.sign < 0 ? MINUS : '+'} ${fmtNum(s.q.abs())}`;
  return out;
}
function buildChecks(ex) {
  if (!ex.solution || ex.statement.kind !== 'eqs') return [];
  const e = ex.statement.cases[0];
  return ex.solution.map((v) => {
    const l = substSide(e.L, v), r = substSide(e.R, v);
    const lv = evalSide(e.L, v), rv = evalSide(e.R, v);
    const parts = [`${l} = ${fmtNum(lv)}`]; if (r) parts.push(`${r} = ${fmtNum(rv)}`);
    return { x: v, parts, text: parts.join('  y  '), ok: lv.eq(rv) };
  });
}

export { solveEq };
