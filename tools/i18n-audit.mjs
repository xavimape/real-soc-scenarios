/**
 * Audita la cobertura de traducción en el código fuente.
 *
 * `scripts/check-i18n.mjs` mira el HTML construido y verifica que los pares
 * existentes estén bien. No puede ver lo que nunca se envolvió en un par: un
 * literal en español hardcodeado en un componente es invisible para él.
 *
 * Este script cubre ese hueco desde el otro lado. Escanea el código, encuentra
 * los literales en español que no pasan por el diccionario, y —cuando puede—
 * propone la clave que les corresponde.
 *
 *   node tools/i18n-audit.mjs           # informe
 *   node tools/i18n-audit.mjs --json    # salida para procesar
 *
 * Sale con código 1 si encuentra literales sin cubrir, así que sirve como
 * verificación en el pipeline una vez que la migración esté terminada.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import process from 'node:process';

const RAIZ = 'src';
const EXTENSIONES = ['.jsx', '.astro'];

/** Archivos que legítimamente contienen español suelto. */
const EXCLUIDOS = [
  'i18n/strings.js', // es el diccionario
  'config/appearance.js', // nombres de temas y fuentes, se tratan aparte
];

/**
 * Un literal se considera español si tiene alguna marca inequívoca del idioma.
 * Se busca precisión sobre exhaustividad: un falso positivo por cada palabra
 * ambigua haría el informe inútil.
 */
const MARCAS_ES = [
  /[áéíóúñ¿¡]/i,
  /\b(el|la|los|las|un|una|de|del|que|con|para|por|sin|sobre|desde|hasta|entre|cada|todo|todos|toda|todas|este|esta|esto|ese|esa|más|menos|muy|solo|también|donde|cuando|como|porque|según|ningún|ninguna|hay|son|está|están|fue|ser|tiene|puede)\b/i,
];

