/**
 * Verifica dos reglas de estilo que estaban escritas solo en prosa.
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 * Las dos que revisa acá se rompieron de verdad y estuvieron rotas durante días:
 * marcas decorativas en cuatro casos, y una regla del README escrita en
 * imperativo dirigido, que es un patrón que delata a quién le habla el
 * documento. Las encontró una persona leyendo, no el proceso.
 *
 * La lección no es que faltaba esta herramienta. Es que se construyeron
 * verificadores para lo que era cómodo medir en vez de para lo que más importaba
 * no romper.
 *
 *   node tools/verificar-invariantes.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import process from 'node:process';

const RAICES = ['src', 'scripts', 'tools'];
const DOCS = ['README.md', 'THEMES.md'];
const EXT = ['.astro', '.jsx', '.js', '.ts', '.mjs', '.mdx', '.md', '.css'];

const problemas = [];
const avisos = [];

async function archivos(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) salida.push(...(await archivos(ruta)));
    else if (EXT.includes(extname(e.name))) salida.push(ruta);
  }
  return salida;
}

// Este archivo contiene, por necesidad, ejemplos de lo que busca. Excluirlo no es
// una excepción cómoda: es que un detector no puede ser su propio caso de prueba.
const YO = 'verificar-invariantes.mjs';

const todos = [];
for (const raiz of RAICES) {
  try {
    todos.push(...(await archivos(raiz)));
  } catch {
    /* la raíz puede no existir todavía */
  }
}
todos.push(...DOCS);
const revisables = todos.filter((r) => !r.endsWith(YO));

// ── Marcas decorativas ─────────────────────────────────────────────────────
// La regla del README: las marcas se usan cuando el contraste es parte del
// argumento. Tres o más seguidas, todas iguales, no están contrastando con nada.
// `<Warn />` queda exento: advertir varias veces seguidas es legítimo.
// El contraste se mide por sección y no por líneas contiguas: en el caso 15 la
// lista de lo que el antivirus detecta y la de lo que no están separadas por un
// párrafo, y juntas son exactamente el argumento. Un detector que solo mira
// rachas seguidas las parte en dos y marca ambas como decorativas.
for (const ruta of revisables.filter((r) => r.endsWith('.mdx'))) {
  const texto = await readFile(ruta, 'utf8');

  for (const seccion of texto.split(/^#{2,4}\s.+$/m)) {
    const marcas = (seccion.match(/<(Pass|Fail|Warn)\s*\/>/g) || []).map((x) =>
      x.replace(/[<>/\s]/g, '')
    );
    const tipos = new Set(marcas.filter((t) => t !== 'Warn'));

    if (marcas.length >= 3 && tipos.size === 1) {
      problemas.push({
        ruta,
        regla: 'marcas decorativas',
        detalle: `${marcas.length} <${[...tipos][0]} /> en una sección, sin contraste`,
      });
    }
  }
}

// ── Voz de los documentos públicos ─────────────────────────────────────────
// Una regla en imperativo dirigido implica un destinatario que no es quien
// escribe. Es una señal débil y por eso va como aviso: hay imperativos
// legítimos, sobre todo en instrucciones de instalación.
//
// El cierre es `(?![\p{L}])` y no `\b`. Con `\b`, la mitad de los términos no
// podía dispararse nunca: los que terminan en vocal acentuada no producen borde
// de palabra, porque `\b` mide contra el alfabeto ASCII y `á` no entra. Cinco de
// los diez estuvieron muertos desde el primer día sin que se notara, que es lo
// que pasa cuando un verificador se estrena en verde y nadie le siembra un error.
const IMPERATIVO =
  /^\s*(?:[-*]|\d+\.)?\s*\**(No usar|Nunca uses|Reservalos|Usá|Agregá|Poné|Tené en cuenta|Acordate|Recordá|Evitá)(?![\p{L}])/gmu;

for (const doc of DOCS) {
  let texto;
  try {
    texto = await readFile(doc, 'utf8');
  } catch {
    continue;
  }
  for (const m of texto.match(IMPERATIVO) || []) {
    avisos.push({ ruta: doc, detalle: m.trim() });
  }
}

// ── Informe ────────────────────────────────────────────────────────────────
if (avisos.length > 0) {
  console.error(`\nAviso: ${avisos.length} reglas en imperativo dirigido.`);
  console.error('Una regla que le habla a alguien implica un lector que no es quien escribe.');
  console.error('En voz descriptiva dice lo mismo sin ese supuesto.\n');
  for (const a of avisos) console.error(`  ${a.ruta}: ${a.detalle}`);
  console.error('');
}

if (problemas.length === 0) {
  console.log(`Estilo en regla: ${todos.length} archivos revisados.`);
  process.exit(0);
}

console.error(`${problemas.length} reglas de estilo rotas:\n`);
for (const p of problemas) {
  console.error(`  ${p.ruta}\n    ${p.regla}: ${p.detalle}`);
}
console.error('');
process.exit(1);
