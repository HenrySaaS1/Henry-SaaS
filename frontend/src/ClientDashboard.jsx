import { useState, useEffect, useMemo } from 'react'
import { titlesForProductIds } from './productCatalog.js'
import { apiJson } from './apiClient.js'

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

function formatLocationAddress(loc) {
  if (!loc) return ''
  const parts = [loc.addressLine, loc.city, loc.region, loc.country].filter(Boolean)
  return parts.join(' · ')
}

function demoMetricsForLocation(locId) {
  if (!locId) return { oee: '94%', lines: '14', alertsOpen: '3', throughput: '512' }
  let s = 0
  for (let i = 0; i < locId.length; i++) s += locId.charCodeAt(i)
  return {
    oee: `${88 + (s % 8)}%`,
    lines: String(11 + (s % 8)),
    alertsOpen: String(1 + (s % 6)),
    throughput: String(440 + (s % 95)),
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

const NO_LOCATIONS = []

const TAB_HEADINGS = {
  dashboard: { title: null, sub: null },
  alerts: { title: 'AI Alerts', sub: 'Unacknowledged items and escalation status for your lines.' },
  reports: { title: 'Reports', sub: 'Shift summaries, quality, and labor rollups — export or schedule digests.' },
  insights: { title: 'Insights', sub: 'Correlations, forecasts, and what changed — with citations to the floor.' },
  account: { title: 'Account', sub: 'Your workspace profile and subscription context.' },
}

export default function ClientDashboard({ user, onSignOut, onProfileRefresh }) {
  const [tab, setTab] = useState('dashboard')
  const locations = useMemo(() => {
    if (!Array.isArray(user.locations) || user.locations.length === 0) return NO_LOCATIONS
    return user.locations
  }, [user.locations])
  const storageKey = `henry_loc_${user.email}`
  const locationKey = useMemo(() => locations.map((l) => l.id).join('|'), [locations])

  const [selectedLocationId, setSelectedLocationId] = useState(() => {
    const p = locations.find((l) => l.isPrimary) || locations[0]
    return p?.id ?? ''
  })

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey)
    if (saved && locations.some((l) => l.id === saved)) {
      setSelectedLocationId(saved)
      return
    }
    const p = locations.find((l) => l.isPrimary) || locations[0]
    if (p?.id) setSelectedLocationId(p.id)
  }, [storageKey, locationKey, locations])

  const setLocationId = (id) => {
    setSelectedLocationId(id)
    sessionStorage.setItem(storageKey, id)
  }

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId],
  )

  const metrics = useMemo(
    () => demoMetricsForLocation(selectedLocation?.id),
    [selectedLocation?.id],
  )

  const [locForm, setLocForm] = useState({
    name: '',
    addressLine: '',
    city: '',
    region: '',
    country: '',
    isPrimary: false,
  })
  const [locSaving, setLocSaving] = useState(false)
  const [locError, setLocError] = useState('')

  const submitNewLocation = async (e) => {
    e.preventDefault()
    setLocError('')
    if (!locForm.name.trim()) {
      setLocError('Location name is required.')
      return
    }
    setLocSaving(true)
    try {
      await apiJson('/api/locations', {
        method: 'POST',
        body: {
          name: locForm.name.trim(),
          addressLine: locForm.addressLine.trim() || undefined,
          city: locForm.city.trim() || undefined,
          region: locForm.region.trim() || undefined,
          country: locForm.country.trim() || undefined,
          isPrimary: locForm.isPrimary,
        },
      })
      setLocForm({
        name: '',
        addressLine: '',
        city: '',
        region: '',
        country: '',
        isPrimary: false,
      })
      if (onProfileRefresh) await onProfileRefresh()
    } catch (err) {
      setLocError(err.message || 'Could not save location.')
    } finally {
      setLocSaving(false)
    }
  }

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
        <div className="client-topbar-center">
          {locations.length > 0 ? (
            <label className="client-location-picker">
              <span className="client-location-picker-label">Active location</span>
              <div className="client-location-picker-inner">
                <span className="client-location-pin" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <select
                  className="client-location-select"
                  value={selectedLocationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  aria-label="Select facility or plant"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                      {loc.isPrimary ? ' (primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          ) : (
            <span className="client-location-fallback">No locations yet — add one in Account</span>
          )}
        </div>
        <div className="client-tenant">
          <span className="client-tenant-name">{user.company}</span>
          <span className="client-tenant-email">{user.email}</span>
        </div>
        <button type="button" className="client-signout" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {(user.planId && SUBSCRIPTION_PLAN_LABEL[user.planId]) ||
      activeProductTitles.length ||
      locations.length ? (
        <div className="client-meta-strip" role="status">
          {locations.length ? (
            <div className="client-sites-pill">
              <span className="client-product-strip-label">Sites</span>
              <span className="client-sites-value">
                {locations.length} location{locations.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
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
                . {selectedLocation ? (
                  <>
                    {' '}
                    Viewing <strong>{selectedLocation.name}</strong>
                    {formatLocationAddress(selectedLocation)
                      ? ` (${formatLocationAddress(selectedLocation)})`
                      : ''}
                    .{' '}
                  </>
                ) : null}
                Demo metrics below shift slightly per site — connect live PLCs and MES for real data.
              </p>
            </div>
          ) : null}

          {tab === 'dashboard' ? (
            <div className="client-stats-grid" aria-label="Key metrics for selected location">
              <div className="client-stat-card">
                <span className="client-stat-label">OEE</span>
                <span className="client-stat-value client-stat-value--accent">{metrics.oee}</span>
                <span className="client-stat-hint">rolling 24h</span>
              </div>
              <div className="client-stat-card">
                <span className="client-stat-label">Throughput</span>
                <span className="client-stat-value">{metrics.throughput}</span>
                <span className="client-stat-hint">units / hr</span>
              </div>
              <div className="client-stat-card">
                <span className="client-stat-label">Lines monitored</span>
                <span className="client-stat-value">{metrics.lines}</span>
                <span className="client-stat-hint">at this site</span>
              </div>
              <div className="client-stat-card">
                <span className="client-stat-label">Open alerts</span>
                <span className="client-stat-value client-stat-value--warn">{metrics.alertsOpen}</span>
                <span className="client-stat-hint">unacknowledged</span>
              </div>
            </div>
          ) : null}

          {tab === 'dashboard' ? (
            <>
              <div className="client-pills">
                <span className="client-pill green">{`${metrics.lines} lines live`}</span>
                <span className="client-pill yellow">Idle 4</span>
                <span className="client-pill red">{`${metrics.alertsOpen} open alerts`}</span>
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
              <div className="client-anomaly">
                {selectedLocation ? `${selectedLocation.name}: ` : ''}
                {ctx.anomaly}
              </div>
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
                    OEE <strong>{metrics.oee}</strong>
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
              <p className="client-alerts-foot">
                {metrics.lines} machines monitored at {selectedLocation?.name ?? 'this site'} · escalation to supervisor if
                unacked 15 min
              </p>
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
              <section className="client-account-locations" aria-labelledby="account-locations-heading">
                <h2 id="account-locations-heading" className="client-account-section-title">
                  Facilities &amp; plants
                </h2>
                <p className="client-account-section-lead">
                  Switch active location from the header to scope dashboards and alerts. Add regional sites as you expand.
                </p>
                <div className="client-location-cards">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className={`client-location-card${loc.id === selectedLocationId ? ' client-location-card--active' : ''}`}
                    >
                      <div className="client-location-card-head">
                        <strong>{loc.name}</strong>
                        {loc.isPrimary ? <span className="client-location-badge">Primary</span> : null}
                      </div>
                      <p className="client-location-card-address">
                        {formatLocationAddress(loc) || 'No address on file'}
                      </p>
                    </div>
                  ))}
                </div>

                <form className="client-add-location-form" onSubmit={submitNewLocation}>
                  <h3 className="client-add-location-title">Add a location</h3>
                  <div className="client-add-location-grid">
                    <label className="client-add-field">
                      <span>Name</span>
                      <input
                        value={locForm.name}
                        onChange={(e) => setLocForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Chicago — Distribution"
                        maxLength={120}
                      />
                    </label>
                    <label className="client-add-field">
                      <span>Address line</span>
                      <input
                        value={locForm.addressLine}
                        onChange={(e) => setLocForm((f) => ({ ...f, addressLine: e.target.value }))}
                        placeholder="Street, building"
                      />
                    </label>
                    <label className="client-add-field">
                      <span>City</span>
                      <input
                        value={locForm.city}
                        onChange={(e) => setLocForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="City"
                      />
                    </label>
                    <label className="client-add-field">
                      <span>Region / state</span>
                      <input
                        value={locForm.region}
                        onChange={(e) => setLocForm((f) => ({ ...f, region: e.target.value }))}
                        placeholder="State / province"
                      />
                    </label>
                    <label className="client-add-field">
                      <span>Country</span>
                      <input
                        value={locForm.country}
                        onChange={(e) => setLocForm((f) => ({ ...f, country: e.target.value }))}
                        placeholder="Country"
                      />
                    </label>
                    <label className="client-add-field client-add-field--check">
                      <input
                        type="checkbox"
                        checked={locForm.isPrimary}
                        onChange={(e) => setLocForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                      />
                      <span>Set as primary location</span>
                    </label>
                  </div>
                  {locError ? <p className="client-add-location-error">{locError}</p> : null}
                  <button type="submit" className="client-add-location-submit" disabled={locSaving}>
                    {locSaving ? 'Saving…' : 'Save location'}
                  </button>
                </form>
              </section>

              <h2 className="client-account-section-title client-account-section-title--spaced">Workspace profile</h2>
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
