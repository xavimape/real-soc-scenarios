import { useMemo, useState } from 'preact/hooks';
import Icon from '@/components/Icon.jsx';
import { t, DEFAULT_LANG } from '@/i18n/strings.js';

/**
 * AlertTimeline
 * Timeline vertical de eventos de un incidente SOC.
 *
 * Props:
 *  - caseId: string            -> id del caso, ej. "soc-001"
 *  - events: Array<{
 *      time: string,           -> "09:05", "07-18", "Unknown"...
 *      title: string,
 *      description: string,
 *      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
 *      actor: "Attacker" | "Defender" | "System" | "User" | string
 *    }>
 *  - title?: string            -> encabezado opcional
 *
 * Nota: sin `client:load` en el MDX se renderiza estático (igual se ve completo).
 * Con `client:load` se habilitan los filtros por severidad y actor.
 */

const SEVERITY = {
  CRITICAL: { color: 'var(--sev-critical)', bg: 'var(--sev-critical-bg)', label: 'CRITICAL' },
  HIGH: { color: 'var(--sev-high)', bg: 'var(--sev-high-bg)', label: 'HIGH' },
  MEDIUM: { color: 'var(--sev-medium)', bg: 'var(--sev-medium-bg)', label: 'MEDIUM' },
  LOW: { color: 'var(--sev-low)', bg: 'var(--sev-low-bg)', label: 'LOW' },
  INFO: { color: 'var(--sev-info)', bg: 'var(--sev-info-bg)', label: 'INFO' },
};

const ACTOR = {
  Attacker: { icon: 'target', color: 'var(--actor-attacker)', key: 'timeline.actorAttacker' },
  Defender: { icon: 'shield', color: 'var(--actor-defender)', key: 'timeline.actorDefender' },
  System: { icon: 'gear', color: 'var(--actor-system)', key: 'timeline.actorSystem' },
  User: { icon: 'user', color: 'var(--actor-user)', key: 'timeline.actorUser' },
};

const sev = (s) => SEVERITY[String(s || 'INFO').toUpperCase()] || SEVERITY.INFO;
const act = (a) => ACTOR[a] || { icon: 'gear', color: 'var(--text-muted)', key: null };

export default function AlertTimeline({ lang = DEFAULT_LANG, caseId, events = [], title }) {
  const encabezado = title ?? t('timeline.title', lang);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');

  const severities = useMemo(
    () => [...new Set(events.map((e) => String(e.severity || 'INFO').toUpperCase()))],
    [events]
  );
  const actors = useMemo(
    () => [...new Set(events.map((e) => e.actor).filter(Boolean))],
    [events]
  );

  const visible = events.filter((e) => {
    const okSev =
      severityFilter === 'ALL' || String(e.severity || 'INFO').toUpperCase() === severityFilter;
    const okActor = actorFilter === 'ALL' || e.actor === actorFilter;
    return okSev && okActor;
  });

  if (!events.length) {
    return (
      <div style={S.empty}>
        {t('timeline.emptyOf', lang)}
        {caseId ? ` (${caseId})` : ''}.
      </div>
    );
  }

  return (
    <section style={S.wrapper} aria-label={`Timeline ${caseId || ''}`}>
      <header style={S.header}>
        <div>
          <h3 style={S.title}>{encabezado}</h3>
          {caseId && <span style={S.caseId}>{caseId}</span>}
        </div>
        <span style={S.counter}>
          {visible.length} / {events.length} {t('timeline.events', lang)}
        </span>
      </header>

      <div style={S.filters}>
        <Filters
          label={t('timeline.filterSeverity', lang)}
          value={severityFilter}
          options={severities}
          onChange={setSeverityFilter}
          colorOf={(v) => sev(v).color}
          allLabel={t('timeline.all', lang)}
        />
        <Filters
          label={t('timeline.filterActor', lang)}
          value={actorFilter}
          options={actors}
          onChange={setActorFilter}
          colorOf={(v) => act(v).color}
          labelOf={(v) => (act(v).key ? t(act(v).key, lang) : v)}
          allLabel={t('timeline.all', lang)}
        />
      </div>

      <ol style={S.list}>
        {visible.map((e, i) => {
          const s = sev(e.severity);
          const a = act(e.actor);
          const isLast = i === visible.length - 1;

          return (
            <li key={`${e.time}-${e.title}-${i}`} style={S.item}>
              <div style={S.rail}>
                <span style={{ ...S.dot, background: s.color, color: 'var(--bg)' }} aria-hidden="true">
                  <Icon name={a.icon} size="16" strokeWidth={2} />
                </span>
                {!isLast && <span style={S.line} aria-hidden="true" />}
              </div>

              <div style={{ ...S.card, background: s.bg, borderLeft: `4px solid ${s.color}` }}>
                <div style={S.cardTop}>
                  <time style={S.time}>{e.time}</time>
                  <span style={{ ...S.badge, background: s.color }}>{s.label}</span>
                  {e.actor && (
                    <span style={{ ...S.actor, color: a.color, borderColor: a.color }}>
                      {a.key ? t(a.key, lang) : e.actor}
                    </span>
                  )}
                </div>
                <h4 style={S.eventTitle}>{e.title}</h4>
                {e.description && <p style={S.desc}>{e.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Filters({ label, value, options, onChange, colorOf, labelOf, allLabel }) {
  if (options.length <= 1) return null;

  return (
    <div style={S.filterGroup}>
      <span style={S.filterLabel}>{label}:</span>
      {['ALL', ...options].map((opt) => {
        const active = value === opt;
        const color = opt === 'ALL' ? 'var(--text-muted)' : colorOf(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              ...S.chip,
              color: active ? 'var(--bg)' : color,
              background: active ? color : 'transparent',
              borderColor: color,
            }}
          >
            {opt === 'ALL' ? allLabel : labelOf ? labelOf(opt) : opt}
          </button>
        );
      })}
    </div>
  );
}

const S = {
  wrapper: {
    fontFamily: 'inherit',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.25rem',
    margin: '1.5rem 0',
    background: 'var(--bg-elevated)',
    boxShadow: 'var(--shadow)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  title: { margin: 0, fontSize: '1.05rem', color: 'var(--text)' },
  caseId: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  counter: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  filters: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' },
  filterGroup: { display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' },
  filterLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '68px' },
  chip: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.18rem 0.55rem',
    borderRadius: '999px',
    border: '1px solid',
    cursor: 'pointer',
    lineHeight: 1.6,
  },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  item: { display: 'flex', gap: '0.85rem', alignItems: 'stretch' },
  rail: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30px', flexShrink: 0 },
  dot: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  line: { width: '2px', flex: 1, background: 'var(--border)', minHeight: '12px' },
  card: {
    flex: 1,
    borderRadius: 'var(--radius-sm)',
    padding: '0.7rem 0.9rem',
    marginBottom: '0.85rem',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  time: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  badge: {
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--bg)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  actor: {
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '0.05rem 0.4rem',
    borderRadius: '4px',
    border: '1px solid',
  },
  eventTitle: { margin: '0.35rem 0 0.2rem', fontSize: '0.95rem', color: 'var(--text)' },
  desc: { margin: 0, fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.5 },
  empty: {
    padding: '1rem',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
};
