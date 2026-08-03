/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';
import {
  leerConsentimiento,
  guardarConsentimiento,
  cargarAnalitica,
  registrarVista,
  ACEPTADO,
  RECHAZADO,
} from '@/utils/analytics.js';
import '@/styles/cookie-banner.css';

/**
 * CookieConsent — aviso de cookies y puerta de la analítica.
 *
 * No renderiza nada en el HTML construido: la decisión vive en `localStorage`,
 * que no existe en build. Se monta, lee la decisión y recién ahí decide si
 * mostrar el aviso o cargar la analítica. Un banner servido en el HTML se le
 * aparecería por un instante a quien ya respondió que no.
 *
 * Requiere `client:load`.
 */

/* Un respiro antes de aparecer: apenas se abre la página compite con todo lo
   demás por la atención, y el aviso es lo menos importante que hay en pantalla. */
const DEMORA = 900;

export default function CookieConsent({ lang = DEFAULT_LANG }) {
  const [visible, setVisible] = useState(false);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    const decision = leerConsentimiento();

    if (decision === ACEPTADO) {
      // Ya cargada de una navegación anterior: el guard de `cargarAnalitica`
      // corta, y lo que corresponde mandar es la vista de esta página.
      if (window.__socAnalitica) registrarVista();
      else cargarAnalitica();
      return;
    }

    if (decision === RECHAZADO) return;

    const id = window.setTimeout(() => {
      setVisible(true);
      // Un cuadro de diferencia entre montar y animar: sin esto el navegador
      // pinta el estado final de una y la transición no ocurre.
      window.requestAnimationFrame(() => setEntrando(true));
    }, DEMORA);

    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  const responder = (valor) => {
    guardarConsentimiento(valor);
    setVisible(false);
  };

  return (
    <div
      className={`cookie-banner${entrando ? ' visible' : ''}`}
      role="region"
      aria-label={t('cookies.aria', lang)}
    >
      <span className="cookie-banner__text">
        {t('cookies.text', lang)}{' '}
        <a
          href={t('cookies.policyHref', lang)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('cookies.policy', lang)}
        </a>
      </span>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--sec"
          onClick={() => responder(RECHAZADO)}
        >
          {t('cookies.reject', lang)}
        </button>
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--pri"
          onClick={() => responder(ACEPTADO)}
        >
          {t('cookies.accept', lang)}
        </button>
      </div>
    </div>
  );
}
