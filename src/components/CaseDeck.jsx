/** @jsxImportSource preact */
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import Icon from '@/components/Icon.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';
import '@/styles/deck.css';

/**
 * Mazo de casos destacados.
 *
 * ── Qué se tomó del ejemplo y qué no ───────────────────────────────────────
 * Del original se conserva la coreografía, que es lo único valioso: la de
 * adelante cae, las de atrás se promueven **antes** de que la caída termine, y
 * la que cayó vuelve al fondo del mazo. Ese solapamiento es lo que hace que se
 * lea como un mazo vivo y no como una lista rotando.
 *
 * No se conserva GSAP. Son 28 KB comprimidos —más que todo el JavaScript del
 * sitio— para animar cinco elementos entre posiciones conocidas de antemano.
 * Acá cada tarjeta tiene una transición CSS y el orden vive en el estado: el
 * navegador interpola, que es lo que sabe hacer.
 *
 * ── Por qué tiene controles ────────────────────────────────────────────────
 * Un mazo que rota solo no deja comparar ni elegir: muestra lo que quiere,
 * cuando quiere. Como pieza de entrada funciona; como único acceso a quince
 * casos, no. Por eso hay anterior, siguiente y pausa, se detiene al pasar el
 * puntero o al enfocar con el teclado, y la lista completa sigue debajo.
 */

const RETARDO = 5200;

/** Cuántas cartas se ven apiladas detrás de la del frente. */
const VISIBLES = 2;

/** Lo que dura el viaje de una carta. Debe coincidir con la transición del CSS. */
const TRANSICION = 1240;

/**
 * Posición de la carta que está entrando o saliendo: abajo, fuera del mazo y
 * transparente.
 *
 * Es la misma para las dos direcciones, y eso es lo que hace que el efecto se
 * lea igual hacia adelante que hacia atrás. Al avanzar, la del frente se va por
 * acá; al retroceder, la última entra por acá. En los dos casos hay algo que
 * cruza el borde de abajo mientras el resto se acomoda.
 */
const FUERA = {
  transform: 'translate3d(0, 190px, -180px) scale(0.9) skewY(6deg)',
  zIndex: 0,
  opacity: 0,
};

/** Cuánto sube cada carta respecto de la anterior. */
const ESCALON = 22;

/**
 * Posición de cada hueco del mazo. El índice 0 es el frente.
 *
 * El desplazamiento vertical arranca abajo y sube, en vez de arrancar en cero y
 * subir en negativo. Con lo segundo la carta más atrasada terminaba 66px por
 * encima del contenedor y se montaba sobre el título: el bloque no reservaba el
 * alto que en realidad ocupaba.
 */
function hueco(i) {
  return {
    transform: `translate3d(${i * 26}px, ${(VISIBLES - i) * ESCALON}px, ${
      i * -60
    }px) skewY(6deg)`,
    zIndex: 100 - i,
    opacity: i > VISIBLES ? 0 : 1,
  };
}

