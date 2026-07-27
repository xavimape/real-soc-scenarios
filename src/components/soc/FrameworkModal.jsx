import { useEffect, useRef, useState } from 'preact/hooks';
import Icon from '@/components/Icon.jsx';
import '@/styles/framework.css';

/**
 * Shell compartido de los marcos de análisis.
 *
 * Renderiza un botón y una ventana con el contenido. Son material de apoyo:
 * no forman parte del informe del caso, se abren si el analista los quiere.
 *
 * Usa <dialog> nativo con showModal(), que ya trae cierre con Escape, foco
 * atrapado dentro de la ventana y `inert` sobre el resto de la página.
 *
 * Requiere `client:load` en el .mdx: sin hidratar, el botón no abre nada.
 */

export default function FrameworkModal({ icon, label, title, subtitle, children }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // El usuario puede cerrar con Escape o con click en el backdrop:
  // hay que enterarse para no quedar desincronizado.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onClose = () => setOpen(false);
    el.addEventListener('close', onClose);
    return () => el.removeEventListener('close', onClose);
  }, []);

  const onBackdropClick = (e) => {
    if (e.target === ref.current) setOpen(false);
  };

  return (
    <>
      <button type="button" className="fw-trigger" onClick={() => setOpen(true)}>
        {icon && <Icon name={icon} size="1.05em" />}
        {label}
      </button>

      <dialog ref={ref} className="fw-dialog" onClick={onBackdropClick}>
        <header className="fw-head">
          <div>
            <h3 className="fw-title">{title}</h3>
            {subtitle && <p className="fw-sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="fw-close"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <Icon name="cross" size="14" />
          </button>
        </header>

        <div className="fw-body">{children}</div>
      </dialog>
    </>
  );
}
