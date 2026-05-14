import { useEffect, useState } from 'react'
import styles from './MainContent.module.css'
import PedometerRawData from './PedometerRawData'
import WeightRawData from './WeightRawData'
import WeightDashboard from './WeightDashboard'
import WeightEntry from './WeightEntry'
import WeightReporting from './WeightReporting'
import StepReporting from './StepReporting'
import StepEntry from './StepEntry'
import DevPromptsLog from './DevPromptsLog'
import DevCodeStats from './DevCodeStats'
import DevCodeMap from './DevCodeMap'
import DevStringEditor from './DevStringEditor'
import DevStringChangeLog from './DevStringChangeLog'
import ActivityDashboard from './ActivityDashboard'
import ProfileSettings from './ProfileSettings'
import { useWeightUom } from '../hooks/useWeightUom'
import { useAppStrings } from '../hooks/useAppStrings'

interface MainContentProps {
  selectedNode: string | null
  onProfileSaved: (firstName: string) => void
  firstName: string | null
  onNavigate: (node: string) => void
}

const STATS_URL = 'http://localhost:5181/api/pedometer/stats'

// ── Lifetime Stats Section ───────────────────────────────
interface PedometerStats {
  allTimeMaxSteps:    number
  allTimeBestDate:    string
  yearMaxSteps:       number
  yearBestDate:       string
  yearAvgStepsPerDay: number
  yearDistinctDays:   number
  year:               number
}

