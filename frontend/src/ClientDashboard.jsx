import { useState, useEffect, useId, useRef } from 'react'
import { titlesForProductIds } from './productCatalog.js'

const DASH_KPIS = [
  { label: 'OEE', value: '94.2%', hint: 'vs target 90%', trend: '+1.2%', up: true },
  { label: 'Throughput', value: '512', hint: 'units / hr', trend: '+3.8%', up: true },
  { label: 'Uptime', value: '99.4%', hint: 'rolling 7d', trend: 'flat', up: null },
  { label: 'Open alerts', value: '3', hint: 'need attention', trend: '-1 vs yesterday', up: null },
]

const ACTIVITY_FEED = [
  { when: '2 min ago', text: 'Shift B acknowledged Line 07 vibration alert' },
  { when: '18 min ago', text: 'Auto-report exported — Yesterday 2nd shift PDF' },
  { when: '1 hr ago', text: 'Recipe change logged on Press Cell 2 (approved)' },
]

const QUICK_ACTIONS = [
  { id: 'export', label: 'Export snapshot', detail: 'PDF + CSV bundle' },
  { id: 'digest', label: 'Schedule digest', detail: 'Email to distribution list' },
  { id: 'runbook', label: 'Open runbook', detail: 'Escalation & on-call' },
]

const PRODUCTION_LINES = [
  {
    id: 'L01',
    name: 'Assembly East 01',
    status: 'running',
    oee: '92.1%',
    target: '90%',
    sku: 'SKU-4412-B',
    note: 'Ahead of takt · 12 operators',
  },
  {
    id: 'L02',
    name: 'Press Cell 2',
    status: 'idle',
    oee: '—',
    target: '88%',
    sku: 'Die changeover',
    note: 'Tooling swap approved · est. 18 min',
  },
  {
    id: 'L03',
    name: 'Packaging Line C',
    status: 'running',
    oee: '88.4%',
    target: '90%',
    sku: 'SKU-9081',
    note: 'New hire shadowing · coach on station 4',
  },
  {
    id: 'L04',
    name: 'Robot weld R-12',
    status: 'alert',
    oee: '81.0%',
    target: '85%',
    sku: 'Lot W-221',
    note: 'Cycle drift +8% · torque review queued',
  },
  {
    id: 'L05',
    name: 'Chiller loop B',
    status: 'running',
    oee: '—',
    target: '—',
    sku: 'Utilities',
    note: 'Supply temp +1.2°C · facilities ticket #8842',
  },
  {
    id: 'L06',
    name: 'Clean room fill',
    status: 'down',
    oee: '0%',
    target: '92%',
    sku: 'Sterile batch S-12',
    note: 'Unplanned stop · QA hold pending release',
  },
]

const TODAY_PRIORITIES = [
  { id: 'p1', done: false, label: 'Close out Line 07 vibration root cause (maintenance + QA)', due: 'Today 15:00' },
  { id: 'p2', done: false, label: 'Sign off Press Cell 2 die change checklist before restart', due: 'Today 16:30' },
  { id: 'p3', done: true, label: 'Post morning stand-up notes to shift digest', due: 'Done' },
  { id: 'p4', done: false, label: 'Review Cell C ship-risk forecast with planner', due: 'Tomorrow 09:00' },
]

const SHIFT_SEGMENTS = [
  { label: 'Shift A', pct: 35, tone: 'a' },
  { label: 'Shift B', pct: 40, tone: 'b' },
  { label: 'Shift C', pct: 25, tone: 'c' },
]

const NOTIFICATION_ITEMS = [
  { id: 'n1', title: 'High · Line 07 spindle vibration', detail: 'Unacknowledged · escalates in 8 min', when: '12 min ago' },
  { id: 'n2', title: 'Export ready · 2nd shift PDF', detail: 'Yesterday wrap-up report', when: '18 min ago' },
  { id: 'n3', title: 'Integration · Historian sync lag', detail: 'OPC node 3 · 90s behind real-time', when: '1 hr ago' },
]

const REPORT_RANGE_PRESETS = [
  { id: 'shift', label: 'This shift' },
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'mtd', label: 'Month to date' },
]

