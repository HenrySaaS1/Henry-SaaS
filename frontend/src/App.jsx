import { useState, useEffect } from 'react'
import ClientDashboard from './ClientDashboard.jsx'
import { DEFAULT_PRODUCT_IDS } from './productCatalog.js'
import { apiJson, getToken, setToken, clearAuth } from './apiClient.js'
import heroMainImage from './assets/hero-main.png'
import aiIconImage from './assets/uploads/img-1.png'
import securityIconImage from './assets/uploads/img-3.png'
import analyticsIconImage from './assets/uploads/img-4.png'
import healthcareImage from './assets/uploads/img-6.png'
import laptopTeamImage from './assets/uploads/img-7.png'
import pharmaImage from './assets/uploads/img-8.png'
import medicalDevicesImage from './assets/uploads/img-10.png'
import aboutHenryImage from './assets/about-henry.png'

function mapUserFromApi(user) {
  if (!user || typeof user.email !== 'string') return null
  const locations = Array.isArray(user.locations)
    ? user.locations.map((l) => ({
        id: l.id,
        name: l.name,
        addressLine: l.addressLine ?? null,
        city: l.city ?? null,
        region: l.region ?? null,
        country: l.country ?? null,
        isPrimary: Boolean(l.isPrimary),
      }))
    : []
  return {
    email: user.email,
    company: user.company,
    slug: typeof user.slug === 'string' ? user.slug : 'generic',
    products:
      Array.isArray(user.products) && user.products.length > 0 ? user.products : DEFAULT_PRODUCT_IDS,
    planId:
      typeof user.planId === 'string' && ['basic', 'plus', 'premium'].includes(user.planId)
        ? user.planId
        : null,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : null,
    lastLoginAt: typeof user.lastLoginAt === 'string' ? user.lastLoginAt : null,
    locations,
  }
}

/** Default HENRY modules suggested when registering from a pricing tier. */
const PLAN_REGISTRATION_DEFAULTS = {
  basic: { productIds: ['core'] },
  plus: { productIds: ['core', 'factory-analytics', 'automation'] },
  premium: { productIds: [...DEFAULT_PRODUCT_IDS] },
}

const PLAN_DISPLAY = {
  basic: { label: 'Basic', price: '$150 / month' },
  plus: { label: 'Plus', price: '$200 / month' },
  premium: { label: 'Premium', price: '$300 / month' },
}

