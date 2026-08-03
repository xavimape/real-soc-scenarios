/** @jsxImportSource preact */
import Icon from '@/components/Icon.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

/**
 * MitreATTACKMap — grilla de tácticas y técnicas MITRE ATT&CK usadas en el caso.
 * Props: caseId, tactics: [{ id, name, techniques: string[] }]
 */

const ATTACK_URL = 'https://attack.mitre.org';

const techniqueUrl = (t) => `${ATTACK_URL}/techniques/${String(t).replace('.', '/')}/`;
const tacticUrl = (id) => `${ATTACK_URL}/tactics/${id}/`;

export default function MitreATTACKMap({ lang = DEFAULT_LANG, caseId, tactics = [] }) {
  const total = tactics.reduce((n, t) => n + (t.techniques?.length || 0), 0);

  return (
    <section style={S.wrapper}>
      <header style={S.header}>
        <h3 style={S.title}>
          <Icon name="map" size="1em" style={{ marginRight: '0.4em', verticalAlign: '-0.12em' }} />
          MITRE ATT&CK
        </h3>
        <span style={S.meta}>
          {tactics.length} {t('attack.tactics', lang)} · {total}{' '}
          {t('attack.techniques', lang)}
          {caseId ? ` · ${caseId}` : ''}
        </span>
      </header>

      {tactics.length === 0 ? (
        <p style={S.empty}>{t('attack.empty', lang)}</p>
      ) : (
        <div style={S.grid}>
          {tactics.map((t) => (
            <div key={t.id || t.name} style={S.col}>
              <div style={S.colHead}>
                <a href={tacticUrl(t.id)} target="_blank" rel="noopener noreferrer" style={S.tacticName}>
                  {t.name}
                </a>
                {t.id && <span style={S.tacticId}>{t.id}</span>}
              </div>
              <ul style={S.techList}>
                {(t.techniques || []).map((tech) => (
                  <li key={tech} style={S.techItem}>
                    <a
                      href={techniqueUrl(tech)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={S.techLink}
                    >
                      {tech}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const S = {
  wrapper: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    margin: '1.5rem 0',
    background: 'var(--bg-elevated)',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '0.9rem',
  },
  title: { margin: 0, fontSize: '1.05rem', color: 'var(--text)' },
  meta: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  col: { border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' },
  colHead: {
    background: 'var(--bg-subtle)',
    padding: '0.5rem 0.6rem',
    borderBottom: '1px solid var(--border)',
  },
  tacticName: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text)',
    textDecoration: 'none',
  },
  tacticId: {
    fontSize: '0.66rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  techList: { listStyle: 'none', margin: 0, padding: '0.45rem' },
  techItem: { marginBottom: '0.3rem' },
  techLink: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: '5px',
    padding: '0.22rem 0.4rem',
    textDecoration: 'none',
  },
  empty: { color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 },
};