/** Demo global sites — replace with API data for your tenant. */
const GLOBAL_SITES = [
  {
    id: 'us',
    country: 'United States',
    flagEmoji: '🇺🇸',
    leadRole: 'Site Director',
    leadName: 'Alex Morgan',
    localTime: 'CST',
    employees: 120,
    efficiency: 88,
    address: '100 Sample Industrial Pkwy, Suite 200, Minneapolis, MN 55401 USA',
    phoneDisplay: '+1 (555) 010-1001',
    phoneTel: '+15550101001',
  },
  {
    id: 'ie',
    country: 'Ireland',
    flagEmoji: '🇮🇪',
    leadRole: 'Site Lead',
    leadName: 'Jordan Lee',
    localTime: 'Irish Standard Time',
    employees: 78,
    efficiency: 84,
    address: 'Unit 3 Demo Business Park, 42 Placeholder Rd, Dublin 2, D02 XY00, Ireland',
    phoneDisplay: '+353 (0) 1 555 0102',
    phoneTel: '+35315550102',
  },
  {
    id: 'cr',
    country: 'Costa Rica',
    flagEmoji: '🇨🇷',
    leadRole: 'Site Lead',
    leadName: 'Sam Rivera',
    localTime: 'CST',
    employees: 56,
    efficiency: 78,
    address: 'Edificio Demo 12, Zona Ejemplo, San José 10101, Costa Rica',
    phoneDisplay: '+506 5550 0103',
    phoneTel: '+50655500103',
  },
  {
    id: 'il',
    country: 'Israel',
    flagEmoji: '🇮🇱',
    leadRole: 'Site Lead',
    leadName: 'Taylor Brooks',
    localTime: 'Israel Daylight Time',
    employees: 34,
    efficiency: 75,
    address: '15 Mock Tech Park, Building B, Herzliya 4672501, Israel',
    phoneDisplay: '+972 55-501-0104',
    phoneTel: '+972555010104',
  },
  {
    id: 'in',
    country: 'India',
    flagEmoji: '🇮🇳',
    leadRole: 'Site Lead',
    leadName: 'Priya Shah',
    localTime: 'Indian Standard Time',
    employees: 12,
    efficiency: 82,
    address: 'Floor 4, Sample IT Tower, Indiranagar, Bengaluru, Karnataka 560038, India',
    phoneDisplay: '+91 80 5550 0105',
    phoneTel: '+91805550105',
  },
  {
    id: 'my',
    country: 'Malaysia',
    flagEmoji: '🇲🇾',
    leadRole: 'Site Lead',
    leadName: 'Casey Ng',
    localTime: 'Malaysia Time',
    employees: null,
    efficiency: null,
    address: 'TBD — demo site (address to be confirmed)',
    phoneDisplay: '+60 3-5550 0106',
    phoneTel: '+60355500106',
  },
]

function SitePhoneIcon() {
  return (
    <svg className="client-site-phone-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      />
    </svg>
  )
}

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
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <path d="M4 14h6V4H4v10zm0 6h6v-4H4v4zm8 0h10V10H12v10zm0-16v6h10V4H12z" />
    ),
  },
  {
    id: 'lines',
    label: 'Lines',
    icon: (
      <path d="M4 6h4v12H4V6zm6-2h4v14h-4V4zm6 4h4v10h-4V8zm6-4h4v14h-4V4z" />
    ),
  },
  {
    id: 'alerts',
    label: 'AI Alerts',
    icon: (
      <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm8-4v-6a8 8 0 00-6-7.74V4a2 2 0 10-4 0v.26A8 8 0 004 12v6l-2 2v1h20v-1l-2-2z" />
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zm-8-6h6v2H10v-2zm0-4h8v2H10v-2z" />
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: (
      <path d="M9 21v-8H5v8h4zm6 0V3H11v18h4zm6 0v-5h-4v5h4z" />
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
    ),
  },
]

const TAB_HEADINGS = {
  dashboard: { title: null, sub: null },
  lines: { title: 'Production lines', sub: 'Live status, OEE vs target, and operator context per asset.' },
  alerts: { title: 'AI Alerts', sub: 'Unacknowledged items and escalation status for your lines.' },
  reports: { title: 'Reports', sub: 'Shift summaries, quality, and labor rollups — export or schedule digests.' },
  insights: { title: 'Insights', sub: 'Correlations, forecasts, and what changed — with citations to the floor.' },
  account: { title: 'Account', sub: 'Your workspace profile and subscription context.' },
}