function defaultOrganizationFromEmail(email) {
  const norm = String(email).trim().toLowerCase()
  const domain = norm.split('@')[1]
  if (!domain) return 'My workspace'
  const main = domain.split('.')[0] || ''
  const word = main.replace(/[^a-z0-9]/g, '')
  if (!word) return 'My workspace'
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} workspace`
}

function signupStatusTone(message) {
  if (!message) return ''
  if (message.includes('already exists')) return 'signup-status-warning'
  if (
    message.includes('does not match') ||
    message.includes('do not match') ||
    message.includes('incorrect') ||
    message.includes('Select at least')
  ) {
    return 'signup-status-error'
  }
  if (
    message.includes('Welcome back') ||
    message.includes('Account created') ||
    message.includes('Signed in as')
  ) {
    return 'signup-status-success'
  }
  return ''
}

const solutions = [
  {
    title: 'Real-Time Data Monitoring',
    text: 'Track your production performance and key metrics in real-time to ensure everything runs smoothly and efficiently.',
    image: securityIconImage,
  },
  {
    title: 'AI-Powered Insights',
    text: 'Leverage advanced AI to identify patterns, optimize processes, and predict issues before they happen.',
    image: aiIconImage,
  },
  {
    title: 'Smart Dashboard Reporting',
    text: 'Visualize critical data with easy-to-understand dashboards designed for faster and better decision-making.',
    image: analyticsIconImage,
  },
]

const products = [
  {
    title: 'HENRY Core',
    text: 'A centralized platform that gives you real-time visibility into your production.',
    image: laptopTeamImage,
  },
  {
    title: 'Factory Analytics',
    text: 'Turn your factory data into actionable insights with advanced analytics and reporting.',
    image: analyticsIconImage,
  },
  {
    title: 'Automation Tools',
    text: 'Streamline operations with smart automation and predictive maintenance.',
    image: securityIconImage,
  },
  {
    title: 'MyHenry',
    text: 'A personalized AI business agent tailored to your company workflows and knowledge.',
    image: aiIconImage,
  },
]

const caseStudies = [
  {
    title: 'Medical Equipment & Devices',
    text: 'Enhancing precision manufacturing, quality control, and traceability in high-stakes production environments.',
    image: medicalDevicesImage,
  },
  {
    title: 'Healthcare',
    text: 'Improving patient care and operational efficiency through data-driven monitoring and automation.',
    image: healthcareImage,
  },
  {
    title: 'Pharmaceuticals',
    text: 'Ensuring compliance, batch traceability, and contamination-free production with real-time monitoring.',
    image: pharmaImage,
  },
]

/** Pricing tiers — swap for live billing when ready. */
const pricingTiers = [
  {
    planId: 'basic',
    name: 'Basic',
    price: '$150 / month',
    bestFor: 'Small teams getting started with digital monitoring.',
    inherit: null,
    highlighted: false,
    blocks: [
      {
        kind: 'list',
        items: [
          { ok: true, text: 'Machine integration — connect machines to the dashboard (PLC / IoT).' },
          { ok: true, text: 'Basic machine metrics: uptime / downtime, cycle count, core performance data.' },
          { ok: true, text: 'Camera access (security only): live feeds; no AI analysis or alerts.' },
          { ok: true, text: 'Single dashboard and workspace access.' },
          { ok: true, text: 'Limited users (e.g. 2–3 seats).' },
        ],
      },
      {
        kind: 'list',
        items: [
          { ok: false, text: 'No AI insights.' },
          { ok: false, text: 'No anomaly detection.' },
          { ok: false, text: 'No safety / compliance monitoring.' },
          { ok: false, text: 'No multi-location support.' },
        ],
      },
    ],
  },
  {
    planId: 'plus',
    name: 'Plus',
    price: '$200 / month',
    bestFor: 'Growing factories needing automation & safety intelligence.',
    inherit: 'Everything in Basic, plus:',
    highlighted: true,
    blocks: [
      { kind: 'subheading', text: 'AI-powered factory monitoring' },
      {
        kind: 'list',
        items: [
          {
            ok: true,
            text: 'Drone / mobile camera scanning: automated floor coverage and machine activity tracking.',
          },
        ],
      },
      { kind: 'subheading', text: 'Computer vision insights (detects)' },
      {
        kind: 'nested',
        items: [
          'Machine crossings of safety lines',
          'Doors left unlocked',
          'Lights on during off-hours',
          'Worker safety violations',
        ],
      },
      {
        kind: 'list',
        items: [
          {
            ok: true,
            text: 'Advanced analytics: real-time alerts and visual insights from camera + machine data.',
          },
          { ok: true, text: 'Event-based alerts for safety and operational anomalies.' },
          {
            ok: true,
            text: 'Expanded user access with role-based dashboards (Admin, Manager, Operator).',
          },
          { ok: false, text: 'Single factory location only.' },
        ],
      },
    ],
  },
  {
    planId: 'premium',
    name: 'Premium',
    price: '$300 / month',
    bestFor: 'Enterprises managing multiple plants with AI-driven intelligence.',
    inherit: 'Everything in Plus, plus:',
    highlighted: false,
    blocks: [
      {
        kind: 'list',
        items: [
          {
            ok: true,
            text: 'Multi-location support: up to 5 factory sites with one centralized dashboard.',
          },
        ],
      },
      { kind: 'subheading', text: 'Personal AI agent — AskHenry' },
      {
        kind: 'nested',
        items: [
          'Natural language queries (e.g. “Which machine had the highest downtime today?”)',
          'Real-time insights & recommendations trained on your factory data',
          'Expandable modules: HR, Maintenance, Production, Compliance',
        ],
      },
      { kind: 'subheading', text: 'Advanced intelligence layer' },
      {
        kind: 'nested',
        items: [
          'Predictive insights (roadmap)',
          'Cross-location performance comparison',
          'Custom KPI dashboards',
        ],
      },
      {
        kind: 'list',
        items: [
          {
            ok: 'addon',
            text: 'Additional locations beyond 5 available at extra cost — scale as you grow.',
          },
        ],
      },
    ],
  },
]

function renderPricingBlock(block) {
  if (block.kind === 'subheading') {
    return (
      <p className="pricing-subhead">{block.text}</p>
    )
  }
  if (block.kind === 'nested') {
    return (
      <ul className="pricing-nested">
        {block.items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    )
  }
  if (block.kind === 'list') {
    return (
      <ul className="pricing-items">
        {block.items.map((item) => {
          const isOut = item.ok === false
          const isAddon = item.ok === 'addon'
          return (
            <li key={item.text} className={isOut ? 'is-out' : isAddon ? 'is-addon' : 'is-in'}>
              <span className="pricing-item-icon" aria-hidden="true">
                {isOut ? '✕' : isAddon ? '+' : '✓'}
              </span>
              <span className="pricing-item-text">{item.text}</span>
            </li>
          )
        })}
      </ul>
    )
  }
  return null
}

function App() {
  const [showSignup, setShowSignup] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    companyName: '',
    interest: 'Request a demo — general tour',
    notes: '',
  })
  const [status, setStatus] = useState('')
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [signupStatus, setSignupStatus] = useState('')
  const [authMode, setAuthMode] = useState('signup')
  const [signupFromPlan, setSignupFromPlan] = useState(null)
  const [signupDashTab, setSignupDashTab] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!getToken()) return
      try {
        const data = await apiJson('/api/auth/me')
        const u = mapUserFromApi(data.user)
        if (!cancelled && u) setCurrentUser(u)
      } catch {
        clearAuth()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = () => {
    clearAuth()
    setCurrentUser(null)
  }

  const refreshCurrentUser = async () => {
    if (!getToken()) return
    try {
      const data = await apiJson('/api/auth/me')
      const u = mapUserFromApi(data.user)
      if (u) setCurrentUser(u)
    } catch {
      clearAuth()
      setCurrentUser(null)
    }
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submitContact = async (event) => {
    event.preventDefault()
    setStatus('Submitting...')
    try {
      await apiJson('/api/contact', { method: 'POST', body: form })
      setStatus('Thanks! We received your demo request and will be in touch.')
      setForm({
        name: '',
        email: '',
        companyName: '',
        interest: 'Request a demo — general tour',
        notes: '',
      })
    } catch (error) {
      setStatus(error.message)
    }
  }

  const updateSignupField = (event) => {
    const { name, value } = event.target
    setSignupForm((current) => ({ ...current, [name]: value }))
  }

  const closeSignupModal = () => {
    setShowSignup(false)
    setSignupStatus('')
    setSignupFromPlan(null)
    setSignupForm({ email: '', password: '', confirmPassword: '' })
  }

  const openAuthModal = (mode = 'signup', options = {}) => {
    setAuthMode(mode)
    setSignupStatus('')
    setSignupDashTab('dashboard')
    const planKey = options.planId
    const validPlan = planKey && PLAN_REGISTRATION_DEFAULTS[planKey] ? planKey : null
    if (mode === 'signup') {
      setSignupFromPlan(validPlan)
      setSignupForm({ email: '', password: '', confirmPassword: '' })
    } else {
      setSignupFromPlan(null)
      setSignupForm({ email: '', password: '', confirmPassword: '' })
    }
    setShowSignup(true)
  }

  const submitSignup = async (event) => {
    event.preventDefault()
    setSignupStatus('')
    if (!signupForm.email?.trim() || !signupForm.password || !signupForm.confirmPassword) {
      setSignupStatus('Please fill in email, password, and confirm password.')
      return
    }
    if (signupForm.password.length < 8) {
      setSignupStatus('Password must be at least 8 characters.')
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupStatus('Passwords do not match.')
      return
    }
    const emailKey = signupForm.email.trim().toLowerCase()
    const productIds =
      signupFromPlan && PLAN_REGISTRATION_DEFAULTS[signupFromPlan]
        ? [...PLAN_REGISTRATION_DEFAULTS[signupFromPlan].productIds]
        : [...DEFAULT_PRODUCT_IDS]
    try {
      const { available } = await apiJson(
        `/api/auth/check-email?email=${encodeURIComponent(emailKey)}`,
        { token: null },
      )
      if (!available) {
        setSignupStatus('This email already has an account. Use Sign in below.')
        setAuthMode('signin')
        setSignupFromPlan(null)
        setSignupForm((c) => ({ ...c, email: emailKey, password: '', confirmPassword: '' }))
        return
      }
      const body = {
        email: emailKey,
        password: signupForm.password,
        company: defaultOrganizationFromEmail(emailKey),
        productIds,
      }
      if (signupFromPlan) body.planId = signupFromPlan
      const data = await apiJson('/api/auth/register', {
        method: 'POST',
        body,
        token: null,
      })
      setToken(data.token)
      const u = mapUserFromApi(data.user)
      if (u) setCurrentUser(u)
      closeSignupModal()
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('already registered')) {
        setAuthMode('signin')
      }
      setSignupStatus(msg)
    }
  }

  const submitSignIn = async (event) => {
    event.preventDefault()
    if (!signupForm.email || !signupForm.password) {
      setSignupStatus('Please enter your email and password.')
      return
    }
    const emailKey = signupForm.email.trim().toLowerCase()
    try {
      const data = await apiJson('/api/auth/login', {
        method: 'POST',
        body: { email: emailKey, password: signupForm.password },
        token: null,
      })
      setToken(data.token)
      const u = mapUserFromApi(data.user)
      if (u) setCurrentUser(u)
      closeSignupModal()
    } catch {
      setSignupStatus('Email or password does not match. Try again or use Create account.')
    }
  }

  const continueWithGoogle = () => {
    setSignupStatus('Google sign-in will connect when you add OAuth in production.')
  }

  if (currentUser) {
    return (
      <div className="page page--client">
        <ClientDashboard user={currentUser} onSignOut={signOut} onProfileRefresh={refreshCurrentUser} />
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo">
          <span className="logo-main">HENRY</span>
          <span className="logo-sub">SMART BUSINESS TOOLS</span>
        </div>
        <nav className="menu">
          <a href="#pricing">PRICING</a>
          <a href="#products">PRODUCTS</a>
          <a href="#case-studies">CASE STUDIES</a>
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <div className="topbar-actions">
          <a className="btn-contact-nav" href="#request-demo">
            Request a demo
          </a>
          <button type="button" className="btn-signin-nav" onClick={() => openAuthModal('signin')}>
            Sign in
          </button>
          <button className="btn-dark" onClick={() => openAuthModal('signup')}>Get Started</button>
        </div>
      </header>

      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(5, 21, 63, 0.48), rgba(5, 21, 63, 0.08)), url(${heroMainImage})`,
        }}
      >
        <div className="overlay">
          <h1>When You Need Answers Now<br />ASK HENRY</h1>
          <p>Get real-time insights, reduce downtime, and make smarter manufacturing decisions instantly.</p>
          <button className="btn-primary" onClick={() => openAuthModal('signup')}>Get Started</button>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <h2 className="pricing-title">Pricing</h2>
        <p className="pricing-lead">
          Choose the tier that matches your footprint. <strong>Get started</strong> on a card runs the same new-client
          flow: account → tenant → product modules (pre-filled for that tier; you can adjust before checkout). All plans
          share the same HENRY workspace layout.
        </p>
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`pricing-card${tier.highlighted ? ' pricing-card--featured' : ''}`}
            >
              {tier.highlighted ? <span className="pricing-ribbon">Popular</span> : null}
              <h3 className="pricing-tier-name">{tier.name}</h3>
              <p className="pricing-price">{tier.price}</p>
              <p className="pricing-best-for">
                <span className="pricing-best-label">Best for</span> {tier.bestFor}
              </p>
              {tier.inherit ? <p className="pricing-inherit">{tier.inherit}</p> : null}
              <div className="pricing-body">
                {tier.blocks.map((block, i) => (
                  <div key={`${tier.name}-${i}`}>{renderPricingBlock(block)}</div>
                ))}
              </div>
              <button
                type="button"
                className="btn-pricing-cta"
                onClick={() => openAuthModal('signup', { planId: tier.planId })}
              >
                Get started
              </button>
            </article>
          ))}
        </div>
        <p className="pricing-footnote">
          Volume pricing and annual billing available. <a href="#request-demo">Request a demo</a> or{' '}
          <a href="#contact">contact sales</a> for a tailored quote.
        </p>
      </section>

      {showSignup ? (
        <section
          className="signup-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={authMode === 'signin' ? 'signin-title' : 'onboarding-title'}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSignupModal()
          }}
        >
          <div className="signup-modal">
            <button
              type="button"
              className="signup-close"
              aria-label="Close"
              onClick={closeSignupModal}
            >
              ×
            </button>
            <div className={`signup-modal-grid${authMode === 'signin' ? ' signup-modal-grid--signin' : ''}`}>
              <div className={`signup-hero${authMode === 'signin' ? ' signup-hero--signin' : ''}`}>
                <h2 id="signup-hero-title">
                  {authMode === 'signin'
                    ? 'Welcome back — your live factory dashboard'
                    : 'Create your account — your live factory dashboard'}
                </h2>
                <p className="signup-hero-sub">
                  {authMode === 'signin'
                    ? 'Same workspace for every client: Dashboard, AI Alerts, Reports, and Insights.'
                    : signupFromPlan
                      ? `You chose the ${PLAN_DISPLAY[signupFromPlan].label} plan from Pricing. Sign up with your work email; we pre-select modules for this tier and name your workspace from your email domain.`
                      : 'New customers: sign up with your work email and password. Your workspace is created in one step. Prefer a guided tour first? Use Request a demo on the page above Contact.'}
                </p>
                <div className="signup-dashboard-mock">
                  <div className="signup-dash-sidebar">
                    <button
                      type="button"
                      className={`signup-dash-item${signupDashTab === 'dashboard' ? ' active' : ''}`}
                      onClick={() => setSignupDashTab('dashboard')}
                    >
                      Dashboard
                    </button>
                    <button
                      type="button"
                      className={`signup-dash-item${signupDashTab === 'alerts' ? ' active' : ''}`}
                      onClick={() => setSignupDashTab('alerts')}
                    >
                      AI Alerts
                    </button>
                    <button
                      type="button"
                      className={`signup-dash-item${signupDashTab === 'reports' ? ' active' : ''}`}
                      onClick={() => setSignupDashTab('reports')}
                    >
                      Reports
                    </button>
                    <button
                      type="button"
                      className={`signup-dash-item${signupDashTab === 'insights' ? ' active' : ''}`}
                      onClick={() => setSignupDashTab('insights')}
                    >
                      Insights
                    </button>
                  </div>
                  <div className="signup-dash-main">
                    {signupDashTab === 'dashboard' ? (
                      <>
                    <div className="signup-dash-pills">
                      <span className="pill green">Running 12</span>
                      <span className="pill yellow">Idle 4</span>
                      <span className="pill red">Alert 1</span>
                    </div>
                    <div className="signup-charts-stack">
                      <div className="signup-chart-row">
                        <div className="signup-chart-card">
                          <span className="signup-chart-label">Units / hr</span>
                          <svg className="signup-svg" viewBox="0 0 100 48" preserveAspectRatio="xMidYMid meet">
                            <defs>
                              <linearGradient id="signupBarGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#60a5fa" />
                                <stop offset="100%" stopColor="#3b82f6" />
                              </linearGradient>
                            </defs>
                            <rect x="8" y="28" width="14" height="16" rx="2" fill="url(#signupBarGrad)" opacity="0.9" />
                            <rect x="28" y="18" width="14" height="26" rx="2" fill="url(#signupBarGrad)" />
                            <rect x="48" y="22" width="14" height="22" rx="2" fill="url(#signupBarGrad)" opacity="0.85" />
                            <rect x="68" y="12" width="14" height="32" rx="2" fill="url(#signupBarGrad)" opacity="0.95" />
                          </svg>
                        </div>
                        <div className="signup-chart-card">
                          <span className="signup-chart-label">Sensor trend</span>
                          <svg className="signup-svg" viewBox="0 0 100 48" preserveAspectRatio="xMidYMid meet">
                            <defs>
                              <linearGradient id="signupAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                              </linearGradient>
                              <linearGradient id="signupLineGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#22d3ee" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M 4 38 L 18 32 L 32 36 L 46 22 L 60 26 L 74 14 L 88 18 L 96 12 L 96 44 L 4 44 Z"
                              fill="url(#signupAreaGrad)"
                            />
                            <path
                              d="M 4 38 L 18 32 L 32 36 L 46 22 L 60 26 L 74 14 L 88 18 L 96 12"
                              fill="none"
                              stroke="url(#signupLineGrad)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="signup-dash-alert">
                        Anomaly: Line 07 — vibration spike detected
                      </div>
                      <div className="signup-chart-footer">
                        <svg className="signup-svg-spark" viewBox="0 0 120 28" preserveAspectRatio="none">
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
                        <div className="signup-chart-metrics">
                          <span>OEE <strong>94%</strong></span>
                          <span>MTBF <strong>120h</strong></span>
                        </div>
                      </div>
                    </div>
                      </>
                    ) : null}

                    {signupDashTab === 'alerts' ? (
                      <div className="signup-dash-info">
                        <p className="signup-info-lead">
                          Live AI watches CNC cells, conveyors, and paint booths. When a pattern looks wrong,
                          the floor gets a clear alert before scrap or downtime piles up.
                        </p>
                        <ul className="signup-info-list">
                          <li>
                            <span className="signup-info-sev high">High</span>
                            <span>
                              <strong>Line 07 — spindle vibration</strong> exceeded baseline for 6 min. Shift B
                              operator notified; maintenance ticket #4481 opened.
                            </span>
                          </li>
                          <li>
                            <span className="signup-info-sev med">Med</span>
                            <span>
                              <strong>Robot R-12 — cycle drift</strong> +8% vs last week. Suggested torque
                              recalibration after lunch break.
                            </span>
                          </li>
                          <li>
                            <span className="signup-info-sev low">Low</span>
                            <span>
                              <strong>Compressor room</strong> temperature trending up. No stoppage yet;
                              facilities team cc’d on digest email.
                            </span>
                          </li>
                        </ul>
                        <p className="signup-info-foot">
                          14 machines monitored · 2 night-shift leads · escalation to supervisor if unacked 15 min
                        </p>
                      </div>
                    ) : null}

                    {signupDashTab === 'reports' ? (
                      <div className="signup-dash-info">
                        <p className="signup-info-lead">
                          Shift and weekly reports roll up what happened on the floor: who ran which line, how
                          many good parts, and where time was lost.
                        </p>
                        <ul className="signup-info-list signup-info-plain">
                          <li>
                            <strong>Yesterday 2nd shift</strong> — OEE 91.2% (target 90%). Assembly West beat plan
                            by 240 units; Line 03 changeover added 22 min unplanned downtime.
                          </li>
                          <li>
                            <strong>Quality summary</strong> — 99.4% first-pass yield. Three holds on lot M-884
                            (supplier coating variance); quarantine released after QA sign-off.
                          </li>
                          <li>
                            <strong>Labor &amp; training</strong> — Two new operators on packaging; HENRY flagged
                            slower average cycle for first 4 hours — coach checklist auto-attached to report.
                          </li>
                        </ul>
                        <p className="signup-info-foot">
                          PDF + Excel export · scheduled email to plant manager every Monday 06:00
                        </p>
                      </div>
                    ) : null}

                    {signupDashTab === 'insights' ? (
                      <div className="signup-dash-info">
                        <p className="signup-info-lead">
                          HENRY connects machine signals, MES events, and people notes to surface “why” things
                          move — not just charts.
                        </p>
                        <ul className="signup-info-list signup-info-plain">
                          <li>
                            <strong>Correlation</strong> — Stops on Line 05 spike within 90 min of cold starts on
                            Line 02. Shared chiller load suspected; recommend staggered startup next trial.
                          </li>
                          <li>
                            <strong>Forecast</strong> — At current run rate, Cell C will miss Friday ship window by
                            ~3.5 hrs unless overtime tonight or partial offload to Cell D.
                          </li>
                          <li>
                            <strong>Best performers</strong> — Team lead Maria’s crew holds lowest rework on
                            similar SKUs; suggested playbook snippet shared to other shifts.
                          </li>
                        </ul>
                        <p className="signup-info-foot">
                          Ask in plain language: “What hurt OEE last night?” — answers cite machines, lots, and
                          timestamps.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className={`signup-panel${authMode === 'signin' ? ' signup-panel--signin' : ''}`}>
                <div className={`signup-glass${authMode === 'signin' ? ' signup-glass--signin' : ''}`}>
                  <div className="signup-auth-switch">
                    <button
                      type="button"
                      className={authMode === 'signup' ? 'active' : ''}
                      onClick={() => {
                        setAuthMode('signup')
                        setSignupStatus('')
                        setSignupFromPlan(null)
                        setSignupForm({ email: '', password: '', confirmPassword: '' })
                      }}
                    >
                      Sign up
                    </button>
                    <button
                      type="button"
                      className={authMode === 'signin' ? 'active' : ''}
                      onClick={() => {
                        setAuthMode('signin')
                        setSignupStatus('')
                        setSignupFromPlan(null)
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                  {authMode === 'signup' ? (
                    <>
                      {signupFromPlan ? (
                        <p className="signup-pricing-context">
                          <span className="signup-pricing-context-label">Pricing</span>
                          <strong>{PLAN_DISPLAY[signupFromPlan].label}</strong>
                          <span className="signup-pricing-context-price">{PLAN_DISPLAY[signupFromPlan].price}</span>
                        </p>
                      ) : null}
                      <h3 id="onboarding-title">Account</h3>
                      <p className="signup-glass-hint">
                        Use your work email — it becomes your login. Enter your password twice to confirm, then create
                        your workspace.
                      </p>
                      <form className="signup-form-new" onSubmit={submitSignup}>
                        <label className="signup-field">
                          <span className="signup-field-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M4 6h16v12H4V6zm2 2v8h12V8H6zm4 2h4v1h-4v-1z"
                                fill="currentColor"
                                opacity=".85"
                              />
                            </svg>
                          </span>
                          <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={signupForm.email}
                            onChange={updateSignupField}
                            placeholder="Work email"
                          />
                        </label>
                        <label className="signup-field">
                          <span className="signup-field-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"
                                fill="currentColor"
                                opacity=".85"
                              />
                            </svg>
                          </span>
                          <input
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={signupForm.password}
                            onChange={updateSignupField}
                            placeholder="Password"
                          />
                        </label>
                        <label className="signup-field">
                          <span className="signup-field-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"
                                fill="currentColor"
                                opacity=".85"
                              />
                            </svg>
                          </span>
                          <input
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={signupForm.confirmPassword}
                            onChange={updateSignupField}
                            placeholder="Confirm password"
                          />
                        </label>
                        <button type="submit" className="btn-start-monitoring">
                          Create account
                        </button>
                        <div className="signup-or">
                          <span>or</span>
                        </div>
                        <button type="button" className="btn-google" onClick={continueWithGoogle}>
                          <svg className="google-g" width="18" height="18" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </button>
                        {signupStatus ? (
                          <p className={`signup-status-new ${signupStatusTone(signupStatus)}`}>{signupStatus}</p>
                        ) : null}
                      </form>
                    </>
                  ) : (
                    <>
                      <div className="signup-signin-badge">Secure sign in</div>
                      <h3 id="signin-title">Welcome back</h3>
                      <p className="signup-glass-hint">
                        Enter the same email and password you used when you created your HENRY account.
                      </p>
                      <form className="signup-form-new" onSubmit={submitSignIn}>
                        <label className="signup-field">
                          <span className="signup-field-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M4 6h16v12H4V6zm2 2v8h12V8H6zm4 2h4v1h-4v-1z"
                                fill="currentColor"
                                opacity=".85"
                              />
                            </svg>
                          </span>
                          <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={signupForm.email}
                            onChange={updateSignupField}
                            placeholder="Email"
                          />
                        </label>
                        <label className="signup-field">
                          <span className="signup-field-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"
                                fill="currentColor"
                                opacity=".85"
                              />
                            </svg>
                          </span>
                          <input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={signupForm.password}
                            onChange={updateSignupField}
                            placeholder="Password"
                          />
                        </label>
                        <button type="submit" className="btn-start-monitoring">
                          Sign In
                        </button>
                        <div className="signup-or">
                          <span>or</span>
                        </div>
                        <button type="button" className="btn-google" onClick={continueWithGoogle}>
                          <svg className="google-g" width="18" height="18" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </button>
                        {signupStatus ? (
                          <p className={`signup-status-new ${signupStatusTone(signupStatus)}`}>{signupStatus}</p>
                        ) : null}
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="solutions">
        <h2>Smart Manufacturing Solutions with Real-Time Data & Insights</h2>
        <div className="card-grid three">
          {solutions.map((item) => (
            <article key={item.title} className="card">
              <img className="solution-image" src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="products" className="products">
        <h2 className="products-title">PRODUCTS</h2>
        <p className="products-subtitle">
          Streamline your operations with smart automation. From monitoring to predictive
          maintenance, automate processes and save valuable time.
        </p>
        <div className="card-grid four">
          {products.map((item) => (
            <article key={item.title} className="card product">
              <img className="product-image" src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="case-studies" className="case-studies">
        <h2>CASE STUDIES</h2>
        <div className="card-grid three">
          {caseStudies.map((item) => (
            <article key={item.title} className="card">
              <img className="case-image" src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <button className="btn-dark small">Learn More</button>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="about about-last">
        <div className="about-image">
          <img src={aboutHenryImage} alt="About Henry" />
        </div>
        <div className="about-content">
          <h2>ABOUT HENRY</h2>
          <h3>Smarter Manufacturing Starts Here</h3>
          <p>
            HENRY is built to help manufacturers make faster, smarter decisions using
            real-time data and AI-powered insights. From monitoring operations to
            optimizing performance, everything you need is in one powerful platform.
          </p>
          <ul>
            <li>Real-Time Factory Visibility</li>
            <li>AI-Driven Decision Making</li>
            <li>Improved Efficiency & Productivity</li>
          </ul>
        </div>
      </section>

      <section id="request-demo" className="request-demo">
        <h2>Request a demo</h2>
        <p className="request-demo-intro">
          Schedule a live walkthrough of HENRY with our team. For general questions, hours, and email, see{' '}
          <a href="#contact">Contact</a> below. To start on your own, use <strong>Get Started</strong> in the header.
        </p>
        <form className="contact-form demo-request-form" onSubmit={submitContact}>
          <input name="name" value={form.name} onChange={updateField} placeholder="Name *" />
          <input name="email" value={form.email} onChange={updateField} placeholder="Email *" />
          <input name="companyName" value={form.companyName} onChange={updateField} placeholder="Company Name" />
          <select name="interest" value={form.interest} onChange={updateField}>
            <option>Request a demo — general tour</option>
            <option>Smart Monitoring Setup</option>
            <option>Factory Analytics</option>
            <option>Automation Tools</option>
          </select>
          <textarea
            name="notes"
            rows="4"
            value={form.notes}
            onChange={updateField}
            placeholder="TELL US BRIEFLY ABOUT YOUR REQUIREMENT..."
          />
          <button type="submit" className="btn-primary">Submit demo request</button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </section>

      <section id="contact" className="contact">
        <h2>Contact us</h2>
        <p className="contact-intro">
          Reach the HENRY SaaS team for pricing, partnerships, and support. We read every message.
        </p>
        <div className="contact-info-wrap">
          <aside className="contact-info-panel" aria-labelledby="contact-info-heading">
            <h3 id="contact-info-heading">HENRY SaaS</h3>
            <p className="contact-info-lead">
              Cloud manufacturing intelligence — onboarding, billing questions, and technical evaluations all start
              here.
            </p>
            <dl className="contact-info-list">
              <div className="contact-info-row">
                <dt>Email</dt>
                <dd>
                  <a href="mailto:info@henrysaas.com">info@Henrysaas.com</a>
                </dd>
              </div>
              <div className="contact-info-row">
                <dt>Hours</dt>
                <dd>Monday–Friday, 9:00 a.m.–6:00 p.m. US Eastern</dd>
              </div>
              <div className="contact-info-row">
                <dt>Response time</dt>
                <dd>We aim to reply within one business day. Include your company and time zone for faster scheduling.</dd>
              </div>
              <div className="contact-info-row">
                <dt>Existing customers</dt>
                <dd>
                  Sign in to your workspace for in-app alerts and reports. For account changes, email us from your
                  registered address and mention your organization name.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default App
