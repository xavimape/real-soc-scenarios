import FrameworkModal from './FrameworkModal.jsx';

/**
 * DiamondModel — los cuatro vértices de Caltagirone, Pendergast y Betz (2013).
 *
 * A diferencia del timeline, que cuenta cuándo pasó cada cosa, esto muestra
 * cómo se conectan adversario, capacidad, infraestructura y víctima. Es el
 * modelo del pivoteo: desde un vértice conocido se llega a los otros.
 *
 * Props:
 *  - caseId, campaign, confidence: string
 *  - adversary, capability, infrastructure, victim:
 *      { value: string, detail?: string }
 *  - note?: string
 *
 * No incluir el componente si el caso no tiene datos reales en los cuatro
 * vértices. Un diamante a medio llenar enseña menos que no ponerlo.
 *
 * Requiere `client:load`.
 */

const VERTEX_COLOR = {
  adversary: 'var(--actor-attacker)',
  capability: 'var(--sev-high)',
  infrastructure: 'var(--sev-low)',
  victim: 'var(--actor-user)',
};

function Node({ kind, title, data }) {
  if (!data) return null;

  return (
    <div className={`dm-node dm-${kind}`}>
      <span className="vertex" style={{ color: VERTEX_COLOR[kind] }}>
        {title}
      </span>
      <span className="value">{data.value}</span>
      {data.detail && <p className="detail">{data.detail}</p>}
    </div>
  );
}

export default function DiamondModel({
  caseId,
  campaign,
  confidence,
  adversary,
  capability,
  infrastructure,
  victim,
  note,
}) {
  return (
    <FrameworkModal
      icon="diamond"
      label="Diamond Model"
      title="Diamond Model"
      subtitle={`Relación entre adversario, capacidad, infraestructura y víctima${
        caseId ? ` · ${caseId}` : ''
      }`}
    >
      {(campaign || confidence) && (
        <div className="dm-meta">
          {campaign && <span className="chip">Campaña: {campaign}</span>}
          {confidence && <span className="chip">Confianza: {confidence}</span>}
        </div>
      )}

      <div className="dm-grid">
        <Node kind="adversary" title="Adversario" data={adversary} />
        <Node kind="capability" title="Capacidad" data={capability} />

        <div className="dm-center" aria-hidden="true">
          <svg viewBox="0 0 80 80" width="70" height="70" fill="none" stroke="currentColor">
            <path
              d="M40 6 74 40 40 74 6 40Z"
              strokeWidth="1.5"
              opacity="0.35"
              strokeLinejoin="round"
            />
            <path d="M6 40h68M40 6v68" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>

        <Node kind="infrastructure" title="Infraestructura" data={infrastructure} />
        <Node kind="victim" title="Víctima" data={victim} />
      </div>

      {note && <p className="fw-note">{note}</p>}
    </FrameworkModal>
  );
}
