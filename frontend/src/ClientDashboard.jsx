import { useState } from 'react'
import { titlesForProductIds } from './productCatalog.js'

function displayNameFromEmail(email) {
  const local = String(email).split('@')[0]?.replace(/[.+_]/g, ' ').trim() || 'there'
  return local
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function formatSessionDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

const SUBSCRIPTION_PLAN_LABEL = {
  basic: 'Basic · $150/mo',
  plus: 'Plus · $200/mo',
  premium: 'Premium · $300/mo',
}

/** Same layout and demo content for every tenant; only the top bar shows company + email. */
const WORKSPACE = {
  sub: 'Real-time production monitoring — shared HENRY workspace for all clients.',
  pills: [
    { className: 'green', label: 'Running 12' },
    { className: 'yellow', label: 'Idle 4' },
    { className: 'red', label: 'Alert 3' },
  ],
  anomaly: 'Anomaly: Line 07 — vibration spike detected',
  oee: '94%',
  mtbf: '120h',
  unitsLabel: 'Units / hr',
  alertsLead:
    'Live AI watches your lines and critical assets. Unacknowledged items escalate per your runbook — supervisors stay in the loop.',
  alerts: [
    {
      id: 'a1',
      severity: 'high',
      title: 'Line 07 — spindle vibration',
      detail: 'Exceeded baseline for 6 min. Operator notified; maintenance ticket opened.',
      when: '12 min ago',
    },
    {
      id: 'a2',
      severity: 'high',
      title: 'Press Cell 2 — tonnage drift',
      detail: 'Peak force 4% below recipe for 8 cycles. Engineering paged; last similar event was worn die set.',
      when: '28 min ago',
    },
    {
      id: 'a3',
      severity: 'med',
      title: 'Robot R-12 — cycle drift',
      detail: '+8% vs last week. Suggested torque recalibration after next break.',
      when: '48 min ago',
    },
    {
      id: 'a4',
      severity: 'med',
      title: 'Chiller loop B — supply temp',
      detail: 'Running 1.2°C above setpoint for 25 min. No line stop; facilities ticket auto-created.',
      when: '1 hr ago',
    },
    {
      id: 'a5',
      severity: 'low',
      title: 'Compressor room — temperature',
      detail: 'Trending up; no stoppage; facilities team on digest.',
      when: '2 hr ago',
    },
  ],
  alertsFoot: '14 machines monitored · escalation to supervisor if unacked 15 min',
  reportsLead:
    'Shift summaries roll up what happened on the floor: throughput, holds, and sign-offs.',
  reports: [
    {
      title: 'Yesterday 2nd shift',
      text: 'OEE 91.2% (target 90%). Assembly West beat plan by 240 units; Line 03 changeover added 22 min downtime.',
    },
    {
      title: 'Quality summary',
      text: '99.4% first-pass yield. Three holds on lot M-884; quarantine released after QA sign-off.',
    },
    {
      title: 'Labor & training',
      text: 'New operators on packaging — HENRY flagged slower cycles first 4 hours; coach checklist attached.',
    },
  ],
  insightsLead:
    'HENRY connects signals, MES events, and notes so you see why metrics move — not only that they moved.',
  insights: [
    {
      title: 'Correlation',
      text: 'Stops on Line 05 spike after cold starts on Line 02. Shared utility load suspected.',
    },
    {
      title: 'Forecast',
      text: 'Cell C may miss Friday ship by ~3.5 hrs unless overtime or partial offload.',
    },
    {
      title: 'Best performers',
      text: 'Maria’s crew holds lowest rework on similar SKUs; playbook shared.',
    },
  ],
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'alerts', label: 'AI Alerts' },
  { id: 'reports', label: 'Reports' },
  { id: 'insights', label: 'Insights' },
  { id: 'account', label: 'Account' },
]

const TAB_HEADINGS = {
  dashboard: { title: null, sub: null },
  alerts: { title: 'AI Alerts', sub: 'Unacknowledged items and escalation status for your lines.' },
  reports: { title: 'Reports', sub: 'Shift summaries, quality, and labor rollups — export or schedule digests.' },
  insights: { title: 'Insights', sub: 'Correlations, forecasts, and what changed — with citations to the floor.' },
  account: { title: 'Account', sub: 'Your workspace profile and subscription context.' },
}

