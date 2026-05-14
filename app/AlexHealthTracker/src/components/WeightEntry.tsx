import { useState, useEffect, useCallback } from 'react'
import styles from './WeightEntry.module.css'
import { useWeightUom } from '../hooks/useWeightUom'
import { useAppStrings } from '../hooks/useAppStrings'

const API_BASE = 'http://localhost:5181/api/weight'

const today = () => new Date().toISOString().slice(0, 10)

interface ExistingReading {
  dataUuid: string
  weightValue: number  // always kg
  createTime: string | null
}

// Confirmation dialog shown when a reading already exists for the selected date
const ConfirmReplaceDialog = ({
  date,
  existingKg,
  newKg,
  isPrimLbs,
  onConfirm,
  onCancel,
  s,
}: {
  date: string
  existingKg: number
  newKg: number
  isPrimLbs: boolean
  onConfirm: () => void
  onCancel: () => void
  s: (page: string, uniqueId: string, fallback?: string) => string
}) => {
  const fmt = (kg: number) =>
    isPrimLbs
      ? `${(kg * 2.20462).toFixed(1)} lbs (${kg.toFixed(2)} kg)`
      : `${kg.toFixed(2)} kg (${(kg * 2.20462).toFixed(1)} lbs)`

  return (
    <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={styles.dialog}>
        <h3 id="confirm-title" className={styles.dialogTitle}>{s('WeightEntry', 'replace_title', '⚠️ Reading Already Exists')}</h3>
        <p className={styles.dialogBody}>
          A weight reading already exists for <strong>{date}</strong>.
        </p>
        <div className={styles.compareTable}>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>Current reading</span>
            <span className={styles.compareValue}>{fmt(existingKg)}</span>
          </div>
          <div className={`${styles.compareRow} ${styles.compareRowNew}`}>
            <span className={styles.compareLabel}>New reading</span>
            <span className={styles.compareValue}>{fmt(newKg)}</span>
          </div>
        </div>
        <p className={styles.dialogQuestion}>{s('WeightEntry', 'replace_question', 'Do you want to replace the existing reading?')}</p>
        <div className={styles.dialogActions}>
          <button className={styles.cancelBtn} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} type="button" onClick={onConfirm}>
            Yes, Replace
          </button>
        </div>
      </div>
    </div>
  )
}

