/**
 * Detecta secciones de un caso escritas en un idioma distinto al de su carpeta.
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 * El caso 15 se dio por limpio dos veces y no lo estaba: tenía seis subtítulos y
 * varios párrafos en inglés dentro del archivo español. No lo vio `check-i18n`,
 * porque ese verificador mira el diccionario de la interfaz y el cuerpo de los
 * casos nunca pasa por ahí. Tampoco lo vio nadie leyendo, porque un caso son
 * 2.400 palabras y el ojo se acostumbra.
 *
 * Este script mide sección por sección en vez de archivo por archivo. Un archivo
 * con un tercio en el idioma equivocado puede promediar "bien"; una sección
 * entera en el idioma equivocado no se disimula.
 *
 *   node tools/auditar-idioma-casos.mjs
 *
 * ── Lo que NO puede ver ────────────────────────────────────────────────────
 * Frases sueltas dentro de un párrafo por lo demás correcto, y viñetas cortas
 * mezcladas. Detecta bloques, no palabras. Sale con código 1 si encuentra algo,
 * pero un verde acá no significa "está bien escrito": significa "no hay secciones
 * enteras en el otro idioma".
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const BASE = 'src/content/scenarios';

/** Palabras función: son las que aparecen sí o sí en prosa real y casi nunca en
 *  nomenclatura técnica, que es lo que queremos ignorar. */
const ES = /\b(el|la|los|las|un|una|de|del|que|con|para|por|sin|sobre|desde|hasta|entre|cada|todo|todos|esta|este|más|pero|porque|cuando|donde|como|se|su|sus|no|es|son|está|están|hay|fue|ser|tiene|puede|acá|así)\b/gi;
const EN = /\b(the|a|an|of|to|in|for|with|from|that|this|these|those|and|or|but|because|when|where|as|is|are|was|were|be|been|has|have|had|it|its|they|their|not|on|at|by|so|which|what)\b/gi;

/** Marcas que solo existen en español y valen doble: no hay ambigüedad. */
const ACENTOS = /[áéíóúñ¿¡]/gi;

const contar = (texto, re) => (texto.match(re) || []).length;

/**
 * Limpia lo que por diseño no se traduce (D-013): bloques de código, props de
 * componentes, tablas de técnicas MITRE y enlaces de referencias. Medir sobre
 * eso daría inglés en todos lados y el informe sería inútil.
 */
