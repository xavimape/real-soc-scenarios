# Registro de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [SemVer](https://semver.org/lang/es/).

Las fechas son las de los commits, no las de publicación de los casos: un caso
real lleva en su frontmatter la fecha del incidente que reconstruye, que puede
ser de hace diez años.

## [1.1.0] - 2026-08-08

### Contenido

- Cuatro casos reales nuevos, del `soc-017` al `soc-020`, completos en los dos
  idiomas: compromiso de la cadena de construcción de un producto, robo de datos
  con credenciales válidas contra un almacén en la nube, ingeniería social
  telefónica contra una mesa de ayuda, y explotación de cortafuegos de borde en
  veintidós empresas de energía vista desde un CERT sectorial.
- El catálogo queda en veinte casos: once reconstruyen incidentes documentados
  públicamente y nueve son escenarios construidos para el ejercicio.
- Valor nuevo en el esquema: `real_case_supply_chain`, distinto de
  `real_case_third_party` porque ahí el proveedor sufre un incidente y acá el
  producto llega ya comprometido y firmado por su autor.

### Encabezado

- Enlaces a GitHub y al portfolio del autor, que estaban reservados y atenuados.
- Botón de contacto que copia la dirección al portapapeles y lo avisa, sin abrir
  el cliente de correo. La dirección se arma en tiempo de ejecución y no aparece
  en claro en el sitio publicado.

### Verificación

- El verificador de catálogo comprueba las cifras que los README declaran sobre
  el catálogo: el total, el último identificador, el número escrito en letras, la
  cantidad de páginas y el reparto entre casos reales y construidos. Esas cifras
  no las rompe nadie: dejan de ser ciertas solas cuando entra un caso nuevo.
- El verificador de defangueo distingue el host propio del sitio y una lista de
  hosts completos permitidos, en lugar de aceptar dominios de dos niveles enteros.

### Corregido

- Los README declaraban ocho casos reales y ocho construidos cuando eran siete y
  nueve. Ahora la cifra se deriva del catálogo y se verifica.
- El patrón de voz imperativa del verificador de estilo cerraba con un límite de
  palabra que no funciona después de una vocal acentuada: cinco de sus diez
  términos no podían dispararse.

### Quitado

- El workflow de GitHub Pages. El despliegue es Cloudflare y siempre lo fue;
  mantener un segundo destino significaba una segunda dirección con el mismo
  contenido y cuatro acciones de terceros que envejecen.

## [1.0.0] - 2026-08-03

Primera versión completa: dieciséis casos en dos idiomas, sitio desplegado y
cadena de verificación cerrada.

### Contenido

- Dieciséis casos, del `soc-001` al `soc-016`, completos en español e inglés.
- Ocho reconstruyen incidentes documentados públicamente: Target 2013, MOVEit
  2023, Capital One 2019, Norsk Hydro 2019, Okta y LAPSUS$ 2022, Ucrania 2015,
  Contagious Interview y la campaña de explotación masiva de CVE-2023-34362.
- Ocho son escenarios construidos para el ejercicio, declarados como tales en su
  primera pantalla.
- Cobertura de matrices: ATT&CK Enterprise en casi todos, ICS en el 09 y el 13,
  Mobile en el 11. OWASP para API en el 12 y para modelos de lenguaje en el 16.
- El caso 14 es el único sin mapeo ATT&CK, a propósito: los falsos positivos no
  se mapean, porque inflan las estadísticas con actividad adversaria que no
  ocurrió.

### Sitio

- Portada con mazo de casos y globo con la geografía de los incidentes reales,
  ambos reescritos sin dependencias externas.
- Catorce temas visuales y cinco tipografías, persistidos y sin parpadeo al
  recargar.
- Una página por idioma, resuelta en build desde la ruta.
- Índice lateral con seguimiento del scroll en las páginas de caso.
- Acerca de en ventana, desde el encabezado de la portada.
- Marca propia: favicon de terminal y tarjeta para compartir.

### Privacidad y medición

- Google Analytics 4, detrás de consentimiento explícito: no se descarga el
  script, no se escribe cookie y no sale ninguna petición a Google hasta que el
  visitante acepta en el aviso.
- El aviso distingue tres estados —sin preguntar, aceptado y rechazado— y
  persiste la decisión. Rechazar y aceptar tienen el mismo peso visual.
- La vista de página se envía a mano en cada navegación, porque el sitio navega
  con transiciones y sin recarga.

### Verificación

- `verificar-catalogo`: coherencia entre archivos de caso — paridad de idiomas,
  correspondencia entre prefijo, `caseNumber` y `caseId`, y metadatos y
  coordenadas idénticos entre idiomas.
- `check-defang`: ningún indicador clicleable en el HTML publicado.
- `check-i18n`: ninguna página con texto del diccionario en el idioma equivocado.
- `contraste-globo`: los puntos del globo cumplen 3:1 contra el fondo de los
  catorce temas, que es el mínimo de WCAG 1.4.11 para gráficos no textuales.
- `verificar-estilo`: marcas en línea usadas como decoración en vez de como
  contraste, y reglas escritas en imperativo dirigido en los documentos
  públicos.
- `auditar-idioma-casos` e `i18n-audit`: informan, no rompen el build.

### Esquema

- Valores cerrados para `difficulty`, `severity` y `caseType`. Antes eran texto
  libre, y un valor mal escrito habría pasado la validación rompiendo en
  silencio el listado y el color del badge.

### Documentación

- README bilingüe, política de seguridad, guía de contribución y código de
  conducta.
- Licencia doble: MIT para el código, CC BY 4.0 para el contenido de los casos.

### Corregido

- El mazo de la portada mostraba solo los primeros cuatro casos. El corte se
  escribió cuando había exactamente cuatro y dejó de ser correcto en silencio al
  entrar el quinto.
- El informe de avisos de i18n cortaba en quince entradas y ocultaba el resto,
  incluidos los que el propio mensaje pedía revisar.
- El escáner de dependencias del servidor de desarrollo buscaba el runtime de
  React. Resuelto declarando el origen de JSX en cada archivo, que no depende de
  la configuración del empaquetador.

## [0.1.0] - 2026-07-27

Base del proyecto.

### Agregado

- Estructura con Astro, MDX y Preact.
- Sistema de temas y tipografías por custom properties.
- Componentes de caso: línea de tiempo, visor de indicadores, mapeo ATT&CK y
  ficha de cierre.
- Marcos de análisis en ventana: pirámide del dolor, Diamond Model y cadena de
  ataque.
- Colección de contenido tipada y rutas por idioma.
- Primeros casos y despliegue en Cloudflare Workers.
