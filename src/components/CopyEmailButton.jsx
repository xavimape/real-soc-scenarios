/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

/**
 * CopyEmailButton — el botón de contacto del encabezado.
 *
 * Copia la dirección al portapapeles y muestra un aviso chico abajo. No abre el
 * cliente de correo: abrirlo es una acción con efecto —una ventana nueva, a
 * veces una aplicación que tarda en arrancar— y quien solo quería la dirección
 * termina cerrando cosas. Quien sí quiera escribir tiene el botón en el aviso.
 *
 * ── La dirección no viaja en claro ──────────────────────────────────────────
 * Se arma en tiempo de ejecución desde sus partes. No es criptografía y no
 * pretende serlo: los recolectores de direcciones leen el HTML y el texto de
 * los archivos JavaScript buscando el patrón `algo@algo.tld`, y ese patrón acá
 * no existe hasta que alguien hace clic. Contra un recolector que ejecute el
 * código, no sirve; contra los que raspan texto, sí.
 *
 * Props:
 *  - lang: idioma de la página
 *
 * Requiere `client:load`: sin hidratar, el botón no copia nada.
 */

const USUARIO = ['javier', 'mapelli'];
const DOMINIO = ['gmail', 'com'];
const direccion = () => `${USUARIO.join('')}@${DOMINIO.join('.')}`;

/* Tiempo que el aviso queda a la vista si nadie lo toca. Suficiente para leerlo
   sin quedar colgado en pantalla cuando la persona ya siguió con lo suyo. */
const DURACION = 6000;

export default function CopyEmailButton({ lang = DEFAULT_LANG }) {
  const [estado, setEstado] = useState(null); // null | 'copiado' | 'manual'
  const [entrando, setEntrando] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const cerrar = () => {
    window.clearTimeout(temporizador.current);
    setEntrando(false);
    setEstado(null);
  };

  const mostrar = (cual) => {
    window.clearTimeout(temporizador.current);
    setEstado(cual);
    window.requestAnimationFrame(() => setEntrando(true));
    // El aviso manual no se va solo: si no se pudo copiar, la persona tiene que
    // poder seleccionar el texto con calma.
    if (cual === 'copiado') {
      temporizador.current = window.setTimeout(cerrar, DURACION);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(direccion());
      mostrar('copiado');
    } catch (e) {
      // Sin permiso, sin contexto seguro o con la API ausente. Se muestra la
      // dirección para copiarla a mano en vez de fallar en silencio.
      mostrar('manual');
    }
  };

  const etiqueta = t('dock.contactLabel', lang);

  return (
    <>
      <button
        type="button"
        className="dock-btn"
        onClick={copiar}
        title={etiqueta}
        aria-label={etiqueta}
      >
        <svg
          className="icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
      </button>

      {estado && (
        <div
          className={`aviso-correo${entrando ? ' visible' : ''}`}
          role="status"
          aria-live="polite"
        >
          {estado === 'copiado' ? (
            <>
              <span className="aviso-correo__texto">{t('dock.contactCopied', lang)}</span>
              <div className="aviso-correo__acciones">
                <a
                  className="aviso-correo__btn aviso-correo__btn--pri"
                  href={`mailto:${direccion()}`}
                  onClick={cerrar}
                >
                  {t('dock.contactSend', lang)}
                </a>
                <button
                  type="button"
                  className="aviso-correo__btn"
                  onClick={cerrar}
                >
                  {t('dock.contactClose', lang)}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="aviso-correo__texto">
                {t('dock.contactManual', lang)}{' '}
                <code className="aviso-correo__dir">{direccion()}</code>
              </span>
              <div className="aviso-correo__acciones">
                <button
                  type="button"
                  className="aviso-correo__btn"
                  onClick={cerrar}
                >
                  {t('dock.contactClose', lang)}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
