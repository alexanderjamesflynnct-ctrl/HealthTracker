import { useEffect, useState } from 'react'
import styles from './DevStringEditor.module.css'
import { reloadStrings, useAppStrings } from '../hooks/useAppStrings'

interface AppString {
  application: string
  page: string
  uniqueId: string
  language: string
  value: string
}

const API_URL = 'http://localhost:5181/api/strings'

const DevStringEditor = () => {
  const [strings, setStrings] = useState<AppString[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const { s } = useAppStrings()

  useEffect(() => {
    fetch(`${API_URL}?lang=all`)
      .then(r => r.ok ? r.json() as Promise<AppString[]> : Promise.reject())
      .then(d => { setStrings(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const filtered = filter
    ? strings.filter(s =>
        s.page.toLowerCase().includes(filter.toLowerCase()) ||
        s.uniqueId.toLowerCase().includes(filter.toLowerCase()) ||
        s.value.toLowerCase().includes(filter.toLowerCase())
      )
    : strings

  const startEdit = (s: AppString) => {
    const key = `${s.page}|${s.uniqueId}`
    setEditingKey(key)
    setEditValue(s.value)
    setSaveSuccess(null)
  }

  const cancelEdit = () => { setEditingKey(null); setEditValue('') }

  const saveEdit = async (s: AppString) => {
    setSaving(true)
    setSaveSuccess(null)
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(s.page)}/${encodeURIComponent(s.uniqueId)}?lang=${encodeURIComponent(s.language)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValue }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStrings(prev => prev.map(x =>
        x.page === s.page && x.uniqueId === s.uniqueId ? { ...x, value: editValue } : x
      ))
      setEditingKey(null)
      setSaveSuccess(`${s.page}|${s.uniqueId}`)
      await reloadStrings()
      setTimeout(() => setSaveSuccess(null), 2000)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  if (loading) return <div className={styles.page}><p>Loading strings…</p></div>
  if (error) return <div className={styles.page}><p className={styles.error}>⚠️ Could not load strings.</p></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>{s('DevStringEditor', 'page_title', '🔤 String Editor')}</h2>
        <span className={styles.count}>{filtered.length} of {strings.length} strings</span>
      </div>

      <input
        className={styles.filterInput}
        type="text"
        placeholder="Filter by page, ID, or value…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        aria-label="Filter strings"
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Application strings">
          <thead>
            <tr>
              <th className={styles.th}>Page</th>
              <th className={styles.th}>String ID</th>
              <th className={styles.th}>Lang</th>
              <th className={`${styles.th} ${styles.thValue}`}>Value</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const key = `${s.page}|${s.uniqueId}`
              const isEditing = editingKey === key
              const justSaved = saveSuccess === key
              return (
                <tr key={key} className={`${styles.tr} ${justSaved ? styles.trSaved : ''}`}>
                  <td className={styles.td}>{s.page}</td>
                  <td className={`${styles.td} ${styles.mono}`}>{s.uniqueId}</td>
                  <td className={`${styles.td} ${styles.tdLang}`}>{s.language}</td>
                  <td className={`${styles.td} ${styles.tdValue}`}>
                    {isEditing ? (
                      <input
                        className={styles.editInput}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(s); if (e.key === 'Escape') cancelEdit() }}
                      />
                    ) : (
                      <span className={styles.valueText} onDoubleClick={() => startEdit(s)} title="Double-click to edit">
                        {s.value}
                      </span>
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.tdAction}`}>
                    {isEditing ? (
                      <>
                        <button className={styles.saveBtn} onClick={() => saveEdit(s)} disabled={saving}>✓</button>
                        <button className={styles.cancelBtn} onClick={cancelEdit}>✕</button>
                      </>
                    ) : (
                      <button className={styles.editBtn} onClick={() => startEdit(s)} aria-label="Edit">✏️</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DevStringEditor
