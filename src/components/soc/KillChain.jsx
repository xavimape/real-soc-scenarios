import FrameworkModal from './FrameworkModal.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

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

const PHASE_KEYS = [
  'killchain.p1',
  'killchain.p2',
  'killchain.p3',
  'killchain.p4',
  'killchain.p5',
  'killchain.p6',
  'killchain.p7',
];

const STATE_KEYS = {
  blocked: 'killchain.blocked',
  reached: 'killchain.reached',
  'not-reached': 'killchain.notReached',
};

export default function KillChain({ lang = DEFAULT_LANG, caseId, phases = [], note }) {

  const rows = PHASE_KEYS.map((clave, i) => {
    const given = phases[i] || {};
    return {
      phase: given.phase || t(clave, lang),
      detail: given.detail,
      state: given.state || 'not-reached',
    };
  });

  const broken = rows.findIndex((r) => r.state === 'blocked');

  return (
    <FrameworkModal
      lang={lang}
      icon="chain"
      label={t('killchain.label', lang)}
      title={t('killchain.label', lang)}
      subtitle={
        broken >= 0
          ? `${t('killchain.brokenAt', lang)} ${broken + 1} ${t('killchain.of', lang)} 7${
              caseId ? ` · ${caseId}` : ''
            }`
          : `${t('killchain.phases', lang)}${caseId ? ` · ${caseId}` : ''}`
      }
    >
      <ol className="kc-list">
        {rows.map((r, i) => (
          <li className="kc-item" data-state={r.state} key={r.phase}>
            <span className="kc-num">{i + 1}</span>
            <div className="kc-body">
              <span className="phase">{r.phase}</span>
              <span className="kc-state">{t(STATE_KEYS[r.state], lang)}</span>
              {r.detail && <p className="detail">{r.detail}</p>}
            </div>
          </li>
        ))}
      </ol>

      {note && <p className="fw-note">{note}</p>}
    </FrameworkModal>
  );
}
