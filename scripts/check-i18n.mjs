/**
 * Verifica que cada página publicada esté en un solo idioma: el suyo.
 *
 * ── Por qué se reescribió ──────────────────────────────────────────────────
 * La versión anterior comparaba pares `<span data-lang="es">` / `<span
 * data-lang="en">`: cada texto se emitía dos veces y el CSS ocultaba uno. Ese
 * diseño se abandonó en D-014, así que el verificador quedaba midiendo algo que
 * ya no existe — y uno que no encuentra nada da verde igual que uno que no
 * encuentra problemas.
 *
 * Es E-014 en su segunda vuelta: la herramienta pasa, el problema sigue. Por eso
 * la reescritura era parte de la migración y no una tarea para después.
 *
 * ── Qué verifica ahora ─────────────────────────────────────────────────────
 * 1. Toda página declara un idioma conocido en `<html data-lang>`.
 * 2. Ninguna página contiene texto del diccionario en el idioma equivocado.
 *    Si `/en/` dice "Severidad", alguien se olvidó de pasar `lang`.
 * 3. No quedan restos de la doble emisión, que ahora saldrían duplicados en
 *    pantalla porque ya no hay CSS que los oculte.
 *
 * Lo que NO puede verificar: que el contenido de un caso esté bien traducido.
 * Eso no lo ve ninguna herramienta — hay que leerlo.
 *
 *   node scripts/check-i18n.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import process from 'node:process';

const DIST = 'dist';
const IDIOMAS = ['es', 'en'];

/**
 * La página raíz es una pantalla de reparto: sin contenido propio, redirige
 * según el navegador. No pertenece a ningún idioma.
 */
const SIN_IDIOMA = ['index.html'];

/**
 * Textos que aparecen legítimamente en el otro idioma: nombres propios, siglas
 * y palabras que se escriben igual. Se listan a mano y con motivo, para que la
 * lista no crezca sola cada vez que algo molesta.
 */
const AMBIGUOS = [
  'No', // vale en los dos idiomas
  'Actor', // vale en los dos idiomas
  'Config', // se dejó sin traducir a propósito
  'TTPs', // sigla
  'Simple', // vale en los dos idiomas
  'Trivial', // vale en los dos idiomas
];

async function archivosHtml(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await archivosHtml(ruta)));
    else if (extname(entrada.name) === '.html') salida.push(ruta);
  }
  return salida;
}

/**
 * Texto que llega al lector: el contenido de las etiquetas, más los atributos
 * que un lector de pantalla anuncia.
 *
 * El detalle que costó una tanda de falsos positivos: Astro serializa las props
 * de cada isla dentro del atributo `props` de `<astro-island>`. Ahí viaja el
 * JSON entero del componente — claves como "events" o valores como "System" —
 * y como ese JSON contiene `>`, un `replace(/<[^>]+>/g)` corta la etiqueta a la
 * mitad y suelta el resto del JSON como si fuera texto. Por eso los atributos
 * se quitan primero, y los dos que sí se leen en voz alta se rescatan aparte.
 */
