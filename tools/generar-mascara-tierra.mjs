/**
 * Genera la máscara de tierra firme que usa el globo del inicio.
 *
 * ── Por qué existe este script ─────────────────────────────────────────────
 * El ejemplo del que salió el globo descargaba el GeoJSON de Natural Earth
 * desde `raw.githubusercontent.com` **en cada visita**. Eso contradice D-005:
 * descartamos el enlace a Google Fonts justamente para no abrir una conexión a
 * un tercero que le filtre la IP a cada lector. Y agrega un punto de falla
 * ajeno — si ese archivo se mueve, el globo deja de dibujarse sin avisar.
 *
 * Acá la descarga pasa una sola vez, en la máquina de quien escribe, y lo que
 * se publica es un artefacto propio: una grilla de bits que dice, para cada
 * celda de latitud y longitud, si hay tierra. Pesa unos 2 KB.
 *
 *   node tools/generar-mascara-tierra.mjs
 *
 * Se vuelve a correr solo si se cambia la resolución. El resultado se commitea.
 */

import { writeFile } from 'node:fs/promises';
import process from 'node:process';

// Natural Earth 110m: la resolución más gruesa, que para un globo de 300px
// sobra. La de 50m pesa diez veces más y no se distingue a este tamaño.
const ORIGEN =
  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json';

const DESTINO = 'src/data/tierra.json';

// 360×180 celdas = un punto por grado. 64.800 bits = 8,1 KB antes de comprimir,
// y en base64 quedan 10,8 KB. El globo submuestrea desde acá según su densidad,
// así que conviene guardar fino una vez y decidir el detalle en el navegador.
const ANCHO = 360;
const ALTO = 180;

/**
 * Punto en polígono por conteo de cruces (algoritmo de Jordan).
 *
 * Se implementa a mano en vez de rasterizar con un lienzo porque en Node no hay
 * lienzo sin dependencias, y meter una para correr esto una vez sería absurdo.
 */
function dentroDelAnillo(lng, lat, anillo) {
  let dentro = false;

  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];

    const cruza = yi > lat !== yj > lat;
    if (cruza && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }

  return dentro;
}

/** Un polígono es su anillo exterior menos sus agujeros (lagos interiores). */
function dentroDelPoligono(lng, lat, poligono) {
  if (!dentroDelAnillo(lng, lat, poligono[0])) return false;

  for (let i = 1; i < poligono.length; i += 1) {
    if (dentroDelAnillo(lng, lat, poligono[i])) return false;
  }

  return true;
}

/** Caja envolvente, para descartar polígonos lejanos sin recorrerlos entero. */
function caja(poligono) {
  let minX = 180;
  let maxX = -180;
  let minY = 90;
  let maxY = -90;

  for (const [x, y] of poligono[0]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, maxX, minY, maxY };
}

const respuesta = await fetch(ORIGEN);

if (!respuesta.ok) {
  console.error(`No se pudo descargar el mapa: ${respuesta.status} ${respuesta.statusText}`);
  console.error(`Origen: ${ORIGEN}`);
  process.exit(1);
}

const geo = await respuesta.json();

// Se aplanan los polígonos y se precalcula su caja una sola vez.
const poligonos = [];

for (const feature of geo.features ?? []) {
  const g = feature.geometry;
  if (!g) continue;

  if (g.type === 'Polygon') poligonos.push(g.coordinates);
  else if (g.type === 'MultiPolygon') poligonos.push(...g.coordinates);
}

if (poligonos.length === 0) {
  console.error('El GeoJSON no trajo ningún polígono. ¿Cambió el formato del origen?');
  process.exit(1);
}

const conCaja = poligonos.map((p) => ({ p, c: caja(p) }));

const bits = new Uint8Array(Math.ceil((ANCHO * ALTO) / 8));
let celdasConTierra = 0;

for (let fila = 0; fila < ALTO; fila += 1) {
  // Centro de la celda, no su borde: en el borde un punto cae justo sobre la
  // costa y el resultado depende de errores de redondeo.
  const lat = 90 - ((fila + 0.5) / ALTO) * 180;

  for (let col = 0; col < ANCHO; col += 1) {
    const lng = ((col + 0.5) / ANCHO) * 360 - 180;

    let hayTierra = false;

    for (const { p, c } of conCaja) {
      if (lng < c.minX || lng > c.maxX || lat < c.minY || lat > c.maxY) continue;
      if (dentroDelPoligono(lng, lat, p)) {
        hayTierra = true;
        break;
      }
    }

    if (hayTierra) {
      const i = fila * ANCHO + col;
      bits[i >> 3] |= 128 >> (i & 7);
      celdasConTierra += 1;
    }
  }
}

const salida = {
  _nota:
    'Generado por tools/generar-mascara-tierra.mjs desde Natural Earth 110m. ' +
    'No editar a mano. Cada bit es una celda de 1°, de norte a sur y de oeste a este.',
  ancho: ANCHO,
  alto: ALTO,
  bits: Buffer.from(bits).toString('base64'),
};

await writeFile(DESTINO, `${JSON.stringify(salida)}\n`, 'utf8');

const porcentaje = ((celdasConTierra / (ANCHO * ALTO)) * 100).toFixed(1);

console.log(`Máscara generada en ${DESTINO}`);
console.log(`${ANCHO}×${ALTO} celdas · ${celdasConTierra} con tierra (${porcentaje}%)`);
console.log(`${(salida.bits.length / 1024).toFixed(1)} KB en base64`);

// La superficie terrestre es ~29% del planeta. Una proyección equirectangular
// exagera las latitudes altas, así que el número sale más alto — entre 30% y
// 40% es lo esperable. Fuera de ese rango, algo se generó mal.
if (Number(porcentaje) < 25 || Number(porcentaje) > 45) {
  console.error(`\nEl porcentaje de tierra no es plausible. Revisar antes de commitear.`);
  process.exit(1);
}
