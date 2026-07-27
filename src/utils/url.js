/**
 * Construcción de rutas internas independiente de dónde se publique el sitio.
 *
 * En Cloudflare Pages el sitio vive en la raíz del dominio. En GitHub Pages, si
 * es un sitio de proyecto, vive en `/<nombre-del-repo>/`. Un `href="/algo"`
 * escrito a mano funciona en el primer caso y rompe en el segundo.
 *
 * `import.meta.env.BASE_URL` lo resuelve Astro a partir de `base` en la
 * configuración, que a su vez sale de una variable de entorno. Así el mismo
 * commit sirve para los dos destinos sin tocar código.
 */

/**
 * @param {string} path Ruta absoluta desde la raíz del sitio, con o sin barra inicial.
 * @returns {string} Ruta con el prefijo de despliegue aplicado.
 */
export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL || '/';
  const left = base.endsWith('/') ? base.slice(0, -1) : base;
  const right = path.startsWith('/') ? path : `/${path}`;
  return `${left}${right}` || '/';
}
