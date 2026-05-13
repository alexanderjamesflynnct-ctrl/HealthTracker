import { useEffect, useState } from 'react'
import styles from './DevStringChangeLog.module.css'
import { useAppStrings } from '../hooks/useAppStrings'

interface AuditEntry {
  id: number
  page: string
  uniqueId: string
  language: string
  oldValue: string
  newValue: string
  changedByIp: string
  changedAt: string
}

const API_URL = 'http://localhost:5181/api/strings/audit'

const DevStringChangeLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { s } = useAppStrings()

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.ok ? r.json() as Promise<AuditEntry[]> : Promise.reject())
      .then(d => { setEntries(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div className={styles.page}><p>Loading change log…</p></div>
  if (error) return <div className={styles.page}><p className={styles.error}>⚠️ Could not load change log.</p></div>

  if (entries.length === 0) {
    return (
      <div className={styles.page}>
        <h2 className={styles.pageTitle}>{s('DevStringChangeLog', 'page_title', '📝 String Change Log')}</h2>
        <p className={styles.empty}>No changes have been recorded yet.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>{s('DevStringChangeLog', 'page_title', '📝 String Change Log')}</h2>
      <p className={styles.subtitle}>{entries.length} change{entries.length !== 1 ? 's' : ''} recorded</p>

      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="String change log">
          <thead>
            <tr>
              <th className={styles.th}>Date / Time</th>
              <th className={styles.th}>Page</th>
              <th className={styles.th}>String ID</th>
              <th className={styles.th}>Lang</th>
              <th className={styles.th}>Old Value</th>
              <th className={styles.th}>New Value</th>
              <th className={styles.th}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className={styles.tr}>
                <td className={styles.td}>{e.changedAt}</td>
                <td className={styles.td}>{e.page}</td>
                <td className={`${styles.td} ${styles.mono}`}>{e.uniqueId}</td>
                <td className={`${styles.td} ${styles.tdLang}`}>{e.language}</td>
                <td className={`${styles.td} ${styles.tdOld}`}>{e.oldValue}</td>
                <td className={`${styles.td} ${styles.tdNew}`}>{e.newValue}</td>
                <td className={`${styles.td} ${styles.mono}`}>{e.changedByIp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DevStringChangeLog
