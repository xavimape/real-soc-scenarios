import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, FONTS, LANGUAGES, STORAGE_KEYS, DEFAULTS } from '@/config/appearance.js';
import { t } from '@/i18n/strings.js';
import AboutModal from '@/components/AboutModal.jsx';
import '@/styles/dock.css';

/**
 * ConfigDock — barra flotante inferior con efecto glass.
 *
 * Centro: botón "Config" que despliega tema, tipografía e idioma.
 * Laterales: accesos a perfiles (pendientes de enlazar).
 *
 * Escribe data-theme / data-font / data-lang en <html> y los persiste.
 * El valor inicial ya lo aplicó el script inline de BaseLayout (anti-FOUC);
 * este componente solo se sincroniza al montar.
 */

const Icon = ({ path, size = 20 }) => (
  <svg
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const ICONS = {
  arrowLeft: <path d="M10.5 5.5 4.5 12l6 6.5M4.5 12H20" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  // Terminal con prompt: a tamaño de icono la silueta del gato de GitHub
  // se lee como una mancha, y esto dice "código" con la misma claridad.
  github: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M6.5 9.5 9.5 12l-3 2.5M12 15h5" />
    </>
  ),
  portfolio: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  contact: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
};

/**
 * Enlaces de perfil.
 *
 * Los que todavía no tienen destino quedan como `href: null` y se dibujan
 * apagados, con el motivo en el `title`. Es a propósito: un icono que no lleva
 * a ninguna parte es menos malo que uno que promete algo y no cumple, y el
 * hueco reservado evita que la fila se reacomode cuando se completen.
 */
const LINKS = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: ICONS.linkedin,
    href: 'https://www.linkedin.com/in/javiermapelli',
  },
  { key: 'github', label: 'GitHub', icon: ICONS.github, href: null },
  { key: 'portfolio', label: 'Portfolio', icon: ICONS.portfolio, href: null },
  { key: 'contact', label: 'Contact', icon: ICONS.contact, href: null },
];

function DockLink({ item, soonLabel }) {
  const title = item.href ? item.label : `${item.label} — ${soonLabel}`;

  if (!item.href) {
    return (
      <span className="dock-btn" aria-disabled="true" title={title} role="link">
        <Icon path={item.icon} />
      </span>
    );
  }

  return (
    <a
      className="dock-btn"
      href={item.href}
      title={title}
      aria-label={item.label}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon path={item.icon} />
    </a>
  );
}

/**
 * @param {object} props
 * @param {string} props.lang     Idioma de la página, resuelto en build.
 * @param {Record<string, string|null>} props.alternativas
 *   Esta misma página en cada idioma. `null` cuando la traducción no existe.
 */
