import { useEffect, useState } from 'react'
import styles from './ActivityDashboard.module.css'

interface MonthlyActivityStats {
  month: string
  monthLabel: string
  minSteps: number
  maxSteps: number
  avgSteps: number
  dayCount: number
}

interface ActivityStats {
  monthlyStats: MonthlyActivityStats[]
}

const ActivityDashboard = () => {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5181/api/activity/stats')
      .then(r => r.ok ? r.json() as Promise<ActivityStats> : Promise.reject())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className={styles.page}>
        <h2 className={styles.pageTitle}>🏃 Activity — Step Dashboard</h2>
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={styles.page}>
        <h2 className={styles.pageTitle}>🏃 Activity — Step Dashboard</h2>
        <p className={styles.errorText}>⚠️ Could not load activity stats — make sure the API is running.</p>
      </div>
    )
  }

  if (stats.monthlyStats.length === 0) {
    return (
      <div className={styles.page}>
        <h2 className={styles.pageTitle}>🏃 Activity — Step Dashboard</h2>
        <p className={styles.emptyText}>No activity data found for the past 12 months.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>🏃 Activity — Step Dashboard</h2>

      <section aria-labelledby="activity-monthly-heading">
        <h3 id="activity-monthly-heading" className={styles.sectionHeading}>
          Monthly Step Breakdown — Rolling 12 Months
        </h3>
        <div className={styles.monthlyGrid}>
          {stats.monthlyStats.map(m => (
            <article key={m.month} className={styles.monthlyCard}
              aria-label={`${m.monthLabel} step stats`}>

              <div className={styles.cardHeader}>
                <span className={styles.monthLabel}>{m.monthLabel}</span>
                <span className={styles.dayCount}>{m.dayCount} days</span>
              </div>

              <div className={styles.statRows}>
                <div className={styles.statRow}>
                  <span className={styles.statIcon} aria-hidden="true">📈</span>
                  <span className={styles.statKey}>Max</span>
                  <span className={styles.statVal}>{m.maxSteps.toLocaleString()}</span>
                </div>
                <div className={`${styles.statRow} ${styles.statRowAvg}`}>
                  <span className={styles.statIcon} aria-hidden="true">📊</span>
                  <span className={styles.statKey}>Avg</span>
                  <span className={styles.statVal}>{m.avgSteps.toLocaleString()}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statIcon} aria-hidden="true">📉</span>
                  <span className={styles.statKey}>Min</span>
                  <span className={styles.statVal}>{m.minSteps.toLocaleString()}</span>
                </div>
              </div>

              {/* Visual bar showing avg relative to max */}
              <div className={styles.barTrack} aria-hidden="true">
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.round((m.avgSteps / m.maxSteps) * 100)}%` }}
                />
              </div>
              <div className={styles.barLabel} aria-hidden="true">
                avg is {Math.round((m.avgSteps / m.maxSteps) * 100)}% of best day
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ActivityDashboard
