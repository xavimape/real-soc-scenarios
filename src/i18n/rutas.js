import { DEFAULT_LANG, LANGS } from './strings.js';

export { DEFAULT_LANG, LANGS };

/**
 * Rutas por idioma.
 *
 * Cada caso vive en `src/content/scenarios/<idioma>/<archivo>.mdx`, así que el
 * `id` que devuelve el loader ya trae el idioma adelante: `es/01-phishing`.
 * De ahí salen la URL y el idioma de la página, sin metadatos extra.
 *
 * La decisión de fondo está en D-014: una página, un idioma. Antes se emitían
 * los dos y el CSS ocultaba uno; eso duplicaba el peso del contenido y dejaba
 * texto en español en el HTML de la versión inglesa.
 */

/** `es/01-phishing` -> { lang: 'es', slug: '01-phishing' } */
export function partirId(id) {
  const corte = id.indexOf('/');

  if (corte === -1) {
    throw new Error(
      `Caso sin idioma: "${id}". Cada .mdx va dentro de src/content/scenarios/<idioma>/.`
    );
  }

  const lang = id.slice(0, corte);

  if (!LANGS.includes(lang)) {
    throw new Error(
      `Idioma desconocido "${lang}" en "${id}". Idiomas válidos: ${LANGS.join(', ')}.`
    );
  }

  return { lang, slug: id.slice(corte + 1) };
}

/** Ruta del índice de un idioma. Siempre con barra final. */
export function rutaIndice(lang) {
  return `/${lang}/`;
}

/** Ruta de un caso, a partir del idioma y del nombre de archivo sin extensión. */
export function rutaCaso(lang, slug) {
  return `/${lang}/scenarios/${slug}/`;
}

/**
 * Misma página en el otro idioma, para el selector del dock.
 *
 * Si el caso no está traducido, no hay a dónde ir: se devuelve el índice de ese
 * idioma en vez de una URL que daría 404. El dock lo marca como "no disponible".
 */
export function rutaEquivalente(lang, slug, disponibles) {
  if (!slug) return rutaIndice(lang);
  return disponibles.includes(`${lang}/${slug}`) ? rutaCaso(lang, slug) : null;
}