export default function CaseDeck({ lang = DEFAULT_LANG, cases = [] }) {
  const [orden, setOrden] = useState(() => cases.map((_, i) => i));
  const [saliendo, setSaliendo] = useState(null);
  const [entrando, setEntrando] = useState(null);
  const [pausado, setPausado] = useState(false);
  const [manual, setManual] = useState(false);

  const temporizador = useRef(null);
  const caida = useRef(null);
  const escenaRef = useRef(null);

  const quieto =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Adelanta una posición. La tarjeta del frente se marca como cayendo, y recién
   * cuando arrancó su caída se reordena el mazo — así las de atrás se promueven
   * con la caída todavía en el aire, que es el solapamiento del original.
   */
  // Los dos movimientos leen `orden` del estado en vez de usar el actualizador
  // funcional de `setOrden`. La primera versión llamaba a `setSaliendo` adentro
  // de ese actualizador, y un `setState` dentro del actualizador de otro no es
  // confiable: el orden cambiaba —el indicador de posición avanzaba— pero la
  // marca de salida nunca llegaba a aplicarse, así que la carta se reacomodaba
  // sin animarse. Se veía como que el efecto no existía.
  const avanzar = useCallback(() => {
    if (orden.length < 2) return;

    // La del frente se marca como saliendo y a la vez se manda al fondo del
    // mazo. Las dos posiciones —fuera abajo y fondo oculto— son transparentes,
    // así que cuando termina la salida y vuelve a su lugar del apilado, ese
    // salto no se ve. Sin eso habría que esperar a la animación para reordenar,
    // y las de atrás se promoverían tarde.
    setSaliendo(orden[0]);
    clearTimeout(caida.current);
    caida.current = setTimeout(() => setSaliendo(null), TRANSICION);

    setOrden([...orden.slice(1), orden[0]]);
  }, [orden]);

  /**
   * Retrocede, y con la misma coreografía al revés: la del frente se hunde en el
   * mazo y la última emerge desde abajo hasta el frente.
   *
   * Para que emerja hay que renderizarla primero en la posición de fuera y
   * recién después en la del frente — si se la pone directo en el frente, no hay
   * desde dónde animar y aparece de golpe. De ahí los dos cuadros de espera: uno
   * para que el navegador pinte el estado inicial, otro para asegurar que lo
   * registró antes de cambiarlo.
   */
  const retroceder = useCallback(() => {
    if (orden.length < 2) return;

    const ultima = orden.at(-1);
    setEntrando(ultima);
    setOrden([ultima, ...orden.slice(0, -1)]);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntrando(null));
    });
  }, [orden]);

  useEffect(() => {
    if (pausado || manual || quieto || cases.length < 2) return;

    temporizador.current = setInterval(avanzar, RETARDO);
    return () => clearInterval(temporizador.current);
  }, [pausado, manual, quieto, cases.length, avanzar]);

  useEffect(() => () => clearTimeout(caida.current), []);

  /**
   * Pasar de ficha con la rueda del mouse.
   *
   * Solo mientras la lista completa esté cerrada. Con la lista cerrada el mazo es
   * el contenido de la pantalla y capturar la rueda es lo esperable; en cuanto se
   * despliega la lista hay algo abajo que leer, y quedarse con la rueda pasaría
   * de atajo a obstáculo. Nadie tiene que enterarse de la regla: se comporta como
   * uno espera en cada uno de los dos estados.
   *
   * El tiempo de espera existe por los trackpads, que mandan decenas de eventos
   * por gesto. Sin él, un solo movimiento pasaría seis fichas.
   */
  useEffect(() => {
    const nodo = escenaRef.current;
    if (!nodo || cases.length < 2) return;

    let ultimo = 0;

    const alRodar = (e) => {
      const lista = document.getElementById('lista-casos');
      if (lista?.open) return;

      // Los gestos horizontales son de otro tipo de navegación; se dejan pasar.
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

      e.preventDefault();

      const ahora = Date.now();
      if (ahora - ultimo < 480 || Math.abs(e.deltaY) < 4) return;
      ultimo = ahora;

      setManual(true);
      if (e.deltaY > 0) avanzar();
      else retroceder();
    };

    // `passive: false` es obligatorio: sin eso el navegador ignora el
    // preventDefault y la página scrollea igual, además de pasar la ficha.
    nodo.addEventListener('wheel', alRodar, { passive: false });
    return () => nodo.removeEventListener('wheel', alRodar);
  }, [cases.length, avanzar, retroceder]);

  if (cases.length === 0) return null;

  const posicionDe = (i) => orden.indexOf(i);

  return (
    <div
      class="mazo"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <div class="mazo-escena" ref={escenaRef}>
        {cases.map((caso, i) => {
          const pos = posicionDe(i);
          const alFrente = pos === 0;
          const enTransito = saliendo === i || entrando === i;

          return (
            <article
              key={caso.href}
              class="mazo-carta"
              style={enTransito ? FUERA : hueco(pos)}
              aria-hidden={alFrente ? undefined : 'true'}
            >
              <span class="mazo-numero">#{caso.number}</span>

              <h3 class="mazo-titulo">
                {/* Solo la del frente es alcanzable con el tabulador: si no, el
                    teclado recorre cuatro enlaces que nadie está viendo. */}
                <a href={caso.href} tabIndex={alFrente ? 0 : -1}>
                  {caso.title}
                </a>
              </h3>

              <p class="mazo-desc">{caso.description}</p>

              <div class="mazo-meta">
                <span class="mazo-sev" data-sev={caso.severity.toLowerCase()}>
                  {caso.severity}
                </span>
                <span class="mazo-tag">{caso.difficulty}</span>
                <span class="mazo-tag">{caso.caseId}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div class="mazo-controles">
        <button
          type="button"
          class="mazo-btn"
          onClick={() => {
            setManual(true);
            retroceder();
          }}
          aria-label={t('deck.previous', lang)}
          title={t('deck.previous', lang)}
        >
          <Icon name="arrow-left" size={16} />
        </button>

        <ol class="mazo-puntos" aria-hidden="true">
          {cases.map((caso, i) => (
            <li key={caso.href} class={posicionDe(i) === 0 ? 'activo' : ''} />
          ))}
        </ol>

        <button
          type="button"
          class="mazo-btn girado"
          onClick={() => {
            setManual(true);
            avanzar();
          }}
          aria-label={t('deck.next', lang)}
          title={t('deck.next', lang)}
        >
          <Icon name="arrow-left" size={16} />
        </button>
      </div>
    </div>
  );
}