const textoVisible = (html) => {
  const sinCodigo = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // `<pre>` y `<code>` quedan afuera por la regla de D-013: lo que un analista
    // copiaría a una consola o a un buscador no se traduce. La salida literal de
    // un producto —"Severity: High", "Detection Source: Microsoft Defender"— es
    // parte de la evidencia, no de la redacción, y traducirla la falsearía.
    .replace(/<pre[\s\S]*?<\/pre>/gi, '')
    .replace(/<code[\s\S]*?<\/code>/gi, '');

  const anunciados = [...sinCodigo.matchAll(/\s(?:aria-label|title)="([^"]*)"/g)]
    .map((m) => m[1])
    .join(' ');

  const cuerpo = sinCodigo
    .replace(/\s[a-zA-Z-]+="[^"]*"/g, '')
    .replace(/<[^>]*>/g, ' ');

  return `${cuerpo} ${anunciados}`
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Presencia como texto completo, no como fragmento. Sin esto, "All" daría
 * positivo dentro de "Allanamiento" y el informe se llenaría de ruido.
 */
const apareceSuelto = (texto, aguja) =>
  new RegExp(`(^|[^\\p{L}])${escapar(aguja)}([^\\p{L}]|$)`, 'u').test(texto);

// ── Diccionario ────────────────────────────────────────────────────────────
// Se lee como texto en vez de importarlo, para no depender del alias `@/` ni de
// la resolución de módulos de Astro. El patrón tolera saltos de línea porque las
// entradas largas se escriben en varias.
const fuente = await readFile('src/i18n/strings.js', 'utf8');
const todos = [...fuente.matchAll(/es:\s*'([^']+)',\s*\n?\s*en:\s*'([^']+)'/g)]
  .map((m) => ({ es: m[1], en: m[2] }))
  .filter((p) => p.es !== p.en && !AMBIGUOS.includes(p.es) && !AMBIGUOS.includes(p.en));

// Si el patrón deja de coincidir, el script encontraría cero problemas por
// razones equivocadas. Mejor que falle ruidosamente.
if (todos.length === 0) {
  console.error('No se pudo leer el diccionario. Revisar el patrón sobre src/i18n/strings.js.');
  process.exit(1);
}

/**
 * El diccionario se parte en dos por una razón que conviene tener presente.
 *
 * Muchas claves son palabras sueltas y comunes: "System", "Campaign", "User",
 * "Infrastructure", "of". Esas mismas palabras aparecen legítimamente en un caso
 * en español, porque son nombres de técnicas MITRE ("Data from Local System"),
 * títulos de informes citados ("C2 Infrastructure Analysis") o de RFCs. Buscarlas
 * sueltas produce más ruido que señal, y un informe ruidoso se deja de leer.
 *
 * Así que las frases —dos palabras o más— se verifican y rompen el build. Las
 * palabras sueltas se informan como aviso, sin frenar nada.
 *
 * Es una limitación real, no un descuido: queda impresa en cada corrida para que
 * nadie confunda "pasó el verificador" con "está todo traducido".
 */
const esFrase = (p) => p.es.trim().includes(' ') && p.en.trim().includes(' ');
const pares = todos.filter(esFrase);
const sueltos = todos.filter((p) => !esFrase(p));

// ── Verificación ───────────────────────────────────────────────────────────
const problemas = [];
const avisos = [];
let paginasRevisadas = 0;

for (const archivo of await archivosHtml(DIST)) {
  const rel = relative(DIST, archivo).replace(/\\/g, '/');
  if (SIN_IDIOMA.includes(rel)) continue;

  const html = await readFile(archivo, 'utf8');
  const declarado = html.match(/<html[^>]*\sdata-lang="([^"]+)"/);

  if (!declarado) {
    problemas.push({
      archivo: rel,
      tipo: 'sin idioma',
      detalle: 'falta data-lang en <html>',
    });
    continue;
  }

  const idioma = declarado[1];

  if (!IDIOMAS.includes(idioma)) {
    problemas.push({ archivo: rel, tipo: 'idioma desconocido', detalle: idioma });
    continue;
  }

  paginasRevisadas += 1;

  if (/<span data-lang="/.test(html)) {
    problemas.push({
      archivo: rel,
      tipo: 'doble emisión',
      detalle: 'quedan <span data-lang=...> del sistema anterior',
    });
  }

  const texto = textoVisible(html);
  const otro = idioma === 'es' ? 'en' : 'es';

  for (const par of pares) {
    if (apareceSuelto(texto, par[otro])) {
      problemas.push({
        archivo: rel,
        tipo: `texto en ${otro}`,
        detalle: `"${par[otro]}" — debería decir "${par[idioma]}"`,
      });
    }
  }

  for (const par of sueltos) {
    if (apareceSuelto(texto, par[otro])) {
      avisos.push({ archivo: rel, palabra: par[otro], deberia: par[idioma] });
    }
  }
}

if (avisos.length > 0) {
  console.error(`\nAviso: ${avisos.length} palabras sueltas del diccionario en el otro idioma.`);
  console.error('Puede ser un nombre de técnica MITRE o el título de un informe citado —');
  console.error('que no se traducen— o texto de verdad sin traducir. Hay que mirarlo.\n');
  for (const a of avisos.slice(0, 15)) {
    console.error(`  ${a.archivo}: "${a.palabra}" (en el otro idioma sería "${a.deberia}")`);
  }
  if (avisos.length > 15) console.error(`  ... y ${avisos.length - 15} más`);
  console.error('');
}

if (problemas.length === 0) {
  console.log(
    `i18n correcto: ${paginasRevisadas} páginas, cada una en su idioma, ` +
      `${pares.length} frases contrastadas.`
  );
  console.log(
    `${sueltos.length} claves de una sola palabra quedan fuera de la ` +
      'verificación estricta: se informan como aviso.'
  );
  process.exit(0);
}

console.error(`\n${problemas.length} problemas de idioma:\n`);
for (const p of problemas) {
  console.error(`  ${p.archivo}\n    ${p.tipo}: ${p.detalle}`);
}
console.error(
  '\nCasi siempre es una isla sin `lang` en su .mdx, o un componente que no se ' +
    'lo pasa a sus hijos.\n'
);
process.exit(1);
