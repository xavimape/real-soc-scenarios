import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, FONTS, LANGUAGES, STORAGE_KEYS, DEFAULTS, UI } from '@/config/appearance.js';
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

/** Enlaces de perfil — pendientes de completar con las URLs reales. */
const LINKS = [
  { key: 'linkedin', label: 'LinkedIn', icon: ICONS.linkedin, href: null },
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

export default function ConfigDock() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(DEFAULTS.theme);
  const [font, setFont] = useState(DEFAULTS.font);
  const [lang, setLang] = useState(DEFAULTS.lang);
  const centerRef = useRef(null);

  // Al montar, tomamos lo que el script inline ya puso en <html>.
  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.dataset.theme || DEFAULTS.theme);
    setFont(root.dataset.font || DEFAULTS.font);
    setLang(root.dataset.lang || DEFAULTS.lang);
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
    if (key === 'lang') root.lang = value;
    try {
      localStorage.setItem(STORAGE_KEYS[key], value);
    } catch {
      /* storage bloqueado: el cambio igual se aplica en memoria */
    }
  };

  const t = UI[lang] ?? UI[DEFAULTS.lang];

  return (
    <nav className={`dock${open ? ' open' : ''}`} aria-label={t.config}>
      <DockLink item={LINKS[0]} soonLabel={t.soon} />
      <DockLink item={LINKS[1]} soonLabel={t.soon} />

      <div className={`dock-center${open ? ' open' : ''}`} ref={centerRef}>
        <button
          type="button"
          className="config-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className="label">{t.config}</span>
          <Icon path={ICONS.gear} size={19} />
        </button>

        <div className="config-card" role="dialog" aria-label={t.config}>
          <section className="config-section">
            <span className="config-label">{t.theme}</span>
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
            <span className="config-label">{t.font}</span>
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

          <section className="config-section">
            <span className="config-label">{t.language}</span>
            <div className="option-row">
              {LANGUAGES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="option-btn"
                  aria-pressed={lang === item.value}
                  onClick={() => {
                    setLang(item.value);
                    apply('lang', item.value);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <DockLink item={LINKS[2]} soonLabel={t.soon} />
      <DockLink item={LINKS[3]} soonLabel={t.soon} />
    </nav>
  );
}
