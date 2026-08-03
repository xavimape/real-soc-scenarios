/**
 * Analítica, detrás de consentimiento.
 *
 * Nada de Google se descarga hasta que el visitante acepta. Antes de eso no hay
 * script de terceros, no hay cookie y no sale ni una petición: el aviso no es
 * decorativo, la carga ocurre de verdad recién cuando alguien toca "Aceptar".
 *
 * La decisión se guarda en `localStorage` bajo la misma convención `soc-*` que
 * el tema y el idioma, y solo tiene dos valores posibles. Que falte la clave no
 * es lo mismo que un rechazo: significa que todavía no se preguntó.
 */

export const CLAVE_CONSENTIMIENTO = 'soc-cookie-consent';
export const ACEPTADO = 'accepted';
export const RECHAZADO = 'rejected';

const ID_MEDICION = 'G-MHLDYWZ60L';

/** Lee la decisión guardada. Devuelve `null` si todavía no hay ninguna. */
export function leerConsentimiento() {
  try {
    return window.localStorage.getItem(CLAVE_CONSENTIMIENTO);
  } catch (e) {
    // Modo privado o almacenamiento bloqueado. Sin lugar donde guardar la
    // decisión, se trata como no preguntada y no se carga nada.
    return null;
  }
}

/** Guarda la decisión. Si es afirmativa, carga la analítica en el acto. */
export function guardarConsentimiento(valor) {
  try {
    window.localStorage.setItem(CLAVE_CONSENTIMIENTO, valor);
  } catch (e) {
    /* sin almacenamiento: la decisión vale para esta visita y nada más */
  }
  if (valor === ACEPTADO) cargarAnalitica();
}

/**
 * Inyecta gtag.js una sola vez por sesión de navegación.
 *
 * El guard está en `window` y no en un módulo: con las transiciones de vista, el
 * documento se reemplaza entero en cada navegación y los componentes vuelven a
 * montarse. Una bandera de módulo sobreviviría, pero `window` deja el estado a
 * la vista de cualquiera que quiera comprobarlo desde la consola.
 */
export function cargarAnalitica() {
  if (typeof window === 'undefined' || window.__socAnalitica) return;
  window.__socAnalitica = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ID_MEDICION}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  // `anonymize_ip` GA4 lo ignora porque ya recorta la IP siempre. Se deja
  // escrito igual: documenta la intención y no cuesta nada. Lo que sí cambia
  // algo es `send_page_view: false` — la vista inicial se manda desde
  // `registrarVista()`, que es el único lugar que sabe navegar con transiciones.
  gtag('config', ID_MEDICION, { anonymize_ip: true, send_page_view: false });
  registrarVista();
}

/**
 * Manda una vista de página.
 *
 * Hace falta a mano: con `<ClientRouter />` el sitio navega sin recargar, así
 * que gtag.js se ejecuta una vez y de ahí en más no se entera de nada. Sin esto
 * la analítica reportaría una sola página por visita, siempre la de entrada.
 */
export function registrarVista() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_title: document.title,
  });
}
