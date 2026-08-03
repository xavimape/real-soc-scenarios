/**
 * Coherencia del catálogo de casos.
 *
 * El esquema de `content.config.ts` valida un archivo por vez, así que hay una
 * clase entera de errores que no puede ver: los que son relaciones entre
 * archivos. Un `caseNumber` repetido, un `caseId` que no coincide con el
 * prefijo del nombre, o una versión en inglés que dice otra severidad que la
 * española pasan la validación de Zod sin una queja.
 *
 * Este verificador mira esas relaciones. Corre sobre los `.mdx`, no sobre
 * `dist/`, así que no necesita build previo.
 *
 *   node tools/verificar-catalogo.mjs
 *
 * Qué comprueba, y por qué cada cosa:
 *
 *   1. Paridad de idiomas. Un caso a medias es la alarma de L-002.
 *   2. Prefijo del archivo == caseNumber. El prefijo define la URL: si no
 *      coinciden, el caso 7 vive en /08-... y nadie lo nota leyendo.
 *   3. caseId == soc-0NN de su caseNumber. Es el identificador que aparece en
 *      las islas de cada caso; desalineado, el material de apoyo dice otro caso.
 *   4. caseNumber único.
 *   5. Metadatos que tienen que ser idénticos entre idiomas. El título y la
 *      descripción no: esos se traducen. La severidad y la dificultad sí,
 *      porque describen el caso y no el texto.
 *
 * Lo que NO comprueba, dicho para que nadie lo suponga: que el contenido de las
 * dos versiones diga lo mismo. Eso no lo puede ver un script; lo miran
 * `check:idioma` por bloques y una persona leyendo.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const BASE = 'src/content/scenarios';
const LANGS = ['es', 'en'];

/** Campos que describen el caso, no su redacción: tienen que coincidir. */
const COMPARTIDOS = ['caseId', 'caseNumber', 'difficulty', 'caseType', 'severity', 'pubDate'];

const leerFrontmatter = async (ruta) => {
  const texto = await readFile(ruta, 'utf8');
  const bloque = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!bloque) return null;

  const datos = {};
  for (const linea of bloque[1].split(/\r?\n/)) {
    // Solo las claves de primer nivel. Las anidadas —`locations`— no se
    // comparan acá y no hacen falta para lo que este verificador mira.
    const m = linea.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    datos[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return datos;
};

const problemas = [];
const casos = {};

for (const lang of LANGS) {
  casos[lang] = new Map();
  const archivos = (await readdir(join(BASE, lang))).filter((f) => f.endsWith('.mdx'));

  for (const archivo of archivos) {
    const datos = await leerFrontmatter(join(BASE, lang, archivo));
    if (!datos) {
      problemas.push(`${lang}/${archivo}: sin bloque de frontmatter`);
      continue;
    }
    casos[lang].set(archivo, datos);

    // 2. El prefijo del archivo manda: define la URL.
    const prefijo = archivo.match(/^(\d+)-/);
    if (!prefijo) {
      problemas.push(`${lang}/${archivo}: el nombre no empieza con un número`);
    } else if (Number(prefijo[1]) !== Number(datos.caseNumber)) {
      problemas.push(
        `${lang}/${archivo}: el prefijo dice ${Number(prefijo[1])} y caseNumber dice ${datos.caseNumber}`
      );
    }

    // 3. caseId derivado de caseNumber, con dos dígitos.
    const esperado = `soc-${String(datos.caseNumber).padStart(3, '0')}`;
    if (datos.caseId !== esperado) {
      problemas.push(`${lang}/${archivo}: caseId es "${datos.caseId}" y debería ser "${esperado}"`);
    }
  }

  // 4. Números repetidos dentro del mismo idioma.
  const vistos = new Map();
  for (const [archivo, datos] of casos[lang]) {
    const n = Number(datos.caseNumber);
    if (vistos.has(n)) {
      problemas.push(`${lang}: caseNumber ${n} repetido en ${vistos.get(n)} y ${archivo}`);
    }
    vistos.set(n, archivo);
  }
}

// 1. Paridad: mismos archivos en los dos idiomas.
for (const archivo of casos.es.keys()) {
  if (!casos.en.has(archivo)) problemas.push(`falta la versión en inglés de ${archivo}`);
}
for (const archivo of casos.en.keys()) {
  if (!casos.es.has(archivo)) problemas.push(`falta la versión en español de ${archivo}`);
}

// 5. Metadatos compartidos idénticos entre idiomas.
for (const [archivo, es] of casos.es) {
  const en = casos.en.get(archivo);
  if (!en) continue;

  for (const campo of COMPARTIDOS) {
    if (es[campo] !== en[campo]) {
      problemas.push(
        `${archivo}: ${campo} difiere entre idiomas — es="${es[campo]}" en="${en[campo]}"`
      );
    }
  }
}

if (problemas.length > 0) {
  console.error(`\n${problemas.length} problema(s) de coherencia en el catálogo:\n`);
  for (const p of problemas) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}

const total = casos.es.size;
const numeros = [...casos.es.values()].map((d) => Number(d.caseNumber)).sort((a, b) => a - b);
console.log(
  `Catálogo coherente: ${total} casos en los dos idiomas, ` +
    `numerados ${numeros.join(', ')}.`
);
