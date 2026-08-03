/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import Icon from '@/components/Icon.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

/**
 * IncidentReportGenerator — ficha de cierre del incidente + export a Markdown.
 * Props: caseId, summary: { incidentId, title, status, severity, resolutionCode, ... }
 * El botón de copiar requiere `client:load` en el MDX.
 */

const SEVERITY_COLOR = {
  CRITICAL: 'var(--sev-critical)',
  HIGH: 'var(--sev-high)',
  MEDIUM: 'var(--sev-medium)',
  LOW: 'var(--sev-low)',
  INFO: 'var(--sev-info)',
};

const STATUS_COLOR = {
  resolved: 'var(--verdict-clean)',
  closed: 'var(--verdict-clean)',
  open: 'var(--verdict-malicious)',
  'in progress': 'var(--verdict-suspicious)',
};

const label = (k) =>
  String(k).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function toMarkdown(caseId, summary) {
  const lines = [`# Incident Report${caseId ? ` — ${caseId}` : ''}`, ''];
  for (const [k, v] of Object.entries(summary)) {
    lines.push(`- **${label(k)}:** ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  }
  return lines.join('\n');
}

export default function IncidentReportGenerator({ lang = DEFAULT_LANG, caseId, summary = {} }) {
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(summary);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(caseId, summary));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const sevColor = SEVERITY_COLOR[String(summary.severity).toUpperCase()] || 'var(--text-muted)';
  const statColor = STATUS_COLOR[String(summary.status).toLowerCase()] || 'var(--text-muted)';

  return (
    <section style={S.wrapper}>
      <header style={S.header}>
        <div>
          <h3 style={S.title}>
            <Icon name="document" size="1em" style={{ marginRight: '0.4em', verticalAlign: '-0.12em' }} />
            {summary.title || t('report.fallbackTitle', lang)}
          </h3>
          <span style={S.caseId}>
            {summary.incidentId || caseId || ''}
          </span>
        </div>
        <div style={S.badges}>
          {summary.severity && (
            <span style={{ ...S.badge, background: sevColor }}>{summary.severity}</span>
          )}
          {summary.status && (
            <span style={{ ...S.badge, background: statColor }}>{summary.status}</span>
          )}
        </div>
      </header>

      <dl style={S.dl}>
        {entries
          .filter(([k]) => !['title', 'severity', 'status', 'incidentId'].includes(k))
          .map(([k, v]) => (
            <div key={k} style={S.row}>
              <dt style={S.dt}>{label(k)}</dt>
              <dd style={S.dd}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
            </div>
          ))}
      </dl>

      <button type="button" onClick={copy} style={S.button}>
        <Icon name={copied ? 'check' : 'clipboard'} size="1em" style={{ verticalAlign: '-0.12em' }} />
        {' '}
        {copied ? t('report.copied', lang) : t('report.copy', lang)}
      </button>
    </section>
  );
}

const S = {
  wrapper: {
    border: '1px solid var(--border)',
    borderLeft: '4px solid var(--accent)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    margin: '1.5rem 0',
    background: 'var(--bg-elevated)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: { margin: 0, fontSize: '1.02rem', color: 'var(--text)' },
  caseId: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  badges: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  badge: {
    color: 'var(--bg)',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  dl: { margin: '0.9rem 0 0' },
  row: { display: 'flex', gap: '0.6rem', padding: '0.22rem 0', flexWrap: 'wrap' },
  dt: { minWidth: '150px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' },
  dd: { margin: 0, fontSize: '0.82rem', color: 'var(--text)' },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.1rem',
    marginTop: '1rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.8rem',
    cursor: 'pointer',
  },
};