/** Cadenas que no son texto de interfaz aunque parezcan español. */
const NO_ES_TEXTO = [
  /^[\s\d\W]*$/, // solo símbolos o números
  /^(var|calc|rgb|hsl|color-mix)\(/, // CSS
  /^[a-z-]+$/i, // una palabra sin espacios: casi siempre una clase o un id
  /^https?:/,
  /^\d/, // empieza con número: medidas
];

const literalJsx = /(?:>|\{)\s*['"`]([^'"`\n]{4,})['"`]\s*(?:<|\}|,|\))/g;

/**
 * Texto JSX suelto: `<span>eventos</span>` o `} eventos {`. No está entre
 * comillas, así que ningún escaneo de literales lo encuentra. Fue el punto ciego
 * que hizo que este script reportara 41 casos cuando había más.
 */
const textoJsx = /(?:>|\})([^<>{}\n]{3,})(?:<|\{)/g;
const propTexto =
  /\b(?:label|title|subtitle|name|pain|hint|detalle|detail|note|placeholder|aria-label|ariaLabel)\s*[:=]\s*['"`]([^'"`\n]{4,})['"`]/g;
const textoSuelto = /['"`]([^'"`\n]{6,})['"`]/g;

const esEspanol = (s) =>
  MARCAS_ES.some((r) => r.test(s)) && !NO_ES_TEXTO.some((r) => r.test(s));

/**
 * Además del texto claramente español, interesan las palabras sueltas de
 * interfaz que el detector de idioma no puede clasificar: "Severidad", "Todos",
 * "Duro" no tienen tilde ni palabra función, pero están en el diccionario.
 * Se comparan contra las claves conocidas, sin adivinar.
 */
const enDiccionario = (s) => diccionario.has(s);

async function archivos(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await archivos(ruta)));
    else if (EXTENSIONES.includes(extname(entrada.name))) salida.push(ruta);
  }
  return salida;
}

/** Índice inverso del diccionario: texto en español -> clave. */
async function indiceInverso() {
  const fuente = await readFile('src/i18n/strings.js', 'utf8');
  const indice = new Map();

  // Se lee el archivo como texto en lugar de importarlo: así el script funciona
  // sin resolver el alias `@/` ni arrastrar dependencias del proyecto.
  //
  // El patrón tolera saltos de línea: las entradas largas del diccionario se
  // escriben en varias líneas y una versión anterior de este script las perdía,
  // reportando "FALTA CLAVE" para claves que sí existían.
  const bloque = /(\w+):\s*\{\s*es:\s*'([^']+)',\s*\n?\s*en:\s*'([^']+)'/g;
  const seccionRe = /^  (\w+):\s*\{$/gm;

  // Posición de cada sección, para saber a cuál pertenece cada clave.
  const secciones = [...fuente.matchAll(seccionRe)].map((m) => ({
    nombre: m[1],
    desde: m.index,
  }));

  const seccionDe = (pos) => {
    let actual = 'common';
    for (const s of secciones) {
      if (s.desde < pos) actual = s.nombre;
      else break;
    }
    return actual;
  };

  for (const m of fuente.matchAll(bloque)) {
    indice.set(m[2], `${seccionDe(m.index)}.${m[1]}`);
  }

  return indice;
}

const diccionario = await indiceInverso();
const hallazgos = [];

/**
 * Búsqueda exacta: cada valor en español del diccionario que aparezca como
 * literal en el código es, por definición, un literal que hay que reemplazar.
 * No tiene falsos positivos ni depende de adivinar el idioma.
 */
async function literalesDelDiccionario(archivo, fuente) {
  const encontrados = [];
  for (const [texto, clave] of diccionario) {
    if (fuente.includes(`'${texto}'`) || fuente.includes(`"${texto}"`)) {
      encontrados.push({ archivo, texto, clave, exacto: true });
    }
  }
  return encontrados;
}

for (const archivo of await archivos(RAIZ)) {
  const rel = relative(RAIZ, archivo).replace(/\\/g, '/');
  if (EXCLUIDOS.some((e) => rel.endsWith(e))) continue;

  const fuente = await readFile(archivo, 'utf8');
  const vistos = new Set();

  // Se ignoran los comentarios: son para quien lee el código, no para el lector.
  // Se limpian ANTES de cualquier búsqueda, porque si no un ejemplo citado en un
  // comentario se reporta como literal pendiente.
  const sinComentarios = fuente
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  for (const h of await literalesDelDiccionario(rel, sinComentarios)) {
    hallazgos.push(h);
    vistos.add(h.texto);
  }

  for (const patron of [literalJsx, propTexto, textoJsx, textoSuelto]) {
    for (const m of sinComentarios.matchAll(patron)) {
      const texto = m[1].trim();
      if (vistos.has(texto)) continue;
      if (!esEspanol(texto) && !enDiccionario(texto)) continue;
      vistos.add(texto);

      hallazgos.push({
        archivo: rel,
        texto,
        clave: diccionario.get(texto) || null,
      });
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(hallazgos, null, 2));
  process.exit(hallazgos.length ? 1 : 0);
}

if (hallazgos.length === 0) {
  console.log('Cobertura de traducción completa: sin literales en español sueltos.');
  process.exit(0);
}

const porArchivo = new Map();
for (const h of hallazgos) {
  if (!porArchivo.has(h.archivo)) porArchivo.set(h.archivo, []);
  porArchivo.get(h.archivo).push(h);
}

const exactos = hallazgos.filter((h) => h.exacto).length;
const sinClave = hallazgos.filter((h) => !h.clave).length;

console.log(`\n${hallazgos.length} literales en español sin pasar por el diccionario`);
console.log(`${exactos} coinciden exactamente con una clave del diccionario.`);
console.log(`${sinClave} no tienen clave: hay que agregarla antes de reemplazar.\n`);

for (const [archivo, lista] of [...porArchivo].sort()) {
  console.log(`${archivo}  (${lista.length})`);
  for (const h of lista) {
    const destino = h.clave ? `-> ${h.clave}` : '-> FALTA CLAVE';
    console.log(`   ${JSON.stringify(h.texto).padEnd(52)} ${destino}`);
  }
  console.log('');
}

process.exit(1);