const WeightEntry = () => {
  const weightUom = useWeightUom()
  const { s } = useAppStrings()
  const isPrimLbs = weightUom === 'lbs'

  const [date, setDate] = useState(today())
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Existing reading for the selected date (null = none, undefined = not yet checked)
  const [existing, setExisting] = useState<ExistingReading | null>(null)
  const [checkingDate, setCheckingDate] = useState(false)

  // Confirmation dialog state
  const [pendingKg, setPendingKg] = useState<number | null>(null)

  // Check for existing reading whenever date changes
  const checkDate = useCallback(async (d: string) => {
    if (!d) return
    setCheckingDate(true)
    setExisting(null)
    try {
      const res = await fetch(`${API_BASE}/date/${d}`)
      if (res.ok) {
        const data = await res.json() as ExistingReading
        setExisting(data)
      }
      // 404 = no reading, that's fine
    } catch { /* ignore network errors during check */ }
    finally { setCheckingDate(false) }
  }, [])

  useEffect(() => { checkDate(date) }, [date, checkDate])

  const toKg = (val: number) => isPrimLbs ? val / 2.20462 : val
  const fromKg = (kg: number) => isPrimLbs ? kg * 2.20462 : kg

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const inputNum = parseFloat(weightInput)
    if (!date)                            { setError('Please select a date.'); return }
    if (isNaN(inputNum) || inputNum <= 0) { setError(`Please enter a valid weight in ${isPrimLbs ? 'lbs' : 'kg'}.`); return }

    const weightKg = Math.round(toKg(inputNum) * 10000) / 10000

    // If a reading already exists, show confirmation dialog
    if (existing) {
      setPendingKg(weightKg)
      return
    }

    await saveWeight(weightKg)
  }

  const saveWeight = async (weightKg: number, replace = false) => {
    setSaving(true)
    setError(null)
    try {
      let res: Response
      if (replace && existing) {
        res = await fetch(`${API_BASE}/date/${existing.dataUuid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weightKg, createTime: date }),
        })
      } else {
        res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weightKg, createTime: date }),
        })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const saved = await res.json()
      const displayVal = fromKg(saved.weightValue).toFixed(1)
      setSuccess(`Saved: ${displayVal} ${isPrimLbs ? 'lbs' : 'kg'} on ${date}`)
      setWeightInput('')
      setDate(today())
      setPendingKg(null)
      setExisting(null)
    } catch (err) {
      setError(`Failed to save: ${err}`)
      setPendingKg(null)
    } finally {
      setSaving(false)
    }
  }

  const uomLabel = isPrimLbs ? 'lbs' : 'kg'
  const placeholder = isPrimLbs ? 'e.g. 159.6' : 'e.g. 72.4'

  const inputNum = parseFloat(weightInput)
  const conversionPreview = !isNaN(inputNum) && inputNum > 0
    ? isPrimLbs
      ? `= ${(inputNum / 2.20462).toFixed(2)} kg`
      : `= ${(inputNum * 2.20462).toFixed(1)} lbs`
    : null

  return (
    <>
      {/* Confirmation dialog */}
      {pendingKg !== null && existing && (
        <ConfirmReplaceDialog
          date={date}
          existingKg={existing.weightValue}
          newKg={pendingKg}
          isPrimLbs={isPrimLbs}
          onConfirm={() => saveWeight(pendingKg, true)}
          onCancel={() => setPendingKg(null)}
          s={s}
        />
      )}

      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">📏</span>
            <div>
              <h2 className={styles.cardTitle}>{s('WeightEntry', 'page_title', 'Record Weight')}</h2>
              <p className={styles.cardSubtitle}>{s('WeightEntry', 'subtitle', 'Log a weight reading for a specific date')}</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="weightDate">{s('WeightEntry', 'date_label', 'Date')}</label>
              <input
                id="weightDate"
                className={styles.input}
                type="date"
                value={date}
                max={today()}
                onChange={e => {
                  setDate(e.target.value)
                  setSuccess(null)
                  setError(null)
                }}
                required
              />
              {/* Existing reading indicator */}
              {checkingDate && (
                <span className={styles.dateHint}>{s('StepEntry', 'checking', 'Checking…')}</span>
              )}
              {!checkingDate && existing && (
                <span className={styles.dateWarning}>
                  {`⚠️ ${s('StepEntry', 'existing_warning', 'A reading already exists for this date:')}`}{' '}
                  <strong>
                    {isPrimLbs
                      ? `${(existing.weightValue * 2.20462).toFixed(1)} lbs`
                      : `${existing.weightValue.toFixed(2)} kg`}
                  </strong>
                </span>
              )}
              {!checkingDate && !existing && date && (
                <span className={styles.dateOk}>{`✓ ${s('StepEntry', 'no_existing', 'No existing reading for this date')}`}</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="weightValue">
                {s('WeightEntry', 'weight_label', 'Weight')} ({uomLabel})
              </label>
              <div className={styles.weightRow}>
                <input
                  id="weightValue"
                  className={styles.input}
                  type="number"
                  min="1"
                  max={isPrimLbs ? '700' : '320'}
                  step="0.1"
                  value={weightInput}
                  onChange={e => { setWeightInput(e.target.value); setSuccess(null); setError(null) }}
                  placeholder={placeholder}
                  required
                />
                {conversionPreview && (
                  <span className={styles.conversionPreview}>{conversionPreview}</span>
                )}
              </div>
            </div>

            {error   && <div className={styles.errorBanner}   role="alert">⚠️ {error}</div>}
            {success && <div className={styles.successBanner} role="status">✅ {success}</div>}

            <div className={styles.actions}>
              <button className={styles.saveBtn} type="submit" disabled={saving || checkingDate} aria-busy={saving}>
                {saving ? 'Saving…' : existing ? s('StepEntry', 'save_replace_hint', 'Save (will prompt to replace)') : s('WeightEntry', 'save_button', 'Save Weight')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default WeightEntry
