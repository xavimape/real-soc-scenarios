/**
 * Diccionario de la interfaz.
 *
 * REGLA, y no es negociable: **cada clave es un objeto `{ es, en }` explícito.**
 * Nunca se deriva el español de lo que ya está en el marcado ni se deja que una
 * clave sin traducir caiga al idioma por defecto. Un fallback silencioso produce
 * exactamente el bug que no se detecta: el sitio en inglés muestra español y
 * nadie lo nota hasta que lo ve un lector.
 *
 * `scripts/check-i18n.mjs` verifica sobre el HTML construido que ninguna clave
 * salga igual en los dos idiomas.
 *
 * Organizado por módulo. Cada componente usa su propio bloque; `common` es lo
 * compartido.
 */

export const LANGS = ['es', 'en'];
export const DEFAULT_LANG = 'es';

export const strings = {
  common: {
    // Dice "inicio" y no "índice": desde que el encabezado es global, el botón
    // aparece siempre en el mismo lugar y tiene que ser obvio a dónde lleva sin
    // que el lector sepa cómo llamamos internamente a esa página.
    back: { es: 'Volver al inicio', en: 'Back to home' },
    close: { es: 'Cerrar', en: 'Close' },
    none: { es: 'Ninguno', en: 'None' },
    toTop: { es: 'Volver arriba', en: 'Back to top' },
    continue: { es: 'Continuar', en: 'Continue' },
  },

  index: {
    subtitle: { es: 'casos de investigación SOC', en: 'SOC investigation cases' },
    // El índice inglés arrancó con un solo caso y decía "1 cases". Los dos
    // idiomas hacen el plural igual acá, así que alcanza con elegir la clave.
    subtitleOne: { es: 'caso de investigación SOC', en: 'SOC investigation case' },
    metaDescription: {
      es: 'Casos reales de investigación SOC, paso a paso.',
      en: 'Real SOC investigation cases, step by step.',
    },
    empty: {
      es: 'Todavía no hay casos publicados en este idioma.',
      en: 'No cases published in this language yet.',
    },
    openList: { es: 'Ver la lista completa', en: 'See the full list' },
    closeList: { es: 'Ocultar la lista', en: 'Hide the list' },
  },

  toc: {
    title: { es: 'En esta página', en: 'On this page' },
  },

  globe: {
    label: {
      es: 'Globo con la geografía de los casos',
      en: 'Globe showing where the cases took place',
    },
  },

  deck: {
    previous: { es: 'Caso anterior', en: 'Previous case' },
    next: { es: 'Caso siguiente', en: 'Next case' },
    pause: { es: 'Pausar el mazo', en: 'Pause the deck' },
    play: { es: 'Reanudar el mazo', en: 'Resume the deck' },
    open: { es: 'Abrir el caso', en: 'Open the case' },
  },

  timeline: {
    title: { es: 'Timeline del incidente', en: 'Incident timeline' },
    events: { es: 'eventos', en: 'events' },
    empty: { es: 'Sin eventos para mostrar.', en: 'No events to show.' },
    emptyOf: { es: 'Sin eventos para mostrar', en: 'No events to show' },
    filterSeverity: { es: 'Severidad', en: 'Severity' },
    filterActor: { es: 'Actor', en: 'Actor' },
    all: { es: 'Todos', en: 'All' },
    actorAttacker: { es: 'Atacante', en: 'Attacker' },
    actorDefender: { es: 'Defensor', en: 'Defender' },
    actorSystem: { es: 'Sistema', en: 'System' },
    actorUser: { es: 'Usuario', en: 'User' },
  },

  ioc: {
    empty: { es: 'Sin indicadores cargados.', en: 'No indicators loaded.' },
  },

  attack: {
    title: { es: 'MITRE ATT&CK', en: 'MITRE ATT&CK' },
    tactics: { es: 'tácticas', en: 'tactics' },
    techniques: { es: 'técnicas', en: 'techniques' },
    empty: { es: 'Sin tácticas mapeadas.', en: 'No tactics mapped.' },
  },

  report: {
    fallbackTitle: { es: 'Informe del incidente', en: 'Incident report' },
    copy: { es: 'Copiar informe (Markdown)', en: 'Copy report (Markdown)' },
    copied: { es: 'Copiado', en: 'Copied' },
  },

  pyramid: {
    label: { es: 'Pirámide del dolor', en: 'Pyramid of Pain' },
    subtitle: {
      es: 'Indicadores del caso por nivel de esfuerzo de evasión',
      en: 'Case indicators by evasion effort',
    },
    stepsWithData: { es: 'escalones con datos', en: 'levels with data' },
    of: { es: 'de', en: 'of' },
    lvlTtps: { es: 'TTP', en: 'TTPs' },
    lvlTools: { es: 'Herramientas', en: 'Tools' },
    lvlArtifacts: { es: 'Artefactos de red y host', en: 'Network and host artifacts' },
    lvlDomains: { es: 'Dominios', en: 'Domain names' },
    lvlIps: { es: 'Direcciones IP', en: 'IP addresses' },
    lvlHashes: { es: 'Hashes', en: 'Hash values' },
    painTough: { es: 'Duro', en: 'Tough' },
    painChallenging: { es: 'Molesto', en: 'Challenging' },
    painAnnoying: { es: 'Irritante', en: 'Annoying' },
    painSimple: { es: 'Simple', en: 'Simple' },
    painEasy: { es: 'Fácil', en: 'Easy' },
    painTrivial: { es: 'Trivial', en: 'Trivial' },
    hintTtps: {
      es: 'Cambiar cómo opera le cuesta rediseñar la campaña.',
      en: 'Changing how they operate means redesigning the campaign.',
    },
    hintTools: {
      es: 'Tiene que conseguir o escribir otra herramienta.',
      en: 'They have to find or write another tool.',
    },
    hintArtifacts: {
      es: 'Debe modificar su implante o su patrón de tráfico.',
      en: 'They must modify their implant or traffic pattern.',
    },
    hintDomains: {
      es: 'Registra otro. Le lleva minutos y unos dólares.',
      en: 'They register another one. Minutes and a few dollars.',
    },
    hintIps: {
      es: 'Rota de proveedor o de nodo de salida.',
      en: 'They rotate provider or exit node.',
    },
    hintHashes: {
      es: 'Un byte distinto y el hash ya no coincide.',
      en: 'One byte different and the hash no longer matches.',
    },
  },

  diamond: {
    label: { es: 'Diamond Model', en: 'Diamond Model' },
    subtitle: {
      es: 'Relación entre adversario, capacidad, infraestructura y víctima',
      en: 'How adversary, capability, infrastructure and victim connect',
    },
    adversary: { es: 'Adversario', en: 'Adversary' },
    capability: { es: 'Capacidad', en: 'Capability' },
    infrastructure: { es: 'Infraestructura', en: 'Infrastructure' },
    victim: { es: 'Víctima', en: 'Victim' },
    campaign: { es: 'Campaña', en: 'Campaign' },
    confidence: { es: 'Confianza', en: 'Confidence' },
  },

  killchain: {
    label: { es: 'Cyber Kill Chain', en: 'Cyber Kill Chain' },
    brokenAt: { es: 'Cadena cortada en la fase', en: 'Chain broken at phase' },
    of: { es: 'de', en: 'of' },
    phases: { es: 'Siete fases', en: 'Seven phases' },
    p1: { es: 'Reconocimiento', en: 'Reconnaissance' },
    p2: { es: 'Preparación del arma', en: 'Weaponization' },
    p3: { es: 'Entrega', en: 'Delivery' },
    p4: { es: 'Explotación', en: 'Exploitation' },
    p5: { es: 'Instalación', en: 'Installation' },
    p6: { es: 'Comando y control', en: 'Command and control' },
    p7: { es: 'Acciones sobre el objetivo', en: 'Actions on objectives' },
    blocked: { es: 'Cortada', en: 'Broken' },
    reached: { es: 'Alcanzada', en: 'Reached' },
    notReached: { es: 'No alcanzada', en: 'Not reached' },
  },

  marks: {
    yes: { es: 'Sí', en: 'Yes' },
    no: { es: 'No', en: 'No' },
    warning: { es: 'Atención', en: 'Warning' },
  },

  /**
   * Texto del Acerca de.
   *
   * Vive en el diccionario y no en un .mdx porque no es un caso: es interfaz, y
   * tiene que existir en los dos idiomas sí o sí. Los párrafos son claves
   * separadas para que `check-i18n` pueda contrastarlos uno por uno; un bloque
   * único sería una sola frase gigante y el verificador no diría nada útil.
   */
  /**
   * Aviso de cookies. La analítica no se carga hasta que alguien acepta acá.
   *
   * El texto nombra las dos normas que aplican: la Ley 25.326 porque el sitio se
   * publica desde Argentina, y el RGPD porque se lee desde Europa. Decir cuál
   * ampara el rechazo es más útil que un "usamos cookies" a secas.
   */
  cookies: {
    aria: { es: 'Aviso de cookies', en: 'Cookie notice' },
    text: {
      es: 'Este sitio usa Google Analytics para medir la audiencia. No se almacenan datos personales. Conforme a la Ley 25.326 (Argentina) y al RGPD podés rechazar.',
      en: 'This site uses Google Analytics to measure audience. No personal data is stored. Under Argentine Law 25,326 and the GDPR you may decline.',
    },
    policy: { es: 'Política de privacidad', en: 'Privacy policy' },
    policyHref: {
      es: 'https://policies.google.com/privacy?hl=es',
      en: 'https://policies.google.com/privacy',
    },
    accept: { es: 'Aceptar', en: 'Accept' },
    reject: { es: 'Rechazar', en: 'Decline' },
  },

  acerca: {
    label: { es: 'Acerca de', en: 'About' },
    title: { es: 'Acerca de este sitio', en: 'About this site' },
    subtitle: {
      es: 'Qué es, para quién, y con qué criterio está escrito',
      en: 'What it is, who it is for, and the standard it is written to',
    },
    queEs: {
      es: 'Real SOC Scenarios reúne casos de investigación de un centro de operaciones de seguridad, escritos para que se puedan estudiar completos: la alerta, el razonamiento, lo que se verificó y lo que quedó sin verificar.',
      en: 'Real SOC Scenarios collects security operations centre investigation cases, written so they can be studied end to end: the alert, the reasoning, what was verified and what was left unverified.',
    },
    paraQuien: {
      es: 'Está pensado para quien trabaja o quiere trabajar en el primer nivel de un SOC. No supone experiencia previa en cada tema, y sí supone ganas de leer con atención.',
      en: 'It is aimed at people working, or wanting to work, on the first line of a SOC. It assumes no prior experience with each topic, and it does assume a willingness to read carefully.',
    },
    dosTipos: {
      es: 'Hay dos clases de caso. Los reales reconstruyen incidentes documentados públicamente, y citan sus fuentes. Los educativos son escenarios construidos para el ejercicio, y lo dicen en su primera pantalla.',
      en: 'There are two kinds of case. The real ones reconstruct publicly documented incidents and cite their sources. The educational ones are scenarios built for the exercise, and they say so on their first screen.',
    },
    invariantes: {
      es: 'En todos los casos ningún indicador es inventado, se publican defangueados para que no se puedan clickear ni copiar por accidente, y ningún marco de análisis aparece si no hay datos reales para llenarlo.',
      en: 'In every case no indicator is invented, they are published defanged so they cannot be clicked or copied by accident, and no analysis framework appears unless there is real data to fill it.',
    },
    sintetico: {
      es: 'En los casos construidos, las direcciones IP salen de los rangos que las RFC reservan para documentación y los dominios usan el TLD .example. Nada de eso puede existir ni resolverse.',
      en: 'In the constructed cases, IP addresses come from the ranges the RFCs reserve for documentation and the domains use the .example TLD. None of it can exist or resolve.',
    },
    /**
     * En primera persona, y no como firma en tercera.
     *
     * El cuerpo de los casos ya está escrito así —"no incluyo el Diamond Model
     * acá", "no mapeo esto como técnica aparte"—, y son justamente los momentos
     * donde alguien se hace cargo de un criterio discutible. Una firma en
     * tercera persona en el único lugar donde el autor aparece contradiría esa
     * voz, y sonaría a ficha institucional de un sitio que escribe una sola
     * persona.
     */
    autor: {
      es: 'Lo escribo yo, Javier Mapelli, analista de seguridad. Si encontrás un error o no estás de acuerdo con alguna lectura, decímelo: el enlace a mi perfil está en la barra de arriba.',
      en: 'I write these cases myself. I am Javier Mapelli, a security analyst. If you find an error or disagree with a reading, tell me: the link to my profile is in the bar above.',
    },
  },

  dock: {
    config: { es: 'Config', en: 'Config' },
    theme: { es: 'Tema', en: 'Theme' },
    font: { es: 'Fuente', en: 'Font' },
    language: { es: 'Idioma', en: 'Language' },
    soon: { es: 'Próximamente', en: 'Coming soon' },
    noTranslation: {
      es: 'Este caso todavía no está en inglés',
      en: 'This case is not in Spanish yet',
    },
  },
};

/**
 * Devuelve el par `{ es, en }` de una clave con notación de punto.
 * Lanza si la clave no existe: un error en build es mejor que texto faltante
 * en producción.
 */
export function pair(key) {
  const value = key.split('.').reduce((acc, part) => acc?.[part], strings);

  if (!value || typeof value.es !== 'string' || typeof value.en !== 'string') {
    throw new Error(`i18n: la clave "${key}" no existe o no tiene ambos idiomas`);
  }

  return value;
}

/** Texto en un idioma concreto. Para atributos, donde no se pueden emitir ambos. */
export function t(key, lang = DEFAULT_LANG) {
  return pair(key)[lang] ?? pair(key)[DEFAULT_LANG];
}