const LifetimeStats = () => {
  const { s } = useAppStrings()
  const [stats, setStats] = useState<PedometerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(STATS_URL)
      .then(r => r.ok ? r.json() as Promise<PedometerStats> : Promise.reject())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const fmtDate = (d: string, includeYear: boolean) => {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      ...(includeYear ? { year: 'numeric' } : {}),
      month: 'short',
      day: 'numeric',
    })
  }

  const tiles = stats ? [
    {
      icon: '🏆',
      label: s('Dashboard', 'alltime_best_label', 'All-Time Best Day'),
      value: stats.allTimeMaxSteps.toLocaleString(),
      sub: stats.allTimeBestDate ? `steps on ${fmtDate(stats.allTimeBestDate, true)}` : 'steps in a single day',
    },
    {
      icon: '📅',
      label: `${s('Dashboard', 'year_best_label', 'Best Day')} — ${stats.year}`,
      value: stats.yearMaxSteps.toLocaleString(),
      sub: stats.yearBestDate ? `steps on ${fmtDate(stats.yearBestDate, false)}` : 'steps in a single day',
    },
    {
      icon: '📊',
      label: `${s('Dashboard', 'year_avg_label', 'Daily Average')} — ${stats.year}`,
      value: stats.yearAvgStepsPerDay.toLocaleString(),
      sub: `steps/day across ${stats.yearDistinctDays} days`,
    },
  ] : []

  const headingText = s('Dashboard', 'lifetime_heading', 'Lifetime Stats')

  if (loading) {
    return (
      <section aria-labelledby="lifetime-heading">
        <h3 id="lifetime-heading" className={styles.sectionHeading}>{headingText}</h3>
        <div className={styles.lifetimeGrid}>
          {[0, 1, 2].map(i => (
            <div key={i} className={`${styles.lifetimeTile} ${styles.lifetimeTileSkeleton}`} aria-hidden="true" />
          ))}
        </div>
      </section>
    )
  }

  if (error || !tiles.length) {
    return (
      <section aria-labelledby="lifetime-heading">
        <h3 id="lifetime-heading" className={styles.sectionHeading}>{headingText}</h3>
        <p className={styles.lifetimeError}>Could not load stats — make sure the API is running.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="lifetime-heading">
      <h3 id="lifetime-heading" className={styles.sectionHeading}>{headingText}</h3>
      <div className={styles.lifetimeGrid} role="list">
        {tiles.map(tile => (
          <article key={tile.label} className={styles.lifetimeTile} role="listitem" aria-label={`${tile.label}: ${tile.value}`}>
            <div className={styles.lifetimeIcon} aria-hidden="true">{tile.icon}</div>
            <div className={styles.lifetimeBody}>
              <span className={styles.lifetimeLabel}>{tile.label}</span>
              <span className={styles.lifetimeValue}>{tile.value}</span>
              <span className={styles.lifetimeSub}>{tile.sub}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ── Weight Lifetime Stats ────────────────────────────────
interface MonthlyWeightStats {
  month: string
  monthLabel: string
  minKg: number
  minLbs: number
  maxKg: number
  maxLbs: number
  avgKg: number
  avgLbs: number
  recordCount: number
}

interface WeightStats {
  allTimeMinKg:   number
  allTimeMinLbs:  number
  allTimeMinDate: string
  yearMinKg:      number
  yearMinLbs:     number
  yearMinDate:    string
  yearAvgKg:      number
  yearAvgLbs:     number
  year:           number
  monthlyStats:   MonthlyWeightStats[]
}

const fmtWeightDate = (d: string) => {
  if (!d) return ''
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const WeightLifetimeStats = () => {
  const { s } = useAppStrings()
  const [stats, setStats] = useState<WeightStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [weightUom, setWeightUom] = useState<'kg' | 'lbs'>('kg')

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5181/api/weight/stats').then(r => r.ok ? r.json() as Promise<WeightStats> : Promise.reject()),
      fetch('http://localhost:5181/api/profile').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([statsData, p]) => {
      setStats(statsData)
      if (p?.weightUom === 'lbs') setWeightUom('lbs')
      setLoading(false)
    }).catch(() => { setError(true); setLoading(false) })
  }, [])

  const isPrimLbs = weightUom === 'lbs'
  const fmt    = (kg: number, lbs: number) => isPrimLbs ? `${lbs} lbs` : `${kg} kg`
  const fmtSub = (kg: number, lbs: number) => isPrimLbs ? `${kg} kg`  : `${lbs} lbs`

  const headingText = s('Dashboard', 'weight_stats_heading', '⚖️ Weight Stats')

  if (loading) {
    return (
      <section aria-labelledby="weight-lifetime-heading">
        <h3 id="weight-lifetime-heading" className={styles.sectionHeading}>{headingText}</h3>
        <div className={styles.lifetimeGrid}>
          {[0, 1, 2].map(i => (
            <div key={i} className={`${styles.lifetimeTile} ${styles.lifetimeTileSkeleton}`} aria-hidden="true" />
          ))}
        </div>
      </section>
    )
  }

  if (error || !stats) {
    return (
      <section aria-labelledby="weight-lifetime-heading">
        <h3 id="weight-lifetime-heading" className={styles.sectionHeading}>{headingText}</h3>
        <p className={styles.lifetimeError}>Could not load weight stats — make sure the API is running.</p>
      </section>
    )
  }

  const summaryTiles = [
    {
      icon: '🏆',
      label: s('Dashboard', 'alltime_lowest_label', 'All-Time Lowest'),
      value: fmt(stats.allTimeMinKg, stats.allTimeMinLbs),
      sub: stats.allTimeMinDate ? `${fmtSub(stats.allTimeMinKg, stats.allTimeMinLbs)} · ${fmtWeightDate(stats.allTimeMinDate)}` : fmtSub(stats.allTimeMinKg, stats.allTimeMinLbs),
    },
    {
      icon: '📅',
      label: `${s('Dashboard', 'year_lowest_label', 'Lowest')} — ${stats.year}`,
      value: fmt(stats.yearMinKg, stats.yearMinLbs),
      sub: stats.yearMinDate ? `${fmtSub(stats.yearMinKg, stats.yearMinLbs)} · ${fmtWeightDate(stats.yearMinDate)}` : fmtSub(stats.yearMinKg, stats.yearMinLbs),
    },
    {
      icon: '📊',
      label: `${s('Dashboard', 'year_avg_weight_label', 'Average')} — ${stats.year}`,
      value: fmt(stats.yearAvgKg, stats.yearAvgLbs),
      sub: fmtSub(stats.yearAvgKg, stats.yearAvgLbs),
    },
  ]

  return (
    <section aria-labelledby="weight-lifetime-heading">
      <h3 id="weight-lifetime-heading" className={styles.sectionHeading}>{headingText}</h3>
      <div className={styles.lifetimeGrid} role="list">
        {summaryTiles.map(tile => (
          <article key={tile.label} className={styles.lifetimeTile} role="listitem" aria-label={`${tile.label}: ${tile.value}`}>
            <div className={styles.lifetimeIcon} aria-hidden="true">{tile.icon}</div>
            <div className={styles.lifetimeBody}>
              <span className={styles.lifetimeLabel}>{tile.label}</span>
              <span className={styles.lifetimeValue}>{tile.value}</span>
              <span className={styles.lifetimeSub}>{tile.sub}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ── Swagger iframe ───────────────────────────────────────
const SwaggerPage = () => (
  <div className={styles.iframeWrapper}>
    <iframe
      src="http://localhost:5181/swagger"
      title="C# API Documentation"
      className={styles.swaggerFrame}
      aria-label="C# API documentation"
    />
  </div>
)

const STAT_CARDS = [
  { icon: '🏃', label: 'Steps Today', value: '8,432', unit: 'steps', trend: '+12%', positive: true },
  { icon: '⚖️', label: 'Current Weight', value: '72.4', unit: 'kg', trend: '-0.3 kg', positive: true },
]

interface LatestStats {
  steps: number
  stepsDate: string | null
  weightKg: number
  weightDate: string | null
  weightLbs: number
}

const fmtShortDate = (d: string | null) => {
  if (!d) return ''
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const WelcomeDashboard = ({ firstName, onNavigate }: { firstName: string | null; onNavigate: (node: string) => void }) => {
  const [latest, setLatest] = useState<LatestStats | null>(null)
  const weightUom = useWeightUom()
  const { s } = useAppStrings()
  const isPrimLbs = weightUom === 'lbs'

  useEffect(() => {
    fetch('http://localhost:5181/api/dashboard/latest')
      .then(r => r.ok ? r.json() as Promise<LatestStats> : Promise.reject())
      .then(setLatest)
      .catch(() => {})
  }, [])

  const statCards = latest ? [
    {
      icon: '🏃',
      label: latest.stepsDate ? `${s('Dashboard', 'steps_label_prefix', 'Steps')} — ${fmtShortDate(latest.stepsDate)}` : s('Dashboard', 'latest_steps', 'Latest Steps'),
      value: latest.steps.toLocaleString(),
      unit: 'steps',
    },
    {
      icon: '⚖️',
      label: latest.weightDate ? `${s('Dashboard', 'weight_label_prefix', 'Weight')} — ${fmtShortDate(latest.weightDate)}` : s('Dashboard', 'latest_weight', 'Latest Weight'),
      value: isPrimLbs ? `${latest.weightLbs} lbs` : `${latest.weightKg.toFixed(1)} kg`,
      unit:  isPrimLbs ? `${latest.weightKg.toFixed(1)} kg` : `${latest.weightLbs} lbs`,
    },
  ] : null

  return (
  <div className={styles.dashboard}>
    <div className={styles.welcomeBanner}>
      <div className={styles.welcomeText}>
        <h2 className={styles.welcomeHeading}>
          {s('Dashboard', 'greeting_prefix', 'Good morning,')} {firstName ?? 'Alex'}! {s('Dashboard', 'greeting_suffix', '👋')}
        </h2>
        <p className={styles.welcomeSubtext}>
          {s('Dashboard', 'snapshot_text', "Here's a snapshot of your health today. Keep up the great work!")}
        </p>
      </div>
      <div className={styles.dateChip} aria-label="Today's date">
        {new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>

    <LifetimeStats />

    <WeightLifetimeStats />

    <section aria-labelledby="stats-heading">
      <h3 id="stats-heading" className={styles.sectionHeading}>{s('Dashboard', 'recent_data_heading', 'Most Recent Data')}</h3>
      <div className={styles.statsGrid} role="list">
        {statCards ? statCards.map(card => (
          <article
            key={card.label}
            className={styles.statCard}
            role="listitem"
            aria-label={`${card.label}: ${card.value}`}
          >
            <div className={styles.statIcon} aria-hidden="true">{card.icon}</div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>{card.label}</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{card.value}</span>
              </div>
              <span className={styles.statUnit}>{card.unit}</span>
            </div>
          </article>
        )) : (
          <p className={styles.welcomeSubtext} style={{ color: 'var(--color-gray-500)', fontStyle: 'italic' }}>
            Loading latest data…
          </p>
        )}
      </div>
    </section>

    <section aria-labelledby="quick-links-heading" className={styles.quickLinksSection}>
      <h3 id="quick-links-heading" className={styles.sectionHeading}>{s('Dashboard', 'quick_actions_heading', 'Quick Actions')}</h3>
      <div className={styles.quickLinks}>
        {[
          { icon: '👟', label: s('Dashboard', 'quick_action_steps', "Log a Day's Steps"), node: 'Record Steps' },
          { icon: '📏', label: s('Dashboard', 'quick_action_weight', 'Record Weight'), node: 'Record Weight' },
        ].map(action => (
          <button
            key={action.label}
            className={styles.quickLinkBtn}
            type="button"
            aria-label={action.label}
            onClick={() => action.node && onNavigate(action.node)}
          >
            <span className={styles.quickLinkIcon} aria-hidden="true">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  </div>
  )
}

interface PlaceholderPageProps {
  name: string
}

const PlaceholderPage = ({ name }: PlaceholderPageProps) => {
  // Map node labels to icons for a nicer placeholder
  const iconMap: Record<string, string> = {
    'Daily Steps': '👟',
    'Pedometer Summary': '📱',
    'Weight Tracker': '⚖️',
    'BMI Calculator': '📐',
    'Weekly Summary': '📅',
    'Monthly Trends': '📈',
    'Dashboard': '📊',
  }

  const icon = iconMap[name] ?? '📄'

  return (
    <div className={styles.placeholder}>
      <div className={styles.placeholderCard}>
        <div className={styles.placeholderIcon} aria-hidden="true">{icon}</div>
        <h2 className={styles.placeholderTitle}>{name}</h2>
        <p className={styles.placeholderText}>
          This section is coming soon. Data and charts for{' '}
          <strong>{name}</strong> will appear here.
        </p>
        <div className={styles.placeholderBadge}>🚧 Under Construction</div>
      </div>
    </div>
  )
}

const MainContent = ({ selectedNode, onProfileSaved, firstName, onNavigate }: MainContentProps) => {
  const showDashboard         = !selectedNode || selectedNode === 'Dashboard'
  const showSwagger           = selectedNode === 'C# API Documentation'
  const showPedometerRaw      = selectedNode === 'Raw Data'
  const showWeightRaw         = selectedNode === 'Weight Raw Data'
  const showWeightDashboard   = selectedNode === 'Weight Dashboard'
  const showWeightEntry       = selectedNode === 'Record Weight'
  const showWeightReporting   = selectedNode === 'Weight Reporting'
  const showStepReporting     = selectedNode === 'Step Reporting'
  const showStepEntry         = selectedNode === 'Record Steps'
  const showDevPrompts        = selectedNode === 'Prompts Log'
  const showDevCodeStats      = selectedNode === 'Code Stats'
  const showDevCodeMap        = selectedNode === 'Code Map'
  const showDevApiDocs        = selectedNode === 'API Documentation'
  const showDevStrings        = selectedNode === 'String Editor'
  const showDevStringLog      = selectedNode === 'String Change Log'
  const showActivityDashboard = selectedNode === 'Activity Dashboard'
  const showProfile           = selectedNode === 'User Profile'

  return (
    <main className={styles.main} id="main-content" tabIndex={-1} aria-label="Main content area">
      {showDashboard ? (
        <WelcomeDashboard firstName={firstName} onNavigate={onNavigate} />
      ) : showSwagger ? (
        <SwaggerPage />
      ) : showPedometerRaw ? (
        <PedometerRawData />
      ) : showWeightRaw ? (
        <WeightRawData />
      ) : showWeightDashboard ? (
        <WeightDashboard />
      ) : showWeightEntry ? (
        <WeightEntry />
      ) : showWeightReporting ? (
        <WeightReporting />
      ) : showStepReporting ? (
        <StepReporting />
      ) : showStepEntry ? (
        <StepEntry />
      ) : showDevPrompts ? (
        <DevPromptsLog />
      ) : showDevCodeStats ? (
        <DevCodeStats />
      ) : showDevCodeMap ? (
        <DevCodeMap />
      ) : showDevApiDocs ? (
        <SwaggerPage />
      ) : showDevStrings ? (
        <DevStringEditor />
      ) : showDevStringLog ? (
        <DevStringChangeLog />
      ) : showActivityDashboard ? (
        <ActivityDashboard />
      ) : showProfile ? (
        <ProfileSettings onSaved={onProfileSaved} />
      ) : (
        <PlaceholderPage name={selectedNode} />
      )}
    </main>
  )
}

export default MainContent
