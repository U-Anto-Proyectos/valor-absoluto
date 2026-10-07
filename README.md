# Valor Absoluto

Experiencia web interactiva para aprender a resolver **ecuaciones con valor absoluto** construyendo la solución línea por línea.

**Diseño (fuente visual):** [Figma — Valor Absoluto — UI](https://www.figma.com/design/Y8toeZDMx6RupwhgtQ66oy)

## Cómo funciona

1. Eliges un nivel: **Desde 0 · Fácil · Medio · Alto**.
2. Aparece una ecuación. Debajo, varias líneas candidatas al siguiente paso.
3. Tocas la línea correcta: viaja a la hoja y aparecen nuevas opciones.
4. Si te equivocas, recibes una frase breve y específica (y un “¿Por qué?” que sustituye una solución para mostrar qué se perdió). Puedes intentar de nuevo.
5. Al terminar: celebración breve, comprobación por sustitución y **Otro ejercicio**.

Cada distractor es un **error real**: olvidar el caso negativo, trasponer sin cambiar el signo, dividir solo un término, quitar las barras antes de aislar, dividir entre negativo sin cambiar el signo, no revisar la condición, confundir `|A| = −k` con una ecuación con solución, etc.

## Niveles

| Nivel | Contenido |
|---|---|
| Desde 0 | Primeros pasos: `|5|`, `|−5|`, `|x| = k`, `|x − c| = k`, `|x| = −k` |
| Fácil | `|x| = a`, `|x ± b| = c` (incluye casos sin solución y `= 0`) |
| Medio | `|ax + b| = c`, coeficientes negativos, soluciones fraccionarias, sin solución |
| Alto | `a|bx + c| + d = e`, `|A| = |B|`, `|A| = cx + d` (con condición y descarte) |

## Generador

`assets/js/generator.js` crea ejercicios al azar con aritmética racional exacta (`q.js`). Conoce cada paso correcto antes de mostrarlo y descarta cualquier distractor que resulte **equivalente** a la línea correcta, para no marcar como error un paso válido.

Verificación masiva (sin dependencias):

```bash
node tests/generator.test.mjs 4000
```

Comprueba, por nivel, que la solución declarada coincide con la resolución exacta, que cada paso tiene una sola opción correcta y al menos tres opciones, que ningún distractor es equivalente y que ninguna línea pierde soluciones.

## Estructura

```
index.html
assets/css/styles.css
assets/js/app.js         interfaz, animaciones, gamificación
assets/js/generator.js   ejercicios, pasos, distractores y retroalimentación
assets/js/math.js        expresiones, formato y resolución exacta
assets/js/q.js           números racionales
assets/js/render.js      marcado matemático → HTML
assets/js/art.js         Brote, paisaje e íconos (SVG originales)
tests/generator.test.mjs
```

Sitio estático sin compilación: funciona directamente en **GitHub Pages** (Settings → Pages → Deploy from a branch → `main` / root). Enlaces directos por nivel: `…/#desde0`, `#facil`, `#medio`, `#alto`.

El progreso (XP, estrellas, paisaje desbloqueado) se guarda en el navegador si este lo permite; si no, la página funciona igual durante la sesión.
