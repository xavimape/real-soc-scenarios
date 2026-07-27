/**
 * Mide el contraste del globo contra el fondo de cada tema y propone un verde
 * que cumpla el mínimo, tema por tema.
 *
 * ── Por qué medir y no mirar ───────────────────────────────────────────────
 * Revisar catorce temas a ojo tiene dos problemas: la percepción se adapta al
 * contexto —el mismo verde parece distinto según qué tema se vio antes— y el
 * resultado no es reproducible, así que dentro de tres temas nuevos hay que
 * volver a mirar los catorce. Acá el criterio es un número y el que lo corre
 * obtiene lo mismo siempre.
 *
 * El umbral es 3:1, el que WCAG 1.4.11 pide para componentes gráficos no
 * textuales. No es texto, pero los puntos del globo tienen que distinguirse del
 * fondo para que la pieza signifique algo.
 *
 *   node tools/contraste-globo.mjs           # informe
 *   node tools/contraste-globo.mjs --css     # bloques CSS listos para pegar
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const TEMAS_CSS = 'src/styles/themes.css';
const MINIMO = 3;

/**
 * Las transparencias con las que el componente pinta de verdad.
 *
 * La primera versión de este script medía el color puro y daba los catorce
 * temas en verde, con un mínimo de 6:1 — mientras el globo se veía apagado en
 * la pantalla. El error era medir lo que no se dibuja: los puntos se pintan con
 * `globalAlpha` variable según la profundidad, y el del borde de la esfera va
 * al valor más bajo. Un verde con 6:1 de contraste, compuesto al 15% sobre
 * blanco, queda en 1,2:1.
 *
 * Lo que importa es el color **compuesto**, y el peor caso es el punto del
 * borde. Los valores tienen que seguir a los de `Globe.jsx`.
 */
const ALFA = {
  puntoBorde: 0.75, // el mínimo del degradado por profundidad
  puntoCentro: 1.0,
  grilla: 0.45, // proporción de --globe-grid sobre --globe-dot
};

/** Composición de un color con transparencia sobre un fondo opaco. */
const componer = (fg, bg, alfa) =>
  fg.map((v, i) => Math.round(alfa * v + (1 - alfa) * bg[i]));

/** Verde de terminal: el punto de partida de la identidad de la pieza. */
const VERDE = { h: 142, s: 1 };

// ── Color ──────────────────────────────────────────────────────────────────

const aRgb = (hex) => {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** Luminancia relativa según WCAG 2.x. */
function luminancia([r, g, b]) {
  const canal = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [alto, bajo] = la > lb ? [la, lb] : [lb, la];
  return (alto + 0.05) / (bajo + 0.05);
}

/** HSL a RGB, con saturación y tono fijos: solo se mueve la luminosidad. */
function verdeCon(luz) {
  const { h, s } = VERDE;
  const c = (1 - Math.abs(2 * luz - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = luz - c / 2;
  const [r, g, b] = h < 120 ? [x, c, 0] : [0, c, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

const aHex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/**
 * Busca la luminosidad que da el mejor contraste contra este fondo,
 * manteniendo el tono verde. Se recorre en pasos de 1%: no hace falta más
 * precisión y así el resultado es determinístico.
 */
function mejorVerde(fondo, minimo) {
  let elegido = null;

  for (let luz = 0.05; luz <= 0.95; luz += 0.01) {
    const rgb = verdeCon(luz);
    // Se evalúa el peor caso real: el punto del borde de la esfera, compuesto
    // sobre el fondo del tema. Si ese se ve, todo el resto también.
    const c = contraste(componer(rgb, fondo, ALFA.puntoBorde), fondo);
    if (c < minimo) continue;

    // Entre todos los que cumplen se prefiere el más saturado visualmente, que
    // es el más cercano al 50% de luminosidad — el verde más "verde".
    const distancia = Math.abs(luz - 0.5);
    if (!elegido || distancia < elegido.distancia) {
      elegido = { luz, rgb, contraste: c, distancia };
    }
  }

  return elegido;
}

// ── Lectura de los temas ───────────────────────────────────────────────────

const css = await readFile(TEMAS_CSS, 'utf8');
const bloques = [...css.matchAll(/:root\[data-theme='([\w-]+)'\]\s*\{([^}]*)\}/g)];

const temas = new Map();

for (const [, nombre, cuerpo] of bloques) {
  const leer = (prop) => cuerpo.match(new RegExp(`--${prop}:\\s*(#[0-9a-f]{3,8})`, 'i'))?.[1];
  const previo = temas.get(nombre) ?? {};

  temas.set(nombre, {
    bg: leer('bg') ?? previo.bg,
    text: leer('text') ?? previo.text,
    esquema: cuerpo.match(/color-scheme:\s*(\w+)/)?.[1] ?? previo.esquema,
  });
}

// El tema por defecto vive en `:root` a secas.
const raiz = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
if (!temas.has('light')) {
  temas.set('light', {
    bg: raiz.match(/--bg:\s*(#[0-9a-f]{3,6})/i)?.[1],
    esquema: 'light',
  });
}

if (temas.size === 0) {
  console.error(`No se encontró ningún tema en ${TEMAS_CSS}.`);
  process.exit(1);
}

// ── Informe ────────────────────────────────────────────────────────────────

const ACTUAL = { light: '#0b6b2c', dark: '#00e03a' };

// Estos dos no se tocan y el motivo no es estético: ver el comentario en
// themes.css. Se listan igual para que el informe no dé la impresión de
// haberlos pasado por alto.
const INTOCABLES = ['high-contrast', 'monochrome'];

const filas = [];

for (const [nombre, tema] of [...temas].sort()) {
  if (!tema.bg) continue;

  const fondo = aRgb(tema.bg);
  const actual = aRgb(tema.esquema === 'dark' ? ACTUAL.dark : ACTUAL.light);
  const c = contraste(componer(actual, fondo, ALFA.puntoBorde), fondo);
  const propuesta = mejorVerde(fondo, MINIMO + 0.5);

  filas.push({
    nombre,
    esquema: tema.esquema ?? '?',
    bg: tema.bg,
    actual: c,
    propuesto: propuesta ? aHex(propuesta.rgb) : null,
    contrastePropuesto: propuesta?.contraste ?? 0,
    intocable: INTOCABLES.includes(nombre),
  });
}

if (process.argv.includes('--css')) {
  for (const f of filas) {
    if (f.intocable || !f.propuesto) continue;
    console.log(`:root[data-theme='${f.nombre}'] {`);
    console.log(`  --globe-dot: ${f.propuesto};`);
    console.log(`}`);
  }
  process.exit(0);
}

console.log(`\nContraste del globo contra el fondo · mínimo ${MINIMO}:1 (WCAG 1.4.11)\n`);
console.log('tema             esquema  fondo     actual   propuesto');
console.log('─'.repeat(62));

let bajos = 0;

for (const f of filas) {
  const marca = f.intocable ? ' (fijo)' : f.actual < MINIMO ? '  BAJO' : '';
  if (!f.intocable && f.actual < MINIMO) bajos += 1;

  console.log(
    `${f.nombre.padEnd(16)} ${f.esquema.padEnd(8)} ${f.bg.padEnd(9)} ` +
      `${f.actual.toFixed(2).padStart(5)}:1  ${
        f.propuesto ? `${f.propuesto} ${f.contrastePropuesto.toFixed(2)}:1` : '—'
      }${marca}`
  );
}

console.log(`\n${bajos} tema(s) por debajo del mínimo.`);
console.log('Para los bloques CSS: node tools/contraste-globo.mjs --css\n');

process.exit(bajos > 0 ? 1 : 0);
