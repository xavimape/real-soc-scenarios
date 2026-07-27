import FrameworkModal from './FrameworkModal.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

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
    nameKey: 'pyramid.lvlTtps',
    painKey: 'pyramid.painTough',
    color: 'var(--sev-critical)',
    width: '128px',
    hintKey: 'pyramid.hintTtps',
  },
  {
    key: 'tools',
    nameKey: 'pyramid.lvlTools',
    painKey: 'pyramid.painChallenging',
    color: 'var(--sev-high)',
    width: '148px',
    hintKey: 'pyramid.hintTools',
  },
  {
    key: 'artifacts',
    nameKey: 'pyramid.lvlArtifacts',
    painKey: 'pyramid.painAnnoying',
    color: 'var(--sev-medium)',
    width: '168px',
    hintKey: 'pyramid.hintArtifacts',
  },
  {
    key: 'domains',
    nameKey: 'pyramid.lvlDomains',
    painKey: 'pyramid.painSimple',
    color: 'var(--sev-low)',
    width: '190px',
    hintKey: 'pyramid.hintDomains',
  },
  {
    key: 'ips',
    nameKey: 'pyramid.lvlIps',
    painKey: 'pyramid.painEasy',
    color: 'var(--sev-info)',
    width: '212px',
    hintKey: 'pyramid.hintIps',
  },
  {
    key: 'hashes',
    nameKey: 'pyramid.lvlHashes',
    painKey: 'pyramid.painTrivial',
    color: 'var(--text-muted)',
    width: '234px',
    hintKey: 'pyramid.hintHashes',
  },
];

export default function PyramidOfPain({ lang = DEFAULT_LANG, caseId, indicators = {}, note }) {
  const used = LEVELS.filter((l) => (indicators[l.key] || []).length > 0).length;

  return (
    <FrameworkModal
      lang={lang}
      icon="pyramid"
      label={t('pyramid.label', lang)}
      title={t('pyramid.label', lang)}
      subtitle={`${t('pyramid.subtitle', lang)}${caseId ? ` · ${caseId}` : ''} · ${used}/6 ${t(
        'pyramid.stepsWithData',
        lang
      )}`}
    >
      {LEVELS.map((level) => {
        const values = indicators[level.key] || [];

        return (
          <div className="pop-row" key={level.key}>
            <div
              className="pop-step"
              style={{ background: level.color, width: level.width }}
            >
              <span className="name">{t(level.nameKey, lang)}</span>
              <span className="pain">{t(level.painKey, lang)}</span>
            </div>

            <div className="pop-values">
              {values.length > 0 ? (
                values.map((v) => (
                  <span className="val" key={v}>
                    {v}
                  </span>
                ))
              ) : (
                <span className="none">{t(level.hintKey, lang)}</span>
              )}
            </div>
          </div>
        );
      })}

      {note && <p className="fw-note">{note}</p>}
    </FrameworkModal>
  );
}
