import FrameworkModal from './FrameworkModal.jsx';

/**
 * PyramidOfPain — ubica los indicadores del caso en los seis escalones de la
 * pirámide de David Bianco (2013).
 *
 * La idea que enseña: cuanto más arriba está el indicador que detectás, más le
 * cuesta al atacante evadirte. Un hash lo cambia recompilando; sus TTP no.
 *
 * Props:
 *  - caseId: string
 *  - indicators: {
 *      hashes?: string[], ips?: string[], domains?: string[],
 *      artifacts?: string[], tools?: string[], ttps?: string[]
 *    }
 *  - note?: string   -> lectura del caso concreto
 *
 * Incluir el componente solo si el caso tiene indicadores en varios escalones:
 * con datos en uno solo, la pirámide no enseña nada.
 *
 * Requiere `client:load`.
 */

const LEVELS = [
  {
    key: 'ttps',
    name: 'TTPs',
    pain: 'Duro',
    color: 'var(--sev-critical)',
    width: '128px',
    hint: 'Cambiar cómo opera le cuesta rediseñar la campaña.',
  },
  {
    key: 'tools',
    name: 'Herramientas',
    pain: 'Molesto',
    color: 'var(--sev-high)',
    width: '148px',
    hint: 'Tiene que conseguir o escribir otra herramienta.',
  },
  {
    key: 'artifacts',
    name: 'Artefactos de red y host',
    pain: 'Irritante',
    color: 'var(--sev-medium)',
    width: '168px',
    hint: 'Debe modificar su implante o su patrón de tráfico.',
  },
  {
    key: 'domains',
    name: 'Dominios',
    pain: 'Simple',
    color: 'var(--sev-low)',
    width: '190px',
    hint: 'Registra otro. Le lleva minutos y unos dólares.',
  },
  {
    key: 'ips',
    name: 'Direcciones IP',
    pain: 'Fácil',
    color: 'var(--sev-info)',
    width: '212px',
    hint: 'Rota de proveedor o de nodo de salida.',
  },
  {
    key: 'hashes',
    name: 'Hashes',
    pain: 'Trivial',
    color: 'var(--text-muted)',
    width: '234px',
    hint: 'Un byte distinto y el hash ya no coincide.',
  },
];

export default function PyramidOfPain({ caseId, indicators = {}, note }) {
  const used = LEVELS.filter((l) => (indicators[l.key] || []).length > 0).length;

  return (
    <FrameworkModal
      icon="pyramid"
      label="Pirámide del dolor"
      title="Pirámide del dolor"
      subtitle={`Indicadores del caso por nivel de esfuerzo de evasión${
        caseId ? ` · ${caseId}` : ''
      } · ${used}/6 escalones con datos`}
    >
      {LEVELS.map((level) => {
        const values = indicators[level.key] || [];

        return (
          <div className="pop-row" key={level.key}>
            <div
              className="pop-step"
              style={{ background: level.color, width: level.width }}
            >
              <span className="name">{level.name}</span>
              <span className="pain">{level.pain}</span>
            </div>

            <div className="pop-values">
              {values.length > 0 ? (
                values.map((v) => (
                  <span className="val" key={v}>
                    {v}
                  </span>
                ))
              ) : (
                <span className="none">{level.hint}</span>
              )}
            </div>
          </div>
        );
      })}

      {note && <p className="fw-note">{note}</p>}
    </FrameworkModal>
  );
}
