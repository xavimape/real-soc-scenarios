/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';
import '@/styles/globe.css';

/**
 * Globo de puntos con los casos marcados en su geografía real.
 *
 * ── Por qué no usa three.js ────────────────────────────────────────────────
 * El ejemplo del que salió esta idea trae three.js: 260 KB comprimidos, diez
 * veces todo el JavaScript del sitio, para dibujar esferas de cuatro segmentos
 * que a 320 píxeles son indistinguibles de un punto. Acá se proyecta a mano
 * sobre un lienzo 2D. La matemática es una rotación y una proyección
 * ortográfica — quince líneas — y el resultado pesa lo que pesa este archivo.
 *
 * ── Por qué tiene marcadores ───────────────────────────────────────────────
 * Un globo girando en un sitio de seguridad es el cliché del mapa de amenazas:
 * bonito y sin información. Los marcadores salen de `locations` en el
 * frontmatter de cada caso, así que el globo dice algo verdadero sobre el
 * contenido y se puede clickear para entrar. Un caso sin geografía declarada
 * simplemente no aparece.
 */

// La máscara la genera `tools/generar-mascara-tierra.mjs` y se commitea. Se
// carga con `import.meta.glob` y no con un import directo a propósito: si el
// archivo todavía no se generó, glob devuelve un objeto vacío en vez de romper
// el build, y el globo cae a su modo de solo meridianos.
const modulos = import.meta.glob('../data/tierra.json', { eager: true });
const mascara = Object.values(modulos)[0]?.default ?? null;

const GRADOS = Math.PI / 180;

/** Punto de la esfera unitaria para una latitud y longitud, en grados. */
function aVector(lat, lng) {
  const a = lat * GRADOS;
  const b = lng * GRADOS;
  const cos = Math.cos(a);
  return { x: cos * Math.sin(b), y: Math.sin(a), z: cos * Math.cos(b) };
}

/** Decodifica la máscara a una lista de puntos de tierra, submuestreada. */
function puntosDeTierra(paso) {
  if (!mascara) return [];

  const bytes = Uint8Array.from(atob(mascara.bits), (c) => c.charCodeAt(0));
  const { ancho, alto } = mascara;
  const puntos = [];

  for (let fila = 0; fila < alto; fila += paso) {
    const lat = 90 - ((fila + 0.5) / alto) * 180;

    // Cerca de los polos los meridianos se juntan, así que un paso constante en
    // longitud amontona puntos arriba y abajo. Se compensa con el coseno de la
    // latitud, que es lo que hace que la nube se vea pareja sobre la esfera.
    const compensado = Math.max(1, Math.round(paso / Math.max(0.25, Math.cos(lat * GRADOS))));

    for (let col = 0; col < ancho; col += compensado) {
      const i = fila * ancho + col;
      if ((bytes[i >> 3] & (128 >> (i & 7))) === 0) continue;
      puntos.push(aVector(lat, ((col + 0.5) / ancho) * 360 - 180));
    }
  }

  return puntos;
}

/**
 * Resuelve los colores del tema a algo que el lienzo entienda.
 *
 * ── El error que costó encontrar ───────────────────────────────────────────
 * `getComputedStyle(el).getPropertyValue('--globe-dot')` NO devuelve un color:
 * devuelve el texto tal cual está escrito, `light-dark(#12903f, #00e03a)`. Las
 * propiedades personalizadas se resuelven recién donde se usan, no al leerlas.
 *
 * Y el lienzo, ante un color que no entiende, no avisa: `fillStyle` con un valor
 * inválido se ignora en silencio y queda el anterior — que al empezar es negro.
 * Por eso el globo salía en negro sobre los temas claros y parecía un problema
 * de elección de verde. No lo era: el verde nunca llegaba.
 *
 * La solución es hacer que el navegador resuelva la variable por nosotros:
 * se la aplica a la propiedad `color` de un elemento y se lee `color`, que sí
 * viene calculado como `rgb(...)`.
 */
const leerColores = (sonda) => {
  if (!sonda) return { punto: '#00e03a', grilla: 'rgba(0,224,58,.3)', marca: '#8affb0' };

  const de = (clase) => {
    const el = sonda.querySelector(`.${clase}`);
    return el ? getComputedStyle(el).color : '';
  };

  return {
    punto: de('sonda-punto') || '#00e03a',
    grilla: de('sonda-grilla') || 'rgba(0,224,58,.3)',
    marca: de('sonda-marca') || '#8affb0',
  };
};

