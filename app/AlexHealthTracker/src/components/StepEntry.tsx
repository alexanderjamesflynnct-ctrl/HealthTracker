import { useState, useEffect, useCallback } from 'react'
import styles from './WeightEntry.module.css'
import { useAppStrings } from '../hooks/useAppStrings'

const API_BASE = 'http://localhost:5181/api/activity'

const today = () => new Date().toISOString().slice(0, 10)

interface ExistingReading {
  dataUuid: string
  stepCount: number
  dayTime: string | null
}

const ConfirmReplaceDialog = ({
  date,
  existingSteps,
  newSteps,
  onConfirm,
  onCancel,
  s,
}: {
  date: string
  existingSteps: number
  newSteps: number
  onConfirm: () => void
  onCancel: () => void
  s: (page: string, uniqueId: string, fallback?: string) => string
}) => (
  <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className={styles.dialog}>
      <h3 id="confirm-title" className={styles.dialogTitle}>{s('StepEntry', 'replace_title', '⚠️ Reading Already Exists')}</h3>
      <p className={styles.dialogBody}>
        A step reading already exists for <strong>{date}</strong>.
      </p>
      <div className={styles.compareTable}>
        <div className={styles.compareRow}>
          <span className={styles.compareLabel}>Current reading</span>
          <span className={styles.compareValue}>{existingSteps.toLocaleString()} steps</span>
        </div>
        <div className={`${styles.compareRow} ${styles.compareRowNew}`}>
          <span className={styles.compareLabel}>New reading</span>
          <span className={styles.compareValue}>{newSteps.toLocaleString()} steps</span>
        </div>
      </div>
      <p className={styles.dialogQuestion}>{s('StepEntry', 'replace_question', 'Do you want to replace the existing reading?')}</p>
      <div className={styles.dialogActions}>
        <button className={styles.cancelBtn} type="button" onClick={onCancel}>Cancel</button>
        <button className={styles.confirmBtn} type="button" onClick={onConfirm}>Yes, Replace</button>
      </div>
    </div>
  </div>
)

const StepEntry = () => {
  const { s } = useAppStrings()
  const [date, setDate] = useState(today())
  const [stepInput, setStepInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [existing, setExisting] = useState<ExistingReading | null>(null)
  const [checkingDate, setCheckingDate] = useState(false)
  const [pendingSteps, setPendingSteps] = useState<number | null>(null)

  const checkDate = useCallback(async (d: string) => {
    if (!d) return
    setCheckingDate(true)
    setExisting(null)
    try {
      const res = await fetch(`${API_BASE}/date/${d}`)
      if (res.ok) setExisting(await res.json() as ExistingReading)
    } catch { /* ignore */ }
    finally { setCheckingDate(false) }
  }, [])

  useEffect(() => { checkDate(date) }, [date, checkDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const steps = parseInt(stepInput, 10)
    if (!date)                    { setError('Please select a date.'); return }
    if (isNaN(steps) || steps <= 0) { setError('Please enter a valid step count.'); return }

    if (existing) { setPendingSteps(steps); return }
    await saveSteps(steps)
  }

  const saveSteps = async (steps: number, replace = false) => {
    setSaving(true)
    setError(null)
    try {
      let res: Response
      if (replace && existing) {
        res = await fetch(`${API_BASE}/date/${existing.dataUuid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepCount: steps, dayTime: date }),
        })
      } else {
        res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepCount: steps, dayTime: date }),
        })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const saved = await res.json()
      setSuccess(`Saved: ${saved.stepCount.toLocaleString()} steps on ${date}`)
      setStepInput('')
      setDate(today())
      setPendingSteps(null)
      setExisting(null)
    } catch (err) {
      setError(`Failed to save: ${err}`)
      setPendingSteps(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {pendingSteps !== null && existing && (
        <ConfirmReplaceDialog
          date={date}
          existingSteps={existing.stepCount}
          newSteps={pendingSteps}
          onConfirm={() => saveSteps(pendingSteps, true)}
          onCancel={() => setPendingSteps(null)}
          s={s}
        />
      )}

      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">👟</span>
            <div>
              <h2 className={styles.cardTitle}>{s('StepEntry', 'page_title', 'Record Steps')}</h2>
              <p className={styles.cardSubtitle}>{s('StepEntry', 'subtitle', 'Log a step count for a specific date')}</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="stepDate">{s('StepEntry', 'date_label', 'Date')}</label>
              <input
                id="stepDate"
                className={styles.input}
                type="date"
                value={date}
                max={today()}
                onChange={e => { setDate(e.target.value); setSuccess(null); setError(null) }}
                required
              />
              {checkingDate && <span className={styles.dateHint}>{s('StepEntry', 'checking', 'Checking…')}</span>}
              {!checkingDate && existing && (
                <span className={styles.dateWarning}>
                  {`⚠️ ${s('StepEntry', 'existing_warning', 'A reading already exists for this date:')}`}{' '}
                  <strong>{existing.stepCount.toLocaleString()} steps</strong>
                </span>
              )}
              {!checkingDate && !existing && date && (
                <span className={styles.dateOk}>{`✓ ${s('StepEntry', 'no_existing', 'No existing reading for this date')}`}</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="stepCount">{s('StepEntry', 'steps_label', 'Step Count')}</label>
              <input
                id="stepCount"
                className={styles.input}
                type="number"
                min="1"
                max="100000"
                step="1"
                value={stepInput}
                onChange={e => { setStepInput(e.target.value); setSuccess(null); setError(null) }}
                placeholder="e.g. 8432"
                required
              />
            </div>

            {error   && <div className={styles.errorBanner}   role="alert">⚠️ {error}</div>}
            {success && <div className={styles.successBanner} role="status">✅ {success}</div>}

            <div className={styles.actions}>
              <button className={styles.saveBtn} type="submit" disabled={saving || checkingDate} aria-busy={saving}>
                {saving ? 'Saving…' : existing ? s('StepEntry', 'save_replace_hint', 'Save (will prompt to replace)') : s('StepEntry', 'save_button', 'Save Steps')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default StepEntry
