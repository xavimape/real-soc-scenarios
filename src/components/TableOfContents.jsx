/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';
import '@/styles/toc.css';

/**
 * Índice lateral del caso, con marcado de la sección que se está leyendo.
 *
 * Los títulos vienen de `render(entry)`, que Astro resuelve en build: la lista
 * sale en el HTML servido y se ve sin JavaScript. Esta isla solo agrega el
 * seguimiento del scroll.
 *
 * ── Por qué no se usa IntersectionObserver para decidir la sección activa ──
 * El observer avisa cuándo un elemento entra o sale de una zona, no cuál estás
 * leyendo. Con secciones más altas que la ventana hay tramos donde ningún
 * encabezado está dentro de la zona de detección y el índice se queda sin
 * marcar; con secciones cortas hay varios a la vez y parpadea entre ellos.
 *
 * La pregunta real es otra: cuál es el último encabezado que quedó por encima
 * de la línea de lectura. Eso se responde midiendo, y siempre tiene respuesta.
 * El costo es una medición por cuadro sobre unos veinte elementos, que es nada,
 * y se limita con requestAnimationFrame para no medir dos veces en el mismo
 * cuadro.
 */

/** Altura del dock flotante más aire. Debe coincidir con el `scroll-margin-top`
 *  de los encabezados en `toc.css`, o el clic y el marcado se desincronizan. */
const LINEA_DE_LECTURA = 96;

export default function TableOfContents({ lang = DEFAULT_LANG, headings = [] }) {
  const [activo, setActivo] = useState(headings[0]?.slug ?? null);
  const [enViaje, setEnViaje] = useState(false);
  const [lava, setLava] = useState(null);

  const cajaRef = useRef(null);
  const cuerpoRef = useRef(null);
  const viajeRef = useRef(null);

  // ── Qué sección se está leyendo ──────────────────────────────────────────
  useEffect(() => {
    if (headings.length === 0) return;

    let pendiente = false;

    const medir = () => {
      pendiente = false;

      // Al final de la página gana siempre la última sección: si no, las
      // secciones cortas del cierre nunca llegan a marcarse.
      const fondo =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;

      if (fondo) {
        setActivo(headings.at(-1).slug);
        return;
      }

      let actual = headings[0].slug;

      for (const h of headings) {
        const el = document.getElementById(h.slug);
        if (!el) continue;
        if (el.getBoundingClientRect().top - LINEA_DE_LECTURA <= 0) actual = h.slug;
        else break;
      }

      setActivo(actual);
    };

    const alScrollear = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener('scroll', alScrollear, { passive: true });
    window.addEventListener('resize', alScrollear);

    return () => {
      window.removeEventListener('scroll', alScrollear);
      window.removeEventListener('resize', alScrollear);
    };
  }, [headings]);

  // ── La lava ──────────────────────────────────────────────────────────────
  // Un solo bloque detrás de la lista que se mueve y se estira hasta el ítem
  // activo, en vez de un fondo por ítem que aparece y desaparece. Se mide con
  // useLayoutEffect para que la primera posición no se vea saltar.
  useLayoutEffect(() => {
    const cuerpo = cuerpoRef.current;
    if (!cuerpo || !activo) return;

    const item = cuerpo.querySelector(`[data-slug="${CSS.escape(activo)}"]`);
    if (!item) return;

    setLava({ top: item.offsetTop, alto: item.offsetHeight });

    // Con veintitantas entradas el índice tiene su propio scroll y la sección
    // activa puede quedar fuera de vista.
    //
    // Acá NO va `scrollIntoView`: ese método recorre todos los ancestros
    // scrolleables, y el último es el documento. Usarlo hacía que cada cambio
    // de sección moviera la página entera — el índice peleaba contra el scroll
    // del lector. Se toca `scrollTop` del contenedor y nada más.
    const caja = cajaRef.current;

    if (caja && caja.scrollHeight > caja.clientHeight) {
      const borde = 8;
      const r = item.getBoundingClientRect();
      const rc = caja.getBoundingClientRect();

      if (r.top < rc.top) caja.scrollTop -= rc.top - r.top + borde;
      else if (r.bottom > rc.bottom) caja.scrollTop += r.bottom - rc.bottom + borde;
    }

    // El estiramiento dura lo que dura el viaje. Se apaga con temporizador y no
    // con transitionend porque son varias propiedades animándose y el evento
    // llegaría una vez por cada una.
    setEnViaje(true);
    clearTimeout(viajeRef.current);
    viajeRef.current = setTimeout(() => setEnViaje(false), 380);

    return () => clearTimeout(viajeRef.current);
  }, [activo, headings]);

  if (headings.length === 0) return null;

  return (
    <nav class="toc" aria-labelledby="toc-title" ref={cajaRef}>
      <p class="toc-title" id="toc-title">
        {t('toc.title', lang)}
      </p>

      {/* La lava va fuera del <ul>, no como un <li> más.
          Dos razones. Una de comportamiento: mezclar hijos con `key` y sin
          `key` en la misma lista permite que el reconciliador destruya y
          recree el que no la tiene, y un nodo recién creado no transiciona
          desde ninguna parte — aparece ya puesto en su destino y el efecto no
          se ve nunca. Otra de semántica: un elemento decorativo no es un ítem
          de la lista de navegación. */}
      <div class="toc-cuerpo" ref={cuerpoRef}>
        {lava && (
          <span
            class={`toc-lava${enViaje ? ' viajando' : ''}`}
            aria-hidden="true"
            style={{ transform: `translateY(${lava.top}px)`, height: `${lava.alto}px` }}
          />
        )}

        <ul class="toc-list">
          {headings.map((h) => (
            <li key={h.slug} data-slug={h.slug} class={`toc-item nivel-${h.depth}`}>
              <a
                href={`#${h.slug}`}
                class="toc-link"
                aria-current={activo === h.slug ? 'true' : undefined}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
