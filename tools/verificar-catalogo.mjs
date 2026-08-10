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
    const m = linea.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    datos[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Coordenadas del globo, aparte porque están anidadas.
   *
   * Se comparan solo `lat` y `lng`: el `label` se traduce y tiene que diferir.
   * Un dígito cambiado en un solo idioma pone el marcador en otro continente
   * en la mitad del sitio, y es de las cosas que nadie revisa dos veces.
   */
  datos._coords = [...bloque[1].matchAll(/lat:\s*(-?[\d.]+)\s*,\s*lng:\s*(-?[\d.]+)/g)]
    .map((m) => `${m[1]},${m[2]}`)
    .join(' | ');

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

  if (es._coords !== en._coords) {
    problemas.push(
      `${archivo}: las coordenadas del globo difieren entre idiomas — ` +
        `es=[${es._coords || 'ninguna'}] en=[${en._coords || 'ninguna'}]`
    );
  }
}

// 6. Las cifras que los README declaran sobre el catálogo.
//
// Envejecen solas: nadie las rompe, dejan de ser ciertas cuando entra un caso
// nuevo. Y no hay build que falle por eso — el sitio compila igual con un README
// que dice dieciséis cuando hay diecisiete. Es el tipo de error que descubre un
// lector, que es tarde.
//
// Se comprueba lo que se puede derivar del catálogo: el total, el último
// identificador, el número escrito en letras y la cantidad de páginas.
const CIFRAS = {
  'README.md': {
    letras: {
      1: 'Un', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete',
      8: 'Ocho', 9: 'Nueve', 10: 'Diez', 11: 'Once', 12: 'Doce', 13: 'Trece',
      14: 'Catorce', 15: 'Quince', 16: 'Dieciséis', 17: 'Diecisiete',
      18: 'Dieciocho', 19: 'Diecinueve', 20: 'Veinte', 21: 'Veintiún',
      22: 'Veintidós', 23: 'Veintitrés', 24: 'Veinticuatro', 25: 'Veinticinco',
    },
    frase: (n, letra) => new RegExp(`^${letra} casos`, 'm'),
    fila: /\|\s*Casos\s*\|\s*(\d+), del `soc-001` al `soc-(\d+)`\s*\|/,
    paginas: /\|\s*Páginas generadas\s*\|\s*(\d+)\s*\|/,
    reparto: /^(\w+) de los casos reconstruyen[\s\S]{0,80}?Los otros\s*\n?(\w+) son escenarios/m,
  },
  'README.en.md': {
    letras: {
      1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven',
      8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve',
      13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen',
      17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty',
      21: 'Twenty-one', 22: 'Twenty-two', 23: 'Twenty-three',
      24: 'Twenty-four', 25: 'Twenty-five',
    },
    frase: (n, letra) => new RegExp(`^${letra} cases`, 'm'),
    fila: /\|\s*Cases\s*\|\s*(\d+), from `soc-001` to `soc-(\d+)`\s*\|/,
    paginas: /\|\s*Generated pages\s*\|\s*(\d+)\s*\|/,
    reparto: /^(\w+) cases reconstruct[\s\S]{0,60}?The other\s*\n?(\w+) are/m,
  },
};

const totalCasos = casos.es.size;

// Reales contra construidos para el ejercicio. Sale del prefijo de `caseType`,
// que es lo mismo que el README afirma en prosa dos párrafos más abajo. Estuvo
// desactualizado: decía ocho y ocho cuando eran siete y nueve.
const casosReales = [...casos.es.values()].filter((d) =>
  String(d.caseType).startsWith('real_case')
).length;
const casosEducativos = totalCasos - casosReales;

// Una por idioma más la raíz de reparto, y dos por caso.
const PAGINAS_ESPERADAS = totalCasos * 2 + LANGS.length + 1;

for (const [doc, reglas] of Object.entries(CIFRAS)) {
  let texto;
  try {
    texto = await readFile(doc, 'utf8');
  } catch {
    problemas.push(`no se pudo leer ${doc}`);
    continue;
  }

  const letra = reglas.letras[totalCasos];
  if (!letra) {
    problemas.push(
      `${doc}: no hay forma escrita para ${totalCasos}; ampliar la tabla en este verificador`
    );
  } else if (!reglas.frase(totalCasos, letra).test(texto)) {
    problemas.push(`${doc}: el recuento en letras no dice "${letra}", que es lo que hay`);
  }

  const fila = texto.match(reglas.fila);
  if (!fila) {
    problemas.push(`${doc}: no se encontró la fila del recuento de casos`);
  } else {
    if (Number(fila[1]) !== totalCasos) {
      problemas.push(`${doc}: declara ${fila[1]} casos y hay ${totalCasos}`);
    }
    if (Number(fila[2]) !== totalCasos) {
      problemas.push(
        `${doc}: declara que el último es soc-${fila[2]} y es soc-${String(totalCasos).padStart(3, '0')}`
      );
    }
  }

  const reparto = texto.match(reglas.reparto);
  if (!reparto) {
    problemas.push(`${doc}: no se encontró la frase del reparto entre casos reales y construidos`);
  } else {
    const esperadoReal = reglas.letras[casosReales];
    const esperadoEdu = reglas.letras[casosEducativos];
    if (!esperadoReal || !esperadoEdu) {
      problemas.push(
        `${doc}: no hay forma escrita para ${casosReales} o ${casosEducativos}; ampliar la tabla`
      );
    } else {
      if (reparto[1].toLowerCase() !== esperadoReal.toLowerCase()) {
        problemas.push(
          `${doc}: dice que "${reparto[1]}" casos son reales y son ${casosReales} (${esperadoReal})`
        );
      }
      if (reparto[2].toLowerCase() !== esperadoEdu.toLowerCase()) {
        problemas.push(
          `${doc}: dice que "${reparto[2]}" son construidos y son ${casosEducativos} (${esperadoEdu})`
        );
      }
    }
  }

  const paginas = texto.match(reglas.paginas);
  if (!paginas) {
    problemas.push(`${doc}: no se encontró la fila de páginas generadas`);
  } else if (Number(paginas[1]) !== PAGINAS_ESPERADAS) {
    problemas.push(
      `${doc}: declara ${paginas[1]} páginas y con ${totalCasos} casos son ${PAGINAS_ESPERADAS}`
    );
  }
}

if (problemas.length > 0) {
  console.error(`\n${problemas.length} problema(s) de coherencia en el catálogo:\n`);
  for (const p of problemas) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}

const total = totalCasos;
const numeros = [...casos.es.values()].map((d) => Number(d.caseNumber)).sort((a, b) => a - b);
console.log(
  `Catálogo coherente: ${total} casos en los dos idiomas, ` +
    `numerados ${numeros.join(', ')}.`
);
