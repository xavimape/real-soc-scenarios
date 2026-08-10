/**
 * Despliegue a Cloudflare, con la verificación adelante.
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 * El sitio no se publica solo. `git push` sube el código a GitHub y ahí termina:
 * lo que ve el lector sale de un despliegue manual, y las dos cosas pueden
 * quedar desfasadas durante días sin que nadie avise. Ya pasó.
 *
 * Este script encadena las tres etapas en el único orden que sirve y corta en
 * la primera que falle:
 *
 *   1. build      compila el sitio en dist/
 *   2. check      verifica sobre ese dist/ recién hecho, no sobre el anterior
 *   3. deploy     publica
 *
 * Si el paso 2 falla, no hay paso 3. Esa es toda la idea.
 *
 *   npm run deploy
 *
 * ── SITE_URL ───────────────────────────────────────────────────────────────
 * Se inyecta acá y no en `astro.config.mjs` a propósito. El valor por defecto de
 * la configuración sigue siendo `localhost`, y eso es deliberado: sin la
 * variable, el layout no emite la imagen de la tarjeta al compartir. Es
 * preferible que no haya imagen a que haya una que apunte a una dirección que no
 * existe, y en desarrollo local ninguna de las dos hace falta.
 *
 * Puesta acá, la dirección real acompaña al único momento en que importa —el
 * despliegue— y no se puede olvidar.
 */

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const SITE_URL = 'https://real-soc-scenarios.javiermapelli.workers.dev';

const ETAPAS = [
  { nombre: 'Compilando', comando: 'npm', args: ['run', 'build'] },
  { nombre: 'Verificando', comando: 'npm', args: ['run', 'check'] },
  { nombre: 'Publicando', comando: 'npx', args: ['wrangler', 'deploy'] },
];

const entorno = { ...process.env, SITE_URL };

for (const [i, etapa] of ETAPAS.entries()) {
  console.log(`\n[${i + 1}/${ETAPAS.length}] ${etapa.nombre}...\n`);

  const r = spawnSync(etapa.comando, etapa.args, {
    stdio: 'inherit',
    env: entorno,
    // Windows resuelve `npm` y `npx` a través del intérprete de comandos.
    shell: process.platform === 'win32',
  });

  if (r.status !== 0) {
    console.error(`\nSe cortó en "${etapa.nombre}". No se publicó nada.\n`);
    process.exit(r.status ?? 1);
  }
}

console.log(`\nPublicado en ${SITE_URL}\n`);
