import Icon from '@/components/Icon.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

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
 * Estas marcas no se hidratan: salen del renderizado estático del MDX. Antes se
 * emitía el elemento entero dos veces, una por idioma, y el CSS ocultaba una.
 * Con una página por idioma eso deja de hacer falta: la página sabe su idioma y
 * la marca sale una sola vez, en el idioma correcto. De paso desaparece el
 * `aria-label` de la variante oculta, que rondaba el árbol de accesibilidad.
 *
 * El significado no está solo en el color: cada marca lleva su forma y su texto
 * para lectores de pantalla.
 */

const base = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: '-0.15em',
  marginRight: '0.35em',
};

function Mark({ name, color, labelKey, lang }) {
  return (
    <span style={{ ...base, color }} role="img" aria-label={t(labelKey, lang)}>
      <Icon name={name} size="1.05em" strokeWidth={2.2} />
    </span>
  );
}

/**
 * Mapa de marcas para un idioma concreto. La página de caso lo llama con su
 * propio idioma y se lo pasa a `<Content components={...} />`.
 */
export function marcasPara(lang = DEFAULT_LANG) {
  return {
    Pass: () => (
      <Mark name="check" color="var(--verdict-clean)" labelKey="marks.yes" lang={lang} />
    ),
    Fail: () => (
      <Mark
        name="cross"
        color="var(--verdict-malicious)"
        labelKey="marks.no"
        lang={lang}
      />
    ),
    Warn: () => (
      <Mark name="warn" color="var(--sev-high)" labelKey="marks.warning" lang={lang} />
    ),
  };
}

export default marcasPara;