function soloProsa(md) {
  return md
    .replace(/^---[\s\S]*?^---/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[A-Z][\s\S]*?\/>/g, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^\s*-\s*\[.*\]\(.*\)\s*$/gm, '')
    .replace(/`[^`]*`/g, '');
}

/** Parte el cuerpo en secciones por encabezado, conservando el título. */
function secciones(prosa) {
  const partes = prosa.split(/^(#{2,4}\s.+)$/m);
  const salida = [];

  for (let i = 1; i < partes.length; i += 2) {
    salida.push({ titulo: partes[i].replace(/^#+\s*/, '').trim(), cuerpo: partes[i + 1] ?? '' });
  }

  return salida;
}

const casos = [];

for (const idioma of await readdir(BASE)) {
  let archivos;
  try {
    archivos = await readdir(join(BASE, idioma));
  } catch {
    continue;
  }

  for (const archivo of archivos.filter((f) => f.endsWith('.mdx'))) {
    const md = await readFile(join(BASE, idioma, archivo), 'utf8');
    casos.push({ idioma, archivo, prosa: soloProsa(md) });
  }
}

const problemas = [];
const dudosos = [];

/**
 * Los títulos se miden aparte del cuerpo, y esto no es un refinamiento: es la
 * corrección de un error que dejó pasar todo.
 *
 * La primera versión medía título y cuerpo juntos y descartaba las secciones con
 * menos de seis palabras función, porque una sección corta no da señal
 * estadística. El problema es que las secciones mal escritas de este proyecto son
 * justamente las cortas — un subtítulo en inglés seguido de un bloque de código y
 * tres viñetas. Al quitar el código no quedaba casi nada que medir, así que se
 * descartaban. La herramienta daba verde sobre el archivo que la motivó.
 *
 * Un título es distinto de un párrafo: es corto por naturaleza y aun así tiene
 * que estar en el idioma del archivo. Si un título en un caso español no tiene
 * una sola marca de español y sí tiene palabras inglesas, eso alcanza.
 */
const marcasEs = (t) => contar(t, ES) + contar(t, ACENTOS) * 2;

for (const caso of casos) {
  const esEspanol = caso.idioma === 'es';

  for (const s of secciones(caso.prosa)) {
    const propioTit = esEspanol ? marcasEs(s.titulo) : contar(s.titulo, EN);
    const ajenoTit = esEspanol ? contar(s.titulo, EN) : marcasEs(s.titulo);

    // Un título de varias palabras sin una sola marca del idioma propio es
    // sospechoso aunque tampoco tenga palabras función del otro: "Stage 1:
    // Browser Credential Stealer" no contiene ningún artículo ni preposición de
    // ninguna lista, y sin embargo es inglés. Contar solo palabras función lo
    // dejaba pasar — fue el segundo agujero de esta misma herramienta.
    //
    // Se exige tres palabras para no marcar nomenclatura pura como "OTTERCOOKIE"
    // o "MITRE ATT&CK", que legítimamente no se traducen (D-013).
    const palabras = s.titulo.split(/\s+/).filter(Boolean).length;

    if (propioTit === 0 && ajenoTit > 0) {
      // Prueba: tiene palabras función del otro idioma y ninguna del propio.
      problemas.push({
        caso: `${caso.idioma}/${caso.archivo}`,
        titulo: s.titulo,
        donde: 'título',
      });
      continue;
    }

    if (propioTit === 0 && palabras >= 3) {
      // Solo sospecha. Un título de tres palabras sin ninguna palabra función
      // puede estar perfectamente bien —"7. Mapeo MITRE ATT&CK"— o ser inglés
      // puro —"Stage 1: Browser Credential Stealer"—. Sin más señal no se puede
      // distinguir, así que se informa aparte y no rompe nada.
      //
      // Es la misma decisión que en check-i18n: mezclar lo que se puede probar
      // con lo que solo se puede sugerir convierte el informe en ruido, y un
      // informe ruidoso se deja de leer.
      dudosos.push({ caso: `${caso.idioma}/${caso.archivo}`, titulo: s.titulo });
      continue;
    }

    const propio = esEspanol ? marcasEs(s.cuerpo) : contar(s.cuerpo, EN);
    const ajeno = esEspanol ? contar(s.cuerpo, EN) : marcasEs(s.cuerpo);

    if (propio + ajeno < 4) continue;

    if (ajeno > propio) {
      problemas.push({
        caso: `${caso.idioma}/${caso.archivo}`,
        titulo: s.titulo,
        donde: 'cuerpo',
        propio,
        ajeno,
      });
    }
  }
}

const listar = (items, salida) => {
  let actual = '';
  for (const p of items) {
    if (p.caso !== actual) {
      actual = p.caso;
      salida(`  ${actual}`);
    }
    salida(`     ${p.donde ? `[${p.donde}] ` : ''}"${p.titulo}"`);
  }
  salida('');
};

if (dudosos.length > 0) {
  console.error(`\nAviso: ${dudosos.length} títulos sin marcas del idioma del archivo.`);
  console.error('Puede ser nomenclatura que no se traduce, o texto sin traducir. Mirarlos.\n');
  listar(dudosos, (l) => console.error(l));
}

if (problemas.length === 0) {
  console.log(
    `Idioma coherente: ${casos.length} casos revisados, sin secciones en el idioma equivocado.`
  );
  console.log('Ojo: esto detecta bloques, no frases sueltas dentro de un párrafo.');
  process.exit(0);
}

console.error(`${problemas.length} secciones en el idioma equivocado:\n`);
listar(problemas, (l) => console.error(l));
process.exit(1);