export default function Globe({ lang = DEFAULT_LANG, markers = [], size = 320 }) {
  const lienzoRef = useRef(null);
  const sondaRef = useRef(null);
  const coloresRef = useRef(null);
  const [activo, setActivo] = useState(null);

  /**
   * Volver a leer los colores cuando cambia el tema.
   *
   * Esto es lo que hacía que el globo "desapareciera": los colores se resolvían
   * una sola vez al montar, así que al pasar de un tema oscuro a uno claro el
   * lienzo seguía pintando con el verde del tema anterior — que sobre fondo
   * claro es casi invisible. El CSS se actualizaba; el lienzo no, porque un
   * lienzo no hereda estilos, los copia.
   *
   * Se guardan en una referencia y no en el estado para no reconstruir la nube
   * de puntos con cada cambio de tema: el bucle de dibujo los lee en cada
   * cuadro y el cambio se ve en el siguiente.
   */
  useEffect(() => {
    const sonda = sondaRef.current;
    if (!sonda) return;

    const releer = () => {
      coloresRef.current = leerColores(sonda);
    };

    releer();

    const observador = new MutationObserver(releer);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;

    const ctx = lienzo.getContext('2d');
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = size * dpr;
    lienzo.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centro = size / 2;
    const radio = size * 0.42;

    const tierra = puntosDeTierra(3);
    if (!coloresRef.current) coloresRef.current = leerColores(sondaRef.current);

    // Inclinación fija: un globo perfectamente de perfil se lee como un círculo
    // de puntos. Con el eje inclinado se entiende que es una esfera.
    const inclinacion = 18 * GRADOS;
    const cosI = Math.cos(inclinacion);
    const sinI = Math.sin(inclinacion);

    let giro = -1.2;
    let cuadro = null;
    let arrastrando = false;
    let ultimoX = 0;
    let inercia = 0;

    /** Rotación sobre el eje polar + inclinación, y proyección ortográfica.
     *  Devuelve null si el punto cayó en la cara oculta. */
    const proyectar = (v) => {
      const cosG = Math.cos(giro);
      const sinG = Math.sin(giro);

      const x = v.x * cosG + v.z * sinG;
      const z0 = -v.x * sinG + v.z * cosG;

      const y = v.y * cosI - z0 * sinI;
      const z = v.y * sinI + z0 * cosI;

      if (z <= 0) return null;
      return { x: centro + x * radio, y: centro - y * radio, z };
    };

    const pantallaDeMarcador = (m) => proyectar(aVector(m.lat, m.lng));

    const dibujar = () => {
      const colores = coloresRef.current;
      ctx.clearRect(0, 0, size, size);

      // Meridianos y paralelos. Se dibujan siempre: si la máscara todavía no se
      // generó, esto es lo único que se ve y el globo igual funciona.
      ctx.strokeStyle = colores.grilla;
      ctx.lineWidth = 1;

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let arrancado = false;
        for (let lng = -180; lng <= 180; lng += 4) {
          const p = proyectar(aVector(lat, lng));
          if (!p) {
            arrancado = false;
            continue;
          }
          if (arrancado) ctx.lineTo(p.x, p.y);
          else {
            ctx.moveTo(p.x, p.y);
            arrancado = true;
          }
        }
        ctx.stroke();
      }

      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let arrancado = false;
        for (let lat = -90; lat <= 90; lat += 4) {
          const p = proyectar(aVector(lat, lng));
          if (!p) {
            arrancado = false;
            continue;
          }
          if (arrancado) ctx.lineTo(p.x, p.y);
          else {
            ctx.moveTo(p.x, p.y);
            arrancado = true;
          }
        }
        ctx.stroke();
      }

      // Los puntos de tierra.
      //
      // La profundidad la marca sobre todo el **tamaño**, no la transparencia.
      // La primera versión iba de 0.15 a 0.9 de opacidad, y un punto al 15%
      // sobre un fondo claro queda en 1,2:1 de contraste — invisible. Medido con
      // `tools/contraste-globo.mjs`: con ese desvanecido no había verde que
      // funcionara en ningún tema, así que el color nunca era el problema.
      //
      // Queda algo de desvanecido, de 0.75 a 1, porque el volumen se lee mejor
      // con las dos señales juntas. Pero el piso está donde el punto todavía se
      // ve, no donde desaparece.
      ctx.fillStyle = colores.punto;
      for (const v of tierra) {
        const p = proyectar(v);
        if (!p) continue;
        ctx.globalAlpha = 0.75 + p.z * 0.25;
        const lado = 1.1 + p.z * 1.1;
        ctx.fillRect(p.x - lado / 2, p.y - lado / 2, lado, lado);
      }
      ctx.globalAlpha = 1;

      // Los marcadores van al final para que ningún punto los tape.
      for (const m of markers) {
        const p = pantallaDeMarcador(m);
        if (!p) continue;

        // Mismo criterio que los puntos: el piso de opacidad está donde el
        // marcador todavía se distingue del fondo, no donde se desvanece.
        const opacidad = 0.75 + p.z * 0.25;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = colores.marca;
        ctx.globalAlpha = opacidad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = colores.marca;
        ctx.globalAlpha = opacidad * 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const animar = () => {
      if (!arrastrando) {
        giro += quieto ? 0 : 0.0022;
        giro += inercia;
        inercia *= 0.93;
        if (Math.abs(inercia) < 1e-5) inercia = 0;
      }
      dibujar();
      cuadro = requestAnimationFrame(animar);
    };

    // ── Interacción ────────────────────────────────────────────────────────
    const posicion = (e) => {
      const r = lienzo.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    /** Marcador bajo el puntero, si hay alguno cerca y en la cara visible. */
    const marcadorEn = ({ x, y }) => {
      for (const m of markers) {
        const p = pantallaDeMarcador(m);
        if (!p) continue;
        if (Math.hypot(p.x - x, p.y - y) <= 10) return m;
      }
      return null;
    };

    const alBajar = (e) => {
      arrastrando = true;
      ultimoX = e.clientX;
      inercia = 0;
      lienzo.setPointerCapture(e.pointerId);
    };

    const alMover = (e) => {
      const bajo = marcadorEn(posicion(e));
      setActivo(bajo);
      lienzo.style.cursor = bajo ? 'pointer' : arrastrando ? 'grabbing' : 'grab';

      if (!arrastrando) return;
      const dx = e.clientX - ultimoX;
      ultimoX = e.clientX;
      giro += dx * 0.006;
      inercia = dx * 0.0015;
    };

    const alSoltar = (e) => {
      arrastrando = false;
      lienzo.style.cursor = 'grab';
      if (lienzo.hasPointerCapture(e.pointerId)) lienzo.releasePointerCapture(e.pointerId);
    };

    const alClickear = (e) => {
      const m = marcadorEn(posicion(e));
      if (m?.href) window.location.href = m.href;
    };

    lienzo.addEventListener('pointerdown', alBajar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);
    lienzo.addEventListener('click', alClickear);

    animar();

    return () => {
      if (cuadro) cancelAnimationFrame(cuadro);
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointermove', alMover);
      lienzo.removeEventListener('pointerup', alSoltar);
      lienzo.removeEventListener('pointercancel', alSoltar);
      lienzo.removeEventListener('click', alClickear);
    };
  }, [markers, size]);

  return (
    <div class="globo" style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Sondas de color: el navegador resuelve `var()` al aplicarlo a `color`,
          y de ahí sale un `rgb(...)` que el lienzo sí entiende. Están ocultas a
          la vista y no aportan nada al contenido. */}
      <div class="globo-sondas" ref={sondaRef} aria-hidden="true">
        <span class="sonda-punto" />
        <span class="sonda-grilla" />
        <span class="sonda-marca" />
      </div>

      <canvas
        ref={lienzoRef}
        class="globo-lienzo"
        style={{ width: `${size}px`, height: `${size}px` }}
        role="img"
        aria-label={t('globe.label', lang)}
      />

      {activo && <p class="globo-etiqueta">{activo.label}</p>}

      {/* El lienzo no es navegable por teclado ni lo lee un lector de pantalla.
          Esta lista es el mismo contenido en forma accesible: enlaces reales a
          los mismos casos. Se oculta a la vista, no a la asistencia. */}
      {markers.length > 0 && (
        <ul class="globo-alterno">
          {markers.map((m) => (
            <li key={`${m.lat},${m.lng},${m.label}`}>
              {m.href ? <a href={m.href}>{m.label}</a> : m.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
