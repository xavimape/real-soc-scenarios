import Icon from '@/components/Icon.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

/**
 * IOCViewer — render genérico de indicadores de compromiso.
 * Props: caseId, type ("email_headers" | "full_iocs" | ...), data (objeto)
 * Soporta valores: array de objetos, array de strings, objeto anidado o escalar.
 */

const VERDICT = {
  malicious: 'var(--verdict-malicious)',
  suspicious: 'var(--verdict-suspicious)',
  clean: 'var(--verdict-clean)',
  unknown: 'var(--text-muted)',
};

// El límite de palabra `\b` de JavaScript no reconoce las vocales acentuadas,
// así que `\b\w` capitalizaba la letra siguiente a la tilde: "autenticación"
// salía como "AutenticacióN". Se capitaliza solo después de un espacio.
const label = (k) =>
  String(k)
    .replace(/_/g, ' ')
    .replace(/(^|\s)(\S)/g, (_, sep, chr) => sep + chr.toUpperCase());

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function Verdict({ value }) {
  const color = VERDICT[String(value).toLowerCase()] || VERDICT.unknown;
  return <span style={{ ...S.verdict, background: color }}>{String(value)}</span>;
}

function Value({ k, v }) {
  if (Array.isArray(v)) return <span style={S.mono}>{v.join(', ')}</span>;
  if (isPlainObject(v)) return <KeyValue obj={v} />;
  if (/verdict|reputation/i.test(k)) return <Verdict value={v} />;
  return <span style={S.mono}>{String(v)}</span>;
}

function KeyValue({ obj }) {
  return (
    <dl style={S.dl}>
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} style={S.dlRow}>
          <dt style={S.dt}>{label(k)}</dt>
          <dd style={S.dd}>
            <Value k={k} v={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ rows }) {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} style={S.th}>{label(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} style={S.td}>
                  {r[c] === undefined ? '—' : <Value k={c} v={r[c]} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IOCViewer({ lang = DEFAULT_LANG, caseId, type = 'iocs', title, data = {} }) {
  const entries = Object.entries(data);

  return (
    <section style={S.wrapper}>
      <header style={S.header}>
        <h3 style={S.title}>
          <Icon name="search" size="1em" style={{ marginRight: '0.4em', verticalAlign: '-0.12em' }} />
          {title ?? label(type)}
        </h3>
        {caseId && <span style={S.caseId}>{caseId}</span>}
      </header>

      {entries.length === 0 && <p style={S.empty}>{t('ioc.empty', lang)}</p>}

      {entries.map(([key, value]) => {
        const isObjArray =
          Array.isArray(value) && value.length > 0 && value.every(isPlainObject);

        return (
          <div key={key} style={S.block}>
            <h4 style={S.blockTitle}>{label(key)}</h4>
            {isObjArray ? (
              <Table rows={value} />
            ) : isPlainObject(value) ? (
              <KeyValue obj={value} />
            ) : (
              <p style={S.mono}>{Array.isArray(value) ? value.join(', ') : String(value)}</p>
            )}
          </div>
        );
      })}
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
  header: { display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.75rem' },
  title: { margin: 0, fontSize: '1.05rem', color: 'var(--text)' },
  caseId: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  block: { marginTop: '0.9rem' },
  blockTitle: {
    margin: '0 0 0.4rem',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  },
  dl: { margin: 0 },
  dlRow: { display: 'flex', gap: '0.6rem', padding: '0.2rem 0', flexWrap: 'wrap' },
  dt: { minWidth: '150px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 },
  dd: { margin: 0, fontSize: '0.82rem', color: 'var(--text)' },
  mono: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', overflowWrap: 'anywhere' },
  tableWrap: { overflowX: 'auto', scrollbarWidth: 'thin' },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' },
  th: {
    textAlign: 'left',
    padding: '0.4rem 0.6rem',
    background: 'var(--bg-subtle)',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '0.4rem 0.6rem',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  },
  verdict: {
    color: 'var(--bg)',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  empty: { color: 'var(--text-muted)', fontSize: '0.9rem' },
};
