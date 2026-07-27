import FrameworkModal from './FrameworkModal.jsx';

/**
 * KillChain — las siete fases de Lockheed Martin (2011).
 *
 * Acá no interesa la secuencia por sí misma (eso ya lo cuenta el timeline con
 * datos más ricos) sino en qué eslabón se cortó la cadena: cuanto antes se
 * corta, menos alcanzó a hacer el atacante.
 *
 * Props:
 *  - caseId: string
 *  - phases: [{ phase?: string, detail?: string, state: 'blocked' | 'reached' | 'not-reached' }]
 *      El array puede tener menos de 7 entradas; se completan con las fases
 *      restantes en estado 'not-reached'.
 *  - note?: string
 *
 * Sirve sobre todo en casos contenidos, donde se puede señalar el eslabón que
 * falló y el que salvó la situación. En una intrusión que llegó hasta el final
 * aporta poco: son siete filas todas en rojo.
 *
 * Requiere `client:load`.
 */

const PHASES = [
  'Reconocimiento',
  'Preparación del arma',
  'Entrega',
  'Explotación',
  'Instalación',
  'Comando y control',
  'Acciones sobre el objetivo',
];

const STATE_LABEL = {
  blocked: 'Cortada',
  reached: 'Alcanzada',
  'not-reached': 'No alcanzada',
};

export default function KillChain({ caseId, phases = [], note }) {
  const rows = PHASES.map((name, i) => {
    const given = phases[i] || {};
    return {
      phase: given.phase || name,
      detail: given.detail,
      state: given.state || 'not-reached',
    };
  });

  const broken = rows.findIndex((r) => r.state === 'blocked');

  return (
    <FrameworkModal
      icon="chain"
      label="Cyber Kill Chain"
      title="Cyber Kill Chain"
      subtitle={
        broken >= 0
          ? `Cadena cortada en la fase ${broken + 1} de 7${caseId ? ` · ${caseId}` : ''}`
          : `Siete fases${caseId ? ` · ${caseId}` : ''}`
      }
    >
      <ol className="kc-list">
        {rows.map((r, i) => (
          <li className="kc-item" data-state={r.state} key={r.phase}>
            <span className="kc-num">{i + 1}</span>
            <div className="kc-body">
              <span className="phase">{r.phase}</span>
              <span className="kc-state">{STATE_LABEL[r.state]}</span>
              {r.detail && <p className="detail">{r.detail}</p>}
            </div>
          </li>
        ))}
      </ol>

      {note && <p className="fw-note">{note}</p>}
    </FrameworkModal>
  );
}
