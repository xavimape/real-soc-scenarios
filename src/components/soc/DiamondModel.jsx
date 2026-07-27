import FrameworkModal from './FrameworkModal.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

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
  lang = DEFAULT_LANG,
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
      lang={lang}
      icon="diamond"
      label={t('diamond.label', lang)}
      title={t('diamond.label', lang)}
      subtitle={`${t('diamond.subtitle', lang)}${caseId ? ` · ${caseId}` : ''}`}
    >
      {(campaign || confidence) && (
        <div className="dm-meta">
          {campaign && (
            <span className="chip">
              {t('diamond.campaign', lang)}: {campaign}
            </span>
          )}
          {confidence && (
            <span className="chip">
              {t('diamond.confidence', lang)}: {confidence}
            </span>
          )}
        </div>
      )}

      <div className="dm-grid">
        <Node kind="adversary" title={t('diamond.adversary', lang)} data={adversary} />
        <Node kind="capability" title={t('diamond.capability', lang)} data={capability} />

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

        <Node kind="infrastructure" title={t('diamond.infrastructure', lang)} data={infrastructure} />
        <Node kind="victim" title={t('diamond.victim', lang)} data={victim} />
      </div>

      {note && <p className="fw-note">{note}</p>}
    </FrameworkModal>
  );
}