const ONBOARD_KEY = (email) => `henry_onboard_${String(email).toLowerCase()}`

function loadOnboard(email) {
  try {
    const raw = sessionStorage.getItem(ONBOARD_KEY(email))
    if (!raw) return { done: [], hidden: false }
    const j = JSON.parse(raw)
    return {
      done: Array.isArray(j.done) ? j.done : [],
      hidden: Boolean(j.hidden),
    }
  } catch {
    return { done: [], hidden: false }
  }
}

function saveOnboard(email, state) {
  try {
    sessionStorage.setItem(
      ONBOARD_KEY(email),
      JSON.stringify({ done: state.done, hidden: state.hidden }),
    )
  } catch {
    /* private mode */
  }
}

/** Post–sign-in checklist: drives users into each major area of the workspace. */
const ONBOARD_STEPS = [
  {
    id: 'lines',
    title: 'Browse production lines',
    body: 'See running, idle, and down assets with SKU and OEE at a glance.',
    tab: 'lines',
  },
  {
    id: 'alerts',
    title: 'Skim AI alerts',
    body: 'See how high-priority line issues surface with severity and timestamps.',
    tab: 'alerts',
  },
  {
    id: 'reports',
    title: 'Open a shift report',
    body: 'Review how HENRY rolls up throughput, quality, and labor for a shift.',
    tab: 'reports',
  },
  {
    id: 'insights',
    title: 'Read one insight',
    body: 'Correlations and forecasts show how metrics connect across cells.',
    tab: 'insights',
  },
  {
    id: 'export',
    title: 'Try a quick export',
    body: 'Kick off a snapshot export from the dashboard (demo — no file yet).',
    tab: 'dashboard',
    action: 'export',
  },
]