export default function SiteHeader({
  lang = DEFAULTS.lang,
  alternativas = {},
  title = 'Real SOC Scenarios',
  subtitle = null,
  homeHref = null,
  backHref = null,
  backLabel = '',
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(DEFAULTS.theme);
  const [font, setFont] = useState(DEFAULTS.font);
  const centerRef = useRef(null);

  // El idioma ya no es estado: viene de la ruta. Tema y fuente sí, porque el
  // script inline los aplica antes de que este componente exista.
  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.dataset.theme || DEFAULTS.theme);
    setFont(root.dataset.font || DEFAULTS.font);
  }, []);

  // Cerrar con click afuera o con Escape.
  useEffect(() => {
    if (!open) return;

    const onClick = (e) => {
      if (!centerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const apply = (key, value) => {
    const root = document.documentElement;
    root.dataset[key] = value;
    try {
      localStorage.setItem(STORAGE_KEYS[key], value);
    } catch {
      /* storage bloqueado: el cambio igual se aplica en memoria */
    }
  };

  /**
   * Cambiar de idioma es navegar, no togglear.
   *
   * Antes esto escribía `data-lang` en <html> y el CSS ocultaba la mitad del
   * documento. Funcionaba para la interfaz y no para el contenido: el caso
   * seguía en español porque solo existía en español. Ahora cada idioma es una
   * página distinta, así que el selector va a la otra página.
   *
   * Es un enlace de verdad y no un botón con `location.href` por dos razones:
   * funciona sin JavaScript, y el router de Astro solo intercepta enlaces — con
   * `location.href` la navegación esquiva la transición y vuelve el parpadeo.
   *
   * Antes de irse se guardan dos cosas: el idioma elegido, para que la raíz lo
   * respete en la próxima visita, y la posición de scroll, porque es la misma
   * página en otro idioma y volver arriba sería perder el punto de lectura.
   */
  const antesDeIr = (idioma) => {
    try {
      localStorage.setItem(STORAGE_KEYS.lang, idioma);
      sessionStorage.setItem('soc-scroll', String(window.scrollY));
    } catch {
      /* storage bloqueado: la navegación igual funciona */
    }
  };


  return (
    /* Tres celdas independientes, no una píldora con todo adentro.
       Cada una tiene su propio fondo, su propio borde y su propio
       comportamiento: pasar el puntero por el título no despliega los enlaces
       de Config, y el latido del botón de volver no se contagia al resto. */
    <header className={`encabezado${backHref ? ' justificado' : ''}`}>
      <nav className={`dock${open ? ' open' : ''}`} aria-label={t('dock.config', lang)}>
        <DockLink item={LINKS[0]} soonLabel={t('dock.soon', lang)} />
        <DockLink item={LINKS[1]} soonLabel={t('dock.soon', lang)} />

      <div className={`dock-center${open ? ' open' : ''}`} ref={centerRef}>
        <button
          type="button"
          className="config-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className="label">{t('dock.config', lang)}</span>
          <Icon path={ICONS.gear} size={19} />
        </button>

        <div className="config-card" role="dialog" aria-label={t('dock.config', lang)}>
          {/* El idioma va primero: es lo único acá que cambia de página en vez
              de cambiar cómo se ve la que ya estás mirando. */}
          <section className="config-section">
            <span className="config-label">{t('dock.language', lang)}</span>
            <div className="option-row">
              {LANGUAGES.map((item) => {
                const destino = alternativas[item.value];
                const actual = lang === item.value;

                // El idioma actual no es un enlace a ninguna parte: es un
                // estado. Se marca con aria-current y no se puede clickear.
                if (actual) {
                  return (
                    <span key={item.value} className="option-btn" aria-current="true">
                      {item.label}
                    </span>
                  );
                }

                // Sin traducción no hay a dónde ir. Se muestra deshabilitado y
                // con el motivo, en vez de esconderlo: que falte se ve, y eso
                // es información para quien lee.
                if (!destino) {
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className="option-btn"
                      disabled
                      title={t('dock.noTranslation', lang)}
                    >
                      {item.label}
                    </button>
                  );
                }

                return (
                  <a
                    key={item.value}
                    className="option-btn"
                    href={destino}
                    hrefLang={item.value}
                    onClick={() => antesDeIr(item.value)}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </section>

          <section className="config-section">
            <span className="config-label">{t('dock.theme', lang)}</span>
            <div className="theme-grid">
              {THEMES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="theme-chip"
                  aria-pressed={theme === item.value}
                  onClick={() => {
                    setTheme(item.value);
                    apply('theme', item.value);
                  }}
                >
                  <span
                    className="swatch"
                    style={{
                      '--sw-bg': item.preview[0],
                      '--sw-accent': item.preview[1],
                      '--sw-critical': item.preview[2],
                    }}
                  />
                  {lang === 'en' ? item.labelEn ?? item.label : item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="config-section">
            <span className="config-label">{t('dock.font', lang)}</span>
            <div className="option-row">
              {FONTS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="option-btn"
                  data-font={item.value}
                  aria-pressed={font === item.value}
                  onClick={() => {
                    setFont(item.value);
                    apply('font', item.value);
                  }}
                >
                  {item.label}
                  <span className="hint">{item.hint}</span>
                </button>
              ))}
            </div>
          </section>

          </div>
        </div>

        <DockLink item={LINKS[2]} soonLabel={t('dock.soon', lang)} />
        <DockLink item={LINKS[3]} soonLabel={t('dock.soon', lang)} />
      </nav>

      {/* Celda 2 — la marca. El título es el mismo en todas las páginas. En la
          portada no enlaza a ninguna parte —ya estás ahí— y por eso deja de ser
          un enlace en vez de ser un enlace que no lleva a nada. */}
      <div className="marca">
        {homeHref ? (
          <a className="marca-texto" href={homeHref}>
            {title}
          </a>
        ) : (
          <span className="marca-texto" aria-current="page">
            {title}
          </span>
        )}

        {/* Solo en la portada. Sube acá para liberarle a las tarjetas el alto
            que ocupaba abajo, y va al mismo tamaño que el título porque no es
            un pie de página: es la otra mitad del encabezado. */}
        {subtitle && <span className="marca-sub">{subtitle}</span>}
      </div>

      {/* Celda 3 — volver. Lo único del encabezado que no aparece en todas las
          páginas: su ausencia en la portada marca que no estás dentro de nada.
          El hueco se reserva igual para que las otras dos celdas no se corran
          al pasar de una página de caso a la portada.

          El `aria-label` se mantiene aunque el texto sea visible: en pantallas
          angostas el texto se oculta y queda solo la flecha, y ahí es lo único
          que dice a dónde lleva. */}
      {backHref ? (
        <a className="volver" href={backHref} aria-label={backLabel}>
          <span className="pulso" aria-hidden="true" />
          <Icon path={ICONS.arrowLeft} size={16} />
          <span className="volver-texto">{backLabel}</span>
        </a>
      ) : (
        /* En la portada la celda no queda vacía: la ocupa el Acerca de. Sigue
           sin ser una salida —no navega— así que la señal original se conserva:
           desde el inicio no hay de dónde volver. */
        <AboutModal lang={lang} />
      )}
    </header>
  );
}
