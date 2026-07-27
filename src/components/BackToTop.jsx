import { useEffect, useState } from 'preact/hooks';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';
import '@/styles/back-to-top.css';

/**
 * BackToTop — vuelve al inicio de la página.
 *
 * Aparece recién después de un scroll considerable: en una página corta el botón
 * no aporta nada y solo tapa contenido. Va abajo a la derecha, lejos del dock de
 * configuración y de la barra del servidor de desarrollo.
 *
 * Requiere `client:load`.
 */

const THRESHOLD = 700;

export default function BackToTop({ lang = DEFAULT_LANG }) {
  const [visible, setVisible] = useState(false);
  const label = t('common.toTop', lang);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > THRESHOLD);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={`to-top${visible ? ' visible' : ''}`}
      onClick={toTop}
      aria-label={label}
      title={label}
      // Fuera de la vista no debe recibir foco al tabular.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19.5V5.5M5.5 12 12 5.5l6.5 6.5" />
      </svg>
    </button>
  );
}