export default function ClientDashboard({ user, onSignOut }) {
  const [tab, setTab] = useState('dashboard')
  const ctx = WORKSPACE
  const activeProductTitles = titlesForProductIds(user.products)
  const greetName = displayNameFromEmail(user.email)
  const heading = TAB_HEADINGS[tab] || TAB_HEADINGS.dashboard
  const mainTitle = heading.title ?? user.company
  const mainSub = heading.sub ?? ctx.sub

  return (
    <div className="client-app">
      <header className="client-topbar">
        <div className="client-brand">
          <span className="client-logo-main">HENRY</span>
          <span className="client-logo-sub">Client workspace</span>
        </div>
        <div className="client-tenant">
          <span className="client-tenant-name">{user.company}</span>
          <span className="client-tenant-email">{user.email}</span>
        </div>
        <button type="button" className="client-signout" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {(user.planId && SUBSCRIPTION_PLAN_LABEL[user.planId]) || activeProductTitles.length ? (
        <div className="client-meta-strip" role="status">
          {user.planId && SUBSCRIPTION_PLAN_LABEL[user.planId] ? (
            <div className="client-plan-pill">
              <span className="client-product-strip-label">Plan</span>
              <span className="client-plan-value">{SUBSCRIPTION_PLAN_LABEL[user.planId]}</span>
            </div>
          ) : null}
          {activeProductTitles.length ? (
            <div className="client-product-strip-inner">
              <span className="client-product-strip-label">Active products</span>
              <ul className="client-product-strip-list">
                {activeProductTitles.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="client-body">
        <aside className="client-sidebar" aria-label="Workspace">
          <p className="client-sidebar-label">Workspace</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`client-nav-item${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className="client-main">
          <div className="client-main-header">
            <h1 className="client-main-title">{mainTitle}</h1>
            <p className="client-main-sub">{mainSub}</p>
          </div>

          {tab === 'dashboard' ? (
            <div className="client-welcome" role="status">
              <p className="client-welcome-greet">Welcome back, {greetName}</p>
              <p className="client-welcome-meta">
                Signed in as <strong>{user.email}</strong>
                {user.lastLoginAt ? (
                  <>
                    {' '}
                    · Last session {formatSessionDate(user.lastLoginAt)}
                  </>
                ) : null}
                . Below is demo monitoring data for your workspace — replace with live feeds in production.
              </p>
            </div>
          ) : null}

          {tab === 'dashboard' ? (
            <>
              <div className="client-pills">
                {ctx.pills.map((p) => (
                  <span key={p.label} className={`client-pill ${p.className}`}>
                    {p.label}
                  </span>
                ))}
              </div>
              <div className="client-charts-row">
                <div className="client-chart-card">
                  <span className="client-chart-label">{ctx.unitsLabel}</span>
                  <svg className="client-svg" viewBox="0 0 100 48" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="clientBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <rect x="8" y="28" width="14" height="16" rx="2" fill="url(#clientBarGrad)" opacity="0.9" />
                    <rect x="28" y="18" width="14" height="26" rx="2" fill="url(#clientBarGrad)" />
                    <rect x="48" y="22" width="14" height="22" rx="2" fill="url(#clientBarGrad)" opacity="0.85" />
                    <rect x="68" y="12" width="14" height="32" rx="2" fill="url(#clientBarGrad)" opacity="0.95" />
                  </svg>
                </div>
                <div className="client-chart-card">
                  <span className="client-chart-label">Sensor trend</span>
                  <svg className="client-svg" viewBox="0 0 100 48" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="clientAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                      </linearGradient>
                      <linearGradient id="clientLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 4 38 L 18 32 L 32 36 L 46 22 L 60 26 L 74 14 L 88 18 L 96 12 L 96 44 L 4 44 Z"
                      fill="url(#clientAreaGrad)"
                    />
                    <path
                      d="M 4 38 L 18 32 L 32 36 L 46 22 L 60 26 L 74 14 L 88 18 L 96 12"
                      fill="none"
                      stroke="url(#clientLineGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="client-anomaly">{ctx.anomaly}</div>
              <div className="client-chart-footer">
                <svg className="client-spark" viewBox="0 0 120 28" preserveAspectRatio="none">
                  <line x1="0" y1="14" x2="120" y2="14" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    points="0,20 12,18 24,22 36,14 48,16 60,8 72,12 84,6 96,10 108,4 120,7"
                  />
                  <polyline
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="1.2"
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                    points="0,24 15,20 30,22 45,18 60,20 75,14 90,16 105,12 120,14"
                  />
                </svg>
                <div className="client-metrics">
                  <span>
                    OEE <strong>{ctx.oee}</strong>
                  </span>
                  <span>
                    MTBF <strong>{ctx.mtbf}</strong>
                  </span>
                </div>
              </div>
            </>
          ) : null}

          {tab === 'alerts' ? (
            <div className="client-alerts-panel">
              <p className="client-alerts-lead">{ctx.alertsLead}</p>
              <ul className="client-alert-list">
                {ctx.alerts.map((a) => (
                  <li key={a.id} className="client-alert-row">
                    <span className={`client-sev client-sev--${a.severity}`}>
                      {a.severity === 'high' ? 'High' : a.severity === 'med' ? 'Med' : 'Low'}
                    </span>
                    <div className="client-alert-body">
                      <strong>{a.title}</strong>
                      <p>{a.detail}</p>
                      <span className="client-alert-when">{a.when}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="client-alerts-foot">{ctx.alertsFoot}</p>
            </div>
          ) : null}

          {tab === 'reports' ? (
            <div className="client-text-panel">
              <p className="client-text-lead">{ctx.reportsLead}</p>
              <ul className="client-text-list">
                {ctx.reports.map((r) => (
                  <li key={r.title}>
                    <strong>{r.title}</strong> — {r.text}
                  </li>
                ))}
              </ul>
              <p className="client-text-foot">PDF + Excel export · scheduled digest to your distribution lists</p>
            </div>
          ) : null}

          {tab === 'insights' ? (
            <div className="client-text-panel">
              <p className="client-text-lead">{ctx.insightsLead}</p>
              <ul className="client-text-list">
                {ctx.insights.map((r) => (
                  <li key={r.title}>
                    <strong>{r.title}</strong> — {r.text}
                  </li>
                ))}
              </ul>
              <p className="client-text-foot">
                Ask in plain language — answers cite machines, lots, and timestamps.
              </p>
            </div>
          ) : null}

          {tab === 'account' ? (
            <div className="client-account-panel">
              <dl className="client-account-dl">
                <div className="client-account-row">
                  <dt>Work email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div className="client-account-row">
                  <dt>Organization</dt>
                  <dd>{user.company}</dd>
                </div>
                <div className="client-account-row">
                  <dt>Workspace slug</dt>
                  <dd>
                    <code className="client-account-code">{user.slug}</code>
                  </dd>
                </div>
                <div className="client-account-row">
                  <dt>Plan</dt>
                  <dd>
                    {user.planId && SUBSCRIPTION_PLAN_LABEL[user.planId]
                      ? SUBSCRIPTION_PLAN_LABEL[user.planId]
                      : 'No plan on file — contact sales to align billing.'}
                  </dd>
                </div>
                <div className="client-account-row">
                  <dt>Active products</dt>
                  <dd>
                    {activeProductTitles.length ? (
                      <ul className="client-account-product-list">
                        {activeProductTitles.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="client-account-row">
                  <dt>Member since</dt>
                  <dd>{formatSessionDate(user.createdAt)}</dd>
                </div>
                <div className="client-account-row">
                  <dt>Last sign-in</dt>
                  <dd>{formatSessionDate(user.lastLoginAt)}</dd>
                </div>
              </dl>
              <p className="client-account-foot">
                Password and billing changes can be added here as your admin flows grow.
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