export default function ClientDashboard({ user, onSignOut }) {
  const [tab, setTab] = useState('dashboard')
  const [toast, setToast] = useState('')
  const [nowTick, setNowTick] = useState(() => new Date())
  const [onboard, setOnboard] = useState(() => loadOnboard(user.email))
  const [priorities, setPriorities] = useState(() => TODAY_PRIORITIES.map((p) => ({ ...p })))
  const [alertFilter, setAlertFilter] = useState('all')
  const [ackedIds, setAckedIds] = useState(() => new Set())
  const [reportRange, setReportRange] = useState('7d')
  const [insightQuestion, setInsightQuestion] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifWrapRef = useRef(null)
  const chartUid = useId().replace(/:/g, '')

  useEffect(() => {
    setOnboard(loadOnboard(user.email))
  }, [user.email])

  useEffect(() => {
    if (!notifOpen) return
    const close = (e) => {
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [notifOpen])

  useEffect(() => {
    const t = setInterval(() => setNowTick(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const ctx = WORKSPACE
  const activeProductTitles = titlesForProductIds(user.products)
  const greetName = displayNameFromEmail(user.email)
  const heading = TAB_HEADINGS[tab] || TAB_HEADINGS.dashboard
  const mainTitle = heading.title ?? user.company
  const mainSub = heading.sub ?? ctx.sub
  const clockLine = nowTick.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const avatarLetter = (user.email?.[0] || '?').toUpperCase()

  const runQuickAction = (id) => {
    const messages = {
      export: 'Preparing snapshot export (demo)…',
      digest: 'Digest scheduler opens here in production.',
      runbook: 'Runbook & on-call (demo) — link your Confluence or PDF.',
    }
    setToast(messages[id] || 'Done.')
  }

  const markOnboardStep = (id) => {
    setOnboard((prev) => {
      if (prev.done.includes(id)) return prev
      const next = { ...prev, done: [...prev.done, id] }
      saveOnboard(user.email, next)
      return next
    })
  }

  const dismissOnboard = () => {
    setOnboard((prev) => {
      const next = { ...prev, hidden: true }
      saveOnboard(user.email, next)
      return next
    })
  }

  const runOnboardStep = (step) => {
    setTab(step.tab)
    if (step.action === 'export') {
      runQuickAction('export')
    }
    markOnboardStep(step.id)
  }

  const onboardAllDone = ONBOARD_STEPS.every((s) => onboard.done.includes(s.id))

  const visibleAlerts = ctx.alerts.filter((a) => {
    if (ackedIds.has(a.id)) return false
    if (alertFilter === 'all') return true
    return a.severity === alertFilter
  })

  const acknowledgeAlert = (id) => {
    setAckedIds((prev) => new Set([...prev, id]))
    setToast('Alert acknowledged (demo) — wire to Slack, CMMS, or MES in production.')
  }

  const togglePriority = (id) => {
    setPriorities((rows) => rows.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))
  }

  const runInsightAsk = () => {
    const q = insightQuestion.trim()
    if (!q) {
      setToast('Ask a question about throughput, scrap, or downtime.')
      return
    }
    setToast('HENRY would answer with cited machine events (demo). Connect your LLM + data lake when ready.')
    setInsightQuestion('')
  }

  const filteredLines = PRODUCTION_LINES.filter((line) => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return true
    return (
      line.name.toLowerCase().includes(q) ||
      line.sku.toLowerCase().includes(q) ||
      line.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="client-app">
      {toast ? (
        <div className="client-toast" role="status">
          {toast}
        </div>
      ) : null}
      <header className="client-topbar">
        <div className="client-brand">
          <span className="client-logo-main">HENRY</span>
          <span className="client-logo-sub">Client workspace</span>
        </div>
        <div className="client-topbar-search" role="search">
          <label htmlFor="ws-search" className="client-sr-only">
            Search workspace
          </label>
          <input
            id="ws-search"
            type="search"
            className="client-search-input"
            placeholder="Search lines, SKUs, lots…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setToast(
                  searchQ.trim()
                    ? `Search “${searchQ.trim()}” → index your MES / historian in production.`
                    : 'Type a term to search (demo).',
                )
              }
            }}
          />
        </div>
        <div className="client-topbar-mid">
          <div className="client-live-pill" title="Demo live indicator">
            <span className="client-live-dot" aria-hidden="true" />
            Live
          </div>
          <time className="client-clock" dateTime={nowTick.toISOString()}>
            {clockLine}
          </time>
        </div>
        <div className="client-notif-wrap" ref={notifWrapRef}>
          <button
            type="button"
            className="client-notif-trigger"
            aria-expanded={notifOpen}
            aria-haspopup="true"
            onClick={() => setNotifOpen((o) => !o)}
          >
            <svg className="client-notif-bell" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
              />
            </svg>
            <span className="client-notif-badge">{NOTIFICATION_ITEMS.length}</span>
            <span className="client-sr-only">Notifications</span>
          </button>
          {notifOpen ? (
            <div className="client-notif-dropdown" role="menu">
              <p className="client-notif-dropdown-title">Notifications</p>
              <ul className="client-notif-list">
                {NOTIFICATION_ITEMS.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className="client-notif-item"
                      role="menuitem"
                      onClick={() => {
                        setNotifOpen(false)
                        setTab('alerts')
                        setToast(n.title)
                      }}
                    >
                      <span className="client-notif-item-title">{n.title}</span>
                      <span className="client-notif-item-meta">{n.detail}</span>
                      <span className="client-notif-item-when">{n.when}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="client-tenant">
          <span className="client-tenant-avatar" aria-hidden="true">
            {avatarLetter}
          </span>
          <span className="client-tenant-text">
            <span className="client-tenant-name">{user.company}</span>
            <span className="client-tenant-email">{user.email}</span>
          </span>
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
              <svg className="client-nav-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                {item.icon}
              </svg>
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
              <div className="client-welcome-inner">
                <p className="client-welcome-greet">Welcome back, {greetName}</p>
                <p className="client-welcome-meta">
                  Signed in as <strong>{user.email}</strong>
                  {user.lastLoginAt ? (
                    <>
                      {' '}
                      · Last session {formatSessionDate(user.lastLoginAt)}
                    </>
                  ) : null}
                  . Demo data below — wire to your historians and MES when you go live.
                </p>
              </div>
            </div>
          ) : null}

          {tab === 'dashboard' && !onboard.hidden ? (
            onboardAllDone ? (
              <div className="client-onboard-complete">
                <div>
                  <strong>You&apos;re set.</strong>
                  <span> You&apos;ve opened every area of this demo workspace.</span>
                </div>
                <button type="button" className="client-onboard-dismiss" onClick={dismissOnboard}>
                  Hide checklist
                </button>
              </div>
            ) : (
              <section className="client-onboard" aria-labelledby="client-onboard-title">
                <div className="client-onboard-head">
                  <div>
                    <h2 id="client-onboard-title" className="client-onboard-title">
                      Getting started
                    </h2>
                    <p className="client-onboard-sub">
                      Five quick steps — each jumps to the right place in your workspace.
                    </p>
                  </div>
                  <button type="button" className="client-onboard-dismiss" onClick={dismissOnboard}>
                    Dismiss
                  </button>
                </div>
                <ol className="client-onboard-list">
                  {ONBOARD_STEPS.map((step, idx) => {
                    const done = onboard.done.includes(step.id)
                    return (
                      <li key={step.id} className={`client-onboard-step${done ? ' client-onboard-step--done' : ''}`}>
                        <span className="client-onboard-idx" aria-hidden="true">
                          {done ? '✓' : idx + 1}
                        </span>
                        <div className="client-onboard-step-body">
                          <h3 className="client-onboard-step-title">{step.title}</h3>
                          <p className="client-onboard-step-text">{step.body}</p>
                        </div>
                        {done ? (
                          <span className="client-onboard-done-label">Done</span>
                        ) : (
                          <button
                            type="button"
                            className="client-onboard-go"
                            onClick={() => runOnboardStep(step)}
                          >
                            {step.action === 'export' ? 'Run demo' : 'Go there'}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </section>
            )
          ) : null}

          {tab === 'dashboard' ? (
            <>
              <div className="client-kpi-grid" aria-label="Key performance indicators">
                {DASH_KPIS.map((k) => (
                  <div key={k.label} className="client-kpi-card">
                    <span className="client-kpi-label">{k.label}</span>
                    <span className="client-kpi-value">{k.value}</span>
                    <span className="client-kpi-hint">{k.hint}</span>
                    {k.trend ? (
                      <span
                        className={`client-kpi-trend${k.up === true ? ' client-kpi-trend--up' : ''}${k.up === false ? ' client-kpi-trend--down' : ''}`}
                      >
                        {k.trend}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <section className="client-sites-section" aria-labelledby="global-sites-title">
                <div className="client-sites-section-head">
                  <h2 id="global-sites-title" className="client-sites-section-title">
                    {user.company}
                  </h2>
                  <p className="client-sites-section-sub">
                    Global footprint — site leadership, local time, headcount, and efficiency by region.
                  </p>
                </div>
                <div className="client-sites-grid">
                  {GLOBAL_SITES.map((site) => (
                    <article key={site.id} className="client-site-card">
                      <h3 className="client-site-country">{site.country}</h3>
                      <div className="client-site-flag" aria-hidden="true" title={site.country}>
                        <span className="client-site-flag-emoji">{site.flagEmoji}</span>
                      </div>
                      <p className="client-site-lead">
                        {site.leadRole} — <strong>{site.leadName}</strong>
                      </p>
                      <dl className="client-site-metrics">
                        <div>
                          <dt>Local time</dt>
                          <dd>{site.localTime}</dd>
                        </div>
                        <div>
                          <dt>No. of active employees</dt>
                          <dd>{site.employees != null ? site.employees : '—'}</dd>
                        </div>
                        <div>
                          <dt>Operational efficiency</dt>
                          <dd>{site.efficiency != null ? `${site.efficiency}%` : '—'}</dd>
                        </div>
                      </dl>
                      <p className="client-site-address">
                        <span className="client-site-address-label">Address</span>
                        {site.address}
                      </p>
                      <a className="client-site-phone" href={`tel:${site.phoneTel}`}>
                        <SitePhoneIcon />
                        <span>{site.phoneDisplay}</span>
                      </a>
                    </article>
                  ))}
                </div>
              </section>

              <div className="client-line-snapshot" aria-label="Line health snapshot">
                {PRODUCTION_LINES.slice(0, 3).map((line) => (
                  <article key={line.id} className="client-line-mini">
                    <span className={`client-line-pill client-line-pill--${line.status}`}>{line.status}</span>
                    <div className="client-line-mini-body">
                      <strong>{line.name}</strong>
                      <span className="client-line-mini-oee">{line.oee} OEE</span>
                    </div>
                    <button
                      type="button"
                      className="client-line-mini-link"
                      onClick={() => {
                        setSearchQ('')
                        setTab('lines')
                      }}
                    >
                      Lines →
                    </button>
                  </article>
                ))}
              </div>

              <div className="client-quick-actions" aria-label="Quick actions">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="client-quick-action"
                    onClick={() => runQuickAction(a.id)}
                  >
                    <span className="client-quick-action-label">{a.label}</span>
                    <span className="client-quick-action-detail">{a.detail}</span>
                  </button>
                ))}
              </div>

              <div className="client-dash-extras">
                <section className="client-priorities" aria-labelledby="pri-title">
                  <div className="client-priorities-head">
                    <h2 id="pri-title" className="client-panel-title">
                      Today&apos;s priorities
                    </h2>
                    <span className="client-panel-badge">{priorities.filter((p) => !p.done).length} open</span>
                  </div>
                  <ul className="client-priority-list">
                    {priorities.map((p) => (
                      <li key={p.id} className={`client-priority-row${p.done ? ' client-priority-row--done' : ''}`}>
                        <button
                          type="button"
                          className={`client-priority-check${p.done ? ' is-done' : ''}`}
                          aria-pressed={p.done}
                          onClick={() => togglePriority(p.id)}
                          aria-label={p.done ? 'Mark not done' : 'Mark done'}
                        >
                          {p.done ? '✓' : ''}
                        </button>
                        <span className="client-priority-label">{p.label}</span>
                        <span className="client-priority-due">{p.due}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="client-shift-panel" aria-labelledby="shift-title">
                  <h2 id="shift-title" className="client-panel-title">
                    Shift mix (rolling)
                  </h2>
                  <div
                    className="client-shift-bar"
                    role="img"
                    aria-label="Shift A thirty-five percent, B forty, C twenty-five"
                  >
                    {SHIFT_SEGMENTS.map((s) => (
                      <div
                        key={s.label}
                        className={`client-shift-seg client-shift-seg--${s.tone}`}
                        style={{ width: `${s.pct}%` }}
                        title={`${s.label} · ${s.pct}%`}
                      />
                    ))}
                  </div>
                  <ul className="client-shift-legend">
                    {SHIFT_SEGMENTS.map((s) => (
                      <li key={s.label}>
                        <span className={`client-shift-dot client-shift-dot--${s.tone}`} aria-hidden="true" />
                        {s.label} · {s.pct}%
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="client-dash-split">
                <div className="client-dash-primary">
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
                          <linearGradient id={`${chartUid}-bar`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                        <rect
                          x="8"
                          y="28"
                          width="14"
                          height="16"
                          rx="2"
                          fill={`url(#${chartUid}-bar)`}
                          opacity="0.9"
                        />
                        <rect x="28" y="18" width="14" height="26" rx="2" fill={`url(#${chartUid}-bar)`} />
                        <rect
                          x="48"
                          y="22"
                          width="14"
                          height="22"
                          rx="2"
                          fill={`url(#${chartUid}-bar)`}
                          opacity="0.85"
                        />
                        <rect
                          x="68"
                          y="12"
                          width="14"
                          height="32"
                          rx="2"
                          fill={`url(#${chartUid}-bar)`}
                          opacity="0.95"
                        />
                      </svg>
                    </div>
                    <div className="client-chart-card">
                      <span className="client-chart-label">Sensor trend</span>
                      <svg className="client-svg" viewBox="0 0 100 48" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id={`${chartUid}-area`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                          </linearGradient>
                          <linearGradient id={`${chartUid}-line`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#22d3ee" />
                          </linearGradient>
                        </defs>
                    <path
                      d="M 4 38 L 18 32 L 32 36 L 46 22 L 60 26 L 74 14 L 88 18 L 96 12 L 96 44 L 4 44 Z"
                      fill={`url(#${chartUid}-area)`}
                    />
                    <path
                      d="M 4 38 L 18 32 L 32 36 L 46 22 L 60 26 L 74 14 L 88 18 L 96 12"
                      fill="none"
                      stroke={`url(#${chartUid}-line)`}
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
                </div>

                <aside className="client-activity-panel" aria-label="Recent activity">
                  <h2 className="client-activity-title">Recent activity</h2>
                  <ul className="client-activity-list">
                    {ACTIVITY_FEED.map((row, i) => (
                      <li key={i} className="client-activity-item">
                        <span className="client-activity-dot" aria-hidden="true" />
                        <div>
                          <span className="client-activity-when">{row.when}</span>
                          <p className="client-activity-text">{row.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </>
          ) : null}

          {tab === 'lines' ? (
            <div className="client-lines-page">
              <p className="client-lines-lead">
                {searchQ.trim()
                  ? `${filteredLines.length} line(s) match “${searchQ.trim()}”. Clear the search bar to see all.`
                  : `${PRODUCTION_LINES.length} assets at this site. Use the top search to filter by name, SKU, or line ID.`}
              </p>
              <div className="client-line-grid">
                {filteredLines.map((line) => (
                  <article key={line.id} className="client-line-card">
                    <header className="client-line-card-head">
                      <span className={`client-line-pill client-line-pill--${line.status}`}>{line.status}</span>
                      <span className="client-line-id">{line.id}</span>
                    </header>
                    <h3 className="client-line-name">{line.name}</h3>
                    <dl className="client-line-dl">
                      <div>
                        <dt>OEE</dt>
                        <dd>{line.oee}</dd>
                      </div>
                      <div>
                        <dt>Target</dt>
                        <dd>{line.target}</dd>
                      </div>
                      <div className="client-line-dl-span">
                        <dt>SKU / job</dt>
                        <dd>{line.sku}</dd>
                      </div>
                    </dl>
                    <p className="client-line-note">{line.note}</p>
                    <button
                      type="button"
                      className="client-line-cta"
                      onClick={() =>
                        setToast(`Detail view for ${line.name} — trends, alarms, and work orders (demo).`)
                      }
                    >
                      Open detail
                    </button>
                  </article>
                ))}
              </div>
              {filteredLines.length === 0 ? (
                <p className="client-lines-empty">No lines match that search.</p>
              ) : null}
            </div>
          ) : null}

          {tab === 'alerts' ? (
            <div className="client-alerts-panel">
              <p className="client-alerts-lead">{ctx.alertsLead}</p>
              <div className="client-filter-row" role="toolbar" aria-label="Filter alerts by severity">
                {(['all', 'high', 'med', 'low']).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`client-filter-chip${alertFilter === f ? ' active' : ''}`}
                    onClick={() => setAlertFilter(f)}
                  >
                    {f === 'all' ? 'All' : f === 'high' ? 'High' : f === 'med' ? 'Medium' : 'Low'}
                  </button>
                ))}
              </div>
              <ul className="client-alert-list">
                {visibleAlerts.map((a) => (
                  <li key={a.id} className="client-alert-row">
                    <span className={`client-sev client-sev--${a.severity}`}>
                      {a.severity === 'high' ? 'High' : a.severity === 'med' ? 'Med' : 'Low'}
                    </span>
                    <div className="client-alert-body">
                      <strong>{a.title}</strong>
                      <p>{a.detail}</p>
                      <span className="client-alert-when">{a.when}</span>
                    </div>
                    <button type="button" className="client-alert-ack" onClick={() => acknowledgeAlert(a.id)}>
                      Acknowledge
                    </button>
                  </li>
                ))}
              </ul>
              {visibleAlerts.length === 0 ? (
                <p className="client-alerts-empty">
                  {ackedIds.size > 0
                    ? 'No alerts in this filter — try another severity or you’ve acknowledged them all.'
                    : 'No alerts match this filter.'}
                </p>
              ) : null}
              <p className="client-alerts-foot">{ctx.alertsFoot}</p>
            </div>
          ) : null}

          {tab === 'reports' ? (
            <div className="client-text-panel">
              <div className="client-reports-toolbar">
                <div className="client-filter-row" role="toolbar" aria-label="Report time range">
                  {REPORT_RANGE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`client-filter-chip${reportRange === p.id ? ' active' : ''}`}
                      onClick={() => setReportRange(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="client-reports-actions">
                  <button
                    type="button"
                    className="client-report-export"
                    onClick={() =>
                      setToast(`Export ${reportRange} bundle (PDF + CSV) — hook to your job queue in production.`)
                    }
                  >
                    Export range
                  </button>
                  <button
                    type="button"
                    className="client-report-export client-report-export--ghost"
                    onClick={() => setToast('Schedule digest — pick teams and cadence in settings.')}
                  >
                    Schedule digest
                  </button>
                </div>
              </div>
              <p className="client-text-lead">{ctx.reportsLead}</p>
              <div className="client-dossier-grid">
                {ctx.reports.map((r) => (
                  <article key={r.title} className="client-dossier-card">
                    <h3 className="client-dossier-card-title">{r.title}</h3>
                    <p className="client-dossier-card-body">{r.text}</p>
                  </article>
                ))}
              </div>
              <p className="client-text-foot">PDF + Excel export · scheduled digest to your distribution lists</p>
            </div>
          ) : null}

          {tab === 'insights' ? (
            <div className="client-text-panel">
              <section className="client-insight-ask" aria-label="Ask HENRY">
                <label htmlFor="insight-q" className="client-insight-ask-label">
                  Ask in plain language
                </label>
                <div className="client-insight-ask-row">
                  <input
                    id="insight-q"
                    type="text"
                    className="client-insight-input"
                    placeholder='e.g. “What drove scrap on Line 03 this week?”'
                    value={insightQuestion}
                    onChange={(e) => setInsightQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') runInsightAsk()
                    }}
                  />
                  <button type="button" className="client-insight-submit" onClick={runInsightAsk}>
                    Ask HENRY
                  </button>
                </div>
                <p className="client-insight-ask-hint">
                  Answers will cite machines, lots, and timestamps when your data lake is connected.
                </p>
              </section>
              <p className="client-text-lead">{ctx.insightsLead}</p>
              <div className="client-dossier-grid">
                {ctx.insights.map((r) => (
                  <article key={r.title} className="client-dossier-card client-dossier-card--insight">
                    <h3 className="client-dossier-card-title">{r.title}</h3>
                    <p className="client-dossier-card-body">{r.text}</p>
                  </article>
                ))}
              </div>
              <p className="client-text-foot">
                Ask in plain language — answers cite machines, lots, and timestamps.
              </p>
            </div>
          ) : null}

          {tab === 'account' ? (
            <div className="client-account-panel">
              <div className="client-account-hero">
                <div className="client-account-hero-avatar" aria-hidden="true">
                  {avatarLetter}
                </div>
                <div>
                  <h2 className="client-account-hero-name">{user.company}</h2>
                  <p className="client-account-hero-email">{user.email}</p>
                </div>
              </div>
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
              <div className="client-account-actions" aria-label="Account actions">
                <button
                  type="button"
                  className="client-account-action-card"
                  onClick={() =>
                    setToast('Connect Stripe, NetSuite, or your billing portal when you wire payments.')
                  }
                >
                  <span className="client-account-action-title">Subscription &amp; billing</span>
                  <span className="client-account-action-desc">Plan, invoices, and payment method</span>
                </button>
                <button
                  type="button"
                  className="client-account-action-card"
                  onClick={() =>
                    setToast('Add password reset and MFA here (e.g. email link + TOTP) for production.')
                  }
                >
                  <span className="client-account-action-title">Security</span>
                  <span className="client-account-action-desc">Password, sessions, and devices</span>
                </button>
                <button
                  type="button"
                  className="client-account-action-card"
                  onClick={() =>
                    setToast('Implementation guide: link your runbook, SCADA tags, and escalation policy.')
                  }
                >
                  <span className="client-account-action-title">Implementation</span>
                  <span className="client-account-action-desc">Integrations and go-live checklist</span>
                </button>
                <button
                  type="button"
                  className="client-account-action-card"
                  onClick={() =>
                    setToast('API keys & webhooks — rotate secrets and point HENRY at your MES / data warehouse.')
                  }
                >
                  <span className="client-account-action-title">API &amp; webhooks</span>
                  <span className="client-account-action-desc">Keys, event subscriptions, rate limits</span>
                </button>
              </div>
              <p className="client-account-foot">
                These tiles are ready for your real admin APIs and billing provider.
              </p>
            </div>
          ) : null}

          <footer className="client-workspace-help">
            <p className="client-workspace-help-text">
              <strong>Workspace help</strong> — demo data only. For production, connect historians, MES, and
              your alert destinations.
            </p>
            <div className="client-workspace-help-actions">
              <button
                type="button"
                className="client-help-link"
                onClick={() => setTab('alerts')}
              >
                Jump to alerts
              </button>
              <button
                type="button"
                className="client-help-link"
                onClick={() => setToast('Document your internal support channel (Slack, PagerDuty, etc.).')}
              >
                Escalation policy
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
