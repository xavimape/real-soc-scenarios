/**
 * Verifica que no salgan indicadores vivos al HTML publicado.
 *
 * Corre sobre `dist/`, no sobre los `.mdx`: lo que importa es lo que termina
 * frente al lector. Un dominio malicioso clicleable en un sitio que enseña
 * análisis es un error grave, y es fácil de cometer al cargar un caso nuevo.
 *
 *   node scripts/check-defang.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import process from 'node:process';

const DIST = 'dist';

/**
 * Dominios registrables que sí deben quedar vivos: referencias legítimas.
 * Van sin subdominio a propósito — el patrón captura solo los dos últimos
 * niveles, así que `attack.mitre.org` llega acá como `mitre.org`.
 */
const PERMITIDOS = [
  'mitre.org',
  'krebsonsecurity.com',
  'senate.gov',
  'lockheedmartin.com',
  'microsoft.com',
  'rfc-editor.org',
  'astro.build',
  'w3.org',
  'github.com',
  'linkedin.com',
  'elastic.co',
  'thehackernews.com',
  'nttsecurity.com',
  'jfrog.com',
  'google.com',
  'progress.com',
  'amazon.com',
  'hydro.com',
  'okta.com',
  // Cubre también `genai.owasp.org`: el patrón captura los dos últimos niveles.
  'owasp.org',
  // Reservado por RFC 2606 para documentación: no puede ser infraestructura real.
  'example.com',
  // Herramientas públicas citadas por nombre, no infraestructura del atacante.
  'obfuscator.io',
  'socket.io',
];

/**
 * Nombres de tecnología que el patrón de dominio confunde con un dominio.
 *
 * No van en PERMITIDOS a propósito: esa lista significa "dominio real que debe
 * quedar clicleable", y esto es otra cosa — cadenas de texto que terminan en
 * algo que parece un TLD. El caso testigo es `ASP.NET`, que apareció al cargar
 * soc-005 describiendo en qué está escrito un webshell.
 *
 * El patrón captura solo los dos últimos niveles, así que `ASP.NET` en prosa y
 * `contoso.asp.net` producen la misma coincidencia. Para no perder el segundo,
 * la exclusión mira además el carácter anterior: si es un punto, hay un
 * subdominio delante y la coincidencia sí se informa.
 */
const NO_SON_DOMINIOS = ['asp.net', 'vb.net', 'ado.net'];

/**
 * Direcciones IPv4 que no pueden ser infraestructura de un atacante.
 *
 * Solo el enlace local, `169.254.0.0/16` de la RFC 3927. Esas direcciones no se
 * enrutan por internet: valen únicamente dentro del mismo segmento, así que
 * defanguearlas no protege de nada. Aparecen en soc-007 porque `169.254.169.254`
 * es el servicio de metadatos de instancia, una constante de plataforma que la
 * documentación del propio proveedor publica tal cual.
 *
 * Deliberadamente NO se agregan acá los rangos de documentación de la RFC 5737
 * —`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`—, aunque tampoco existan.
 * En los casos sintéticos esas direcciones hacen de infraestructura del atacante,
 * y publicarlas defangueadas es parte de lo que el sitio enseña. Que una
 * dirección sea inofensiva no alcanza: la pregunta es qué papel cumple en el
 * texto.
 */
const ENLACE_LOCAL = /^169\.254\./;

/** Patrones de indicador que nunca deberían aparecer sin defanguear. */
const PATRONES = [
  {
    nombre: 'dominio sin defanguear',
    regex: /\b[a-z0-9][a-z0-9-]{1,61}\.(?:com|net|org|dev|io|ru|xyz|top|info|biz)\b/gi,
  },
  {
    nombre: 'IPv4 sin defanguear',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
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

const hallazgos = [];

for (const archivo of await archivosHtml(DIST)) {
  const html = await readFile(archivo, 'utf8');

  for (const { nombre, regex } of PATRONES) {
    for (const coincidencia of html.matchAll(regex)) {
      const valor = coincidencia[0];
      if (PERMITIDOS.some((p) => valor.toLowerCase().endsWith(p))) continue;
      const anterior = html[coincidencia.index - 1];
      if (NO_SON_DOMINIOS.includes(valor.toLowerCase()) && anterior !== '.') continue;

      // Descarta lo que tiene forma de IP pero no puede serlo, o no puede ser
      // infraestructura de nadie. Ojo: un número de versión de cuatro partes
      // como `1.2.3.4` sí se informa, porque es indistinguible de una dirección
      // válida. Todavía no apareció ninguno en el contenido; si aparece, se
      // resuelve mirando el contexto, no ampliando esta condición.
      if (nombre.startsWith('IPv4')) {
        const octetos = valor.split('.').map(Number);
        if (octetos.some((o) => o > 255)) continue;
        if (ENLACE_LOCAL.test(valor)) continue;
      }

      hallazgos.push({ archivo, nombre, valor });
    }
  }
}

if (hallazgos.length === 0) {
  console.log('Sin indicadores vivos en dist/.');
  process.exit(0);
}

console.error(`\n${hallazgos.length} posibles indicadores sin defanguear:\n`);
for (const h of hallazgos) {
  console.error(`  ${h.archivo}: ${h.valor}  (${h.nombre})`);
}
console.error(
  '\nSi alguno es una referencia legítima, agregalo a PERMITIDOS en este script.\n'
);
process.exit(1);
