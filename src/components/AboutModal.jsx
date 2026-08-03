/** @jsxImportSource preact */
import FrameworkModal from '@/components/soc/FrameworkModal.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

/**
 * Acerca de — ventana del encabezado de la portada.
 *
 * Ocupa la tercera celda, la misma que en las páginas de caso tiene el botón de
 * volver. Esa celda estaba vacía en la portada por una razón que sigue
 * valiendo: su ausencia marcaba que no estás dentro de nada. Poner acá el
 * Acerca de no rompe eso —sigue sin ser una salida— y aprovecha un hueco que ya
 * se reservaba.
 *
 * Reusa `FrameworkModal` entero. La mecánica de una ventana modal accesible
 * —cerrar con Escape, cerrar clickeando el fondo, atrapar el foco adentro— ya
 * estaba resuelta ahí, y reescribirla habría dejado dos implementaciones que se
 * desincronizan.
 *
 * El texto sale del diccionario, párrafo por párrafo, para que `check-i18n`
 * pueda contrastarlos por separado.
 */
export default function AboutModal({ lang = DEFAULT_LANG }) {
  const p = (clave) => t(`acerca.${clave}`, lang);

  return (
    <FrameworkModal
      lang={lang}
      icon="info"
      label={t('acerca.label', lang)}
      title={t('acerca.title', lang)}
      subtitle={t('acerca.subtitle', lang)}
      triggerClass="volver acerca-btn"
    >
      <div className="acerca-cuerpo">
        <p>{p('queEs')}</p>
        <p>{p('paraQuien')}</p>
        <p>{p('dosTipos')}</p>
        <p>{p('invariantes')}</p>
        <p>{p('sintetico')}</p>
        <p>{p('autor')}</p>
      </div>
    </FrameworkModal>
  );
}
