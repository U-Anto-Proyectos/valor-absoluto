// Verificación masiva del generador: node tests/generator.test.mjs
import { generate, mulberry32, DESDE0_STAGES } from '../assets/js/generator.js';
import { solveLine, lineKey, lineText } from '../assets/js/math.js';

const N = Number(process.argv[2] || 4000);
const levels = ['desde0', 'facil', 'medio', 'alto'];
let fails = 0;
const fail = (msg, ex) => { fails++; if (fails < 400) console.log('FALLO:', msg, ex ? '\n  ' + ex.key + '\n  ' + ex.steps.map((s) => lineText(s.line)).join('\n  ') : ''); };

for (const level of levels) {
  const rng = mulberry32(12345 + level.length);
  const uniq = new Set(); const types = {}; let steps = 0, opts = 0, maxAbs = 0, fracs = 0;
  for (let i = 0; i < N; i++) {
    const ex = generate(level, { rng, stage: i });
    uniq.add(ex.key); types[ex.type] = (types[ex.type] || 0) + 1;
    steps += ex.steps.length;
    for (const m of ex.key.matchAll(/\d+/g)) maxAbs = Math.max(maxAbs, Number(m[0]));
    if (ex.key.includes('⟦') || ex.steps.some((s) => lineText(s.line).includes('⟦'))) fracs++;
    // 1) la solución declarada coincide con la resolución exacta del enunciado
    if (ex.statement.kind === 'eqs') {
      const real = solveLine(ex.statement).map((v) => v.key()).join(',');
      const decl = ex.solution.map((v) => v.key()).join(',');
      if (real !== decl) fail(`solución ${decl} ≠ real ${real}`, ex);
      for (const c of ex.checks) if (!c.ok) fail('comprobación falsa', ex);
    }
    for (const s of ex.steps) {
      opts += s.options.length;
      const corr = s.options.filter((o) => o.correct);
      if (corr.length !== 1) fail('no hay exactamente una correcta', ex);
      if (s.options.length < 3) fail(`solo ${s.options.length} opciones en "${lineText(s.line)}"`, ex);
      const texts = s.options.map((o) => lineText(o.line));
      if (new Set(texts).size !== texts.length) fail('opciones repetidas', ex);
      const ck = lineKey(s.line);
      for (const o of s.options) if (!o.correct) {
        if (lineKey(o.line) === ck) fail(`distractor equivalente: ${lineText(o.line)}`, ex);
        if (!o.fb) fail('distractor sin retroalimentación', ex);
      }
      // 2) cada línea correcta conserva las soluciones finales
      if (ex.solution && s.line.kind === 'eqs') {
        const sl = solveLine(s.line).map((v) => v.key());
        for (const v of ex.solution) if (!sl.includes(v.key())) fail(`la línea ${lineText(s.line)} pierde ${v.key()}`, ex);
      }
    }
    const last = ex.steps.at(-1);
    if (ex.solution && last.line.kind !== 'set') fail('no termina en S', ex);
  }
  console.log(`${level.padEnd(7)} únicos ${uniq.size}/${N}  pasos/ej ${(steps / N).toFixed(2)}  opciones/paso ${(opts / steps).toFixed(2)}  máx |n| ${maxAbs}  con fracciones ${fracs}`);
  console.log('         tipos', JSON.stringify(types));
}
console.log(fails ? `\n${fails} fallos` : '\nTodo correcto');
process.exit(fails ? 1 : 0);
