import { useEffect, useState } from 'react'
import styles from './WeightDashboard.module.css'
import { useWeightUom } from '../hooks/useWeightUom'

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
  allTimeMaxKg:   number
  allTimeMaxLbs:  number
  allTimeMaxDate: string
  yearMinKg:      number
  yearMinLbs:     number
  yearMinDate:    string
  yearAvgKg:      number
  yearAvgLbs:     number
  year:           number
  monthlyStats:   MonthlyWeightStats[]
}

const fmtDate = (d: string) => {
  if (!d) return ''
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const WeightDashboard = () => {
  const [stats, setStats] = useState<WeightStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const weightUom = useWeightUom()
  const isPrimLbs = weightUom === 'lbs'

  const fmt = (kg: number, lbs: number) =>
    isPrimLbs ? `${lbs} lbs` : `${kg} kg`
  const fmtSub = (kg: number, lbs: number) =>
    isPrimLbs ? `${kg} kg` : `${lbs} lbs`

  useEffect(() => {
    fetch('http://localhost:5181/api/weight/stats')
      .then(r => r.ok ? r.json() as Promise<WeightStats> : Promise.reject())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className={styles.page}>
        <h2 className={styles.pageTitle}>⚖️ Weight Dashboard</h2>
        <div className={styles.summaryGrid}>
          {[0, 1, 2].map(i => (
            <div key={i} className={`${styles.summaryTile} ${styles.skeleton}`} aria-hidden="true" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={styles.page}>
        <h2 className={styles.pageTitle}>⚖️ Weight Dashboard</h2>
        <p className={styles.errorText}>⚠️ Could not load weight stats — make sure the API is running.</p>
      </div>
    )
  }

  const summaryTiles = [
    {
      icon: '🏆',
      label: 'All-Time Lowest',
      value: fmt(stats.allTimeMinKg, stats.allTimeMinLbs),
      sub: stats.allTimeMinDate
        ? `${fmtSub(stats.allTimeMinKg, stats.allTimeMinLbs)} · ${fmtDate(stats.allTimeMinDate)}`
        : fmtSub(stats.allTimeMinKg, stats.allTimeMinLbs),
    },
    {
      icon: '📈',
      label: 'All-Time Highest',
      value: fmt(stats.allTimeMaxKg, stats.allTimeMaxLbs),
      sub: stats.allTimeMaxDate
        ? `${fmtSub(stats.allTimeMaxKg, stats.allTimeMaxLbs)} · ${fmtDate(stats.allTimeMaxDate)}`
        : fmtSub(stats.allTimeMaxKg, stats.allTimeMaxLbs),
    },
    {
      icon: '📅',
      label: `Lowest — ${stats.year}`,
      value: fmt(stats.yearMinKg, stats.yearMinLbs),
      sub: stats.yearMinDate
        ? `${fmtSub(stats.yearMinKg, stats.yearMinLbs)} · ${fmtDate(stats.yearMinDate)}`
        : fmtSub(stats.yearMinKg, stats.yearMinLbs),
    },
    {
      icon: '📊',
      label: `Average — ${stats.year}`,
      value: fmt(stats.yearAvgKg, stats.yearAvgLbs),
      sub: fmtSub(stats.yearAvgKg, stats.yearAvgLbs),
    },
  ]

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>⚖️ Weight Dashboard</h2>

      {/* Summary tiles */}
      <section aria-labelledby="weight-summary-heading">
        <h3 id="weight-summary-heading" className={styles.sectionHeading}>Weight Stats</h3>
        <div className={styles.summaryGrid} role="list">
          {summaryTiles.map(tile => (
            <article key={tile.label} className={styles.summaryTile} role="listitem"
              aria-label={`${tile.label}: ${tile.value}`}>
              <div className={styles.tileIcon} aria-hidden="true">{tile.icon}</div>
              <div className={styles.tileBody}>
                <span className={styles.tileLabel}>{tile.label}</span>
                <span className={styles.tileValue}>{tile.value}</span>
                <span className={styles.tileSub}>{tile.sub}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Monthly breakdown */}
      {stats.monthlyStats.length > 0 && (
        <section aria-labelledby="weight-monthly-heading" className={styles.monthlySection}>
          <h3 id="weight-monthly-heading" className={styles.sectionHeading}>
            Monthly Breakdown — Past 12 Months
          </h3>
          <div className={styles.monthlyGrid}>
            {stats.monthlyStats.map(m => (
              <article key={m.month} className={styles.monthlyCard}
                aria-label={`${m.monthLabel} weight stats`}>
                <div className={styles.monthlyLabel}>{m.monthLabel}</div>
                <div className={styles.monthlyRows}>
                  {(['Min', 'Max', 'Avg'] as const).map((key, i) => {
                    const kg  = i === 0 ? m.minKg  : i === 1 ? m.maxKg  : m.avgKg
                    const lbs = i === 0 ? m.minLbs : i === 1 ? m.maxLbs : m.avgLbs
                    return (
                      <div key={key} className={`${styles.monthlyRow} ${i === 2 ? styles.monthlyRowAvg : ''}`}>
                        <span className={styles.rowKey}>{key}</span>
                        <span className={styles.rowVal}>
                          {isPrimLbs ? lbs : kg} {isPrimLbs ? 'lbs' : 'kg'}
                          <span className={styles.rowLbs}> / {isPrimLbs ? kg : lbs} {isPrimLbs ? 'kg' : 'lbs'}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className={styles.monthlyCount}>{m.recordCount} readings</div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default WeightDashboard
