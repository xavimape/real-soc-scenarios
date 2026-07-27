/**
 * Set de iconos de interfaz.
 *
 * Grilla de 24 con trazo de 1.8: los iconos de `src/assets/svg/icons/` están
 * dibujados en grilla de 100 para mostrarse grandes, y a tamaño de texto ese
 * trazo queda por debajo del píxel. Esta grilla es la que se lee bien en línea.
 *
 * Todos heredan color (`currentColor`) y tamaño del contenedor.
 */

export const PATHS = {
  // Flecha de retorno, con el asta más larga que la punta
  'arrow-left': <path d="M10.5 5.5 4.5 12l6 6.5M4.5 12H20" />,

  check: <path d="M4.5 12.5 9.5 18 20 5.5" />,

  cross: <path d="M6 6l12 12M18 6L6 18" />,

  // Triángulo de aviso, ligeramente más ancho que alto
  warn: (
    <>
      <path d="M12 4 22 20H2Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),

  // Punto de impacto: anillos desalineados, no concéntricos perfectos
  target: (
    <>
      <circle cx="11.5" cy="12.5" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 12 20.5 3.5" />
    </>
  ),

  shield: (
    <>
      <path d="M12 3 20 6.5v6c0 4.5-4.8 7.5-8 8.5-3.2-1-8-4-8-8.5v-6Z" />
      <path d="M8.5 12.5 11 15l4.5-5" />
    </>
  ),

  // Engranaje de 6 dientes rectos, sin la corona de 8 puntas habitual
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3.3M12 18.7V22M4.4 7.4l2.9 1.6M16.7 15l2.9 1.6M19.6 7.4l-2.9 1.6M7.3 15l-2.9 1.6" />
    </>
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c1-4 3.9-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),

  // Lupa inclinada hacia abajo a la izquierda
  search: (
    <>
      <circle cx="13" cy="10" r="6.5" />
      <path d="M8.4 14.6 3 20" />
    </>
  ),

  // Retícula de tácticas: tres columnas de alto distinto
  map: (
    <>
      <rect x="2.5" y="4.5" width="5" height="15" rx="1" />
      <rect x="9.5" y="4.5" width="5" height="10.5" rx="1" />
      <rect x="16.5" y="4.5" width="5" height="12.5" rx="1" />
    </>
  ),

  document: (
    <>
      <path d="M6 2.5h8l4.5 4.8V21.5H6Z" />
      <path d="M14 2.5v5h4.5" />
      <path d="M9 13h6M9 16.5h4" />
    </>
  ),

  // Pirámide de tres escalones, con la base desbordando a la derecha
  pyramid: (
    <>
      <path d="M12 3 21.5 20H2.5Z" />
      <path d="M8.2 12.5h7.6M5.4 16.5h13.2" />
    </>
  ),

  // Rombo del Diamond Model, con sus dos ejes
  diamond: (
    <>
      <path d="M12 2.5 21 12l-9 9.5L3 12Z" />
      <path d="M3 12h18M12 2.5v19" />
    </>
  ),

  // Eslabones de la cadena, desalineados
  chain: (
    <>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M13.2 6.8 15 5a4.2 4.2 0 0 1 6 6l-1.8 1.8" />
      <path d="M10.8 17.2 9 19a4.2 4.2 0 0 1-6-6l1.8-1.8" />
    </>
  ),

  clipboard: (
    <>
      <path d="M8.5 4.5H6.5A1.5 1.5 0 0 0 5 6v14.5h14V6a1.5 1.5 0 0 0-1.5-1.5h-2" />
      <rect x="8.5" y="2.5" width="7" height="4" rx="1" />
    </>
  ),
};

export default function Icon({ name, size = '1em', strokeWidth = 1.8, style, ...rest }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, ...style }}
      {...rest}
    >
      {path}
    </svg>
  );
}
