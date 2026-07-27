import Icon from '@/components/Icon.jsx';

/**
 * Marcas en línea para el contenido de los casos.
 *
 * Se inyectan desde la página de caso con `<Content components={...} />`, así
 * que cada .mdx las usa sin importarlas.
 *
 *   - <Pass /> lo que la defensa sí cubre / se recomienda hacer
 *   - <Fail /> lo que falla o no se cubre
 *   - <Warn /> advertencia
 *
 * El significado no está solo en el color: cada marca lleva su forma y un
 * texto para lectores de pantalla.
 */

const base = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: '-0.15em',
  marginRight: '0.35em',
};

function Mark({ name, color, label }) {
  return (
    <span style={{ ...base, color }} role="img" aria-label={label}>
      <Icon name={name} size="1.05em" strokeWidth={2.2} />
    </span>
  );
}

export const Pass = () => (
  <Mark name="check" color="var(--verdict-clean)" label="Sí" />
);

export const Fail = () => (
  <Mark name="cross" color="var(--verdict-malicious)" label="No" />
);

export const Warn = () => (
  <Mark name="warn" color="var(--sev-high)" label="Atención" />
);

/** Mapa que se le pasa a <Content components={...} />. */
export const mdxComponents = { Pass, Fail, Warn };

export default mdxComponents;
