import { useEffect, useState } from 'react'
import styles from './ProfileSettings.module.css'

interface UserProfile {
  id: number
  firstName: string
  lastName: string
  heightCm: number
  heightUom: 'cm' | 'ft'
  weightUom: 'kg' | 'lbs'
  updatedAt: string
}

const API_URL = 'http://localhost:5181/api/profile'

const cmToFeetInches = (cm: number): string => {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}′ ${inches}″`
}

type UomOption<T extends string> = { value: T; label: string; desc: string }

const HEIGHT_OPTIONS: UomOption<'cm' | 'ft'>[] = [
  { value: 'cm', label: 'Centimetres (cm)', desc: 'e.g. 175.5 cm' },
  { value: 'ft', label: 'Feet & Inches (ft)', desc: 'e.g. 5′ 9″' },
]

const WEIGHT_OPTIONS: UomOption<'kg' | 'lbs'>[] = [
  { value: 'kg',  label: 'Kilograms (kg)',  desc: 'e.g. 72.4 kg' },
  { value: 'lbs', label: 'Pounds (lbs)',    desc: 'e.g. 159.6 lbs' },
]

const UomRadioGroup = <T extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string
  label: string
  options: UomOption<T>[]
  value: T
  onChange: (v: T) => void
}) => (
  <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
      {options.map(opt => (
        <label
          key={opt.value}
          className={`${styles.radioCard} ${value === opt.value ? styles.radioCardSelected : ''}`}
        >
          <input
            type="radio"
            name={id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className={styles.radioInput}
          />
          <div className={styles.radioContent}>
            <span className={styles.radioLabel}>{opt.label}</span>
            <span className={styles.radioDesc}>{opt.desc}</span>
          </div>
        </label>
      ))}
    </div>
  </div>
)

const ProfileSettings = ({ onSaved }: { onSaved: (firstName: string) => void }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    heightCm: '',
    heightUom: 'cm' as 'cm' | 'ft',
    weightUom: 'kg' as 'kg' | 'lbs',
  })

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.ok ? r.json() as Promise<UserProfile> : r.status === 404 ? null : Promise.reject(`HTTP ${r.status}`))
      .then(data => {
        if (data) {
          setProfile(data)
          setForm({
            firstName: data.firstName,
            lastName:  data.lastName,
            heightCm:  String(data.heightCm),
            heightUom: data.heightUom ?? 'cm',
            weightUom: data.weightUom ?? 'kg',
          })
        }
        setLoading(false)
      })
      .catch(err => {
        setError(`Could not load profile: ${err}. Make sure the API is running.`)
        setLoading(false)
      })
  }, [])

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const heightNum = parseFloat(form.heightCm)
    if (!form.firstName.trim()) { setError('First name is required.'); return }
    if (!form.lastName.trim())  { setError('Last name is required.'); return }
    if (isNaN(heightNum) || heightNum <= 0) { setError('Please enter a valid height in cm.'); return }

    setSaving(true)
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          heightCm:  heightNum,
          heightUom: form.heightUom,
          weightUom: form.weightUom,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const saved = await res.json() as UserProfile
      setProfile(saved)
      setSuccess(true)
      onSaved(saved.firstName)
    } catch (err) {
      setError(`Failed to save: ${err}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.spinner} aria-label="Loading profile" />
      </div>
    )
  }

  const heightNum = parseFloat(form.heightCm)
  const heightPreview = !isNaN(heightNum) && heightNum > 0 ? cmToFeetInches(heightNum) : null

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon} aria-hidden="true">👤</span>
          <div>
            <h2 className={styles.cardTitle}>User Profile</h2>
            <p className={styles.cardSubtitle}>
              {profile ? `Last updated: ${new Date(profile.updatedAt).toLocaleString()}` : 'No profile saved yet'}
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="firstName">First Name</label>
              <input id="firstName" className={styles.input} type="text"
                value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
                placeholder="e.g. Alex" autoComplete="given-name" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lastName">Last Name</label>
              <input id="lastName" className={styles.input} type="text"
                value={form.lastName} onChange={e => handleChange('lastName', e.target.value)}
                placeholder="e.g. Smith" autoComplete="family-name" required />
            </div>
          </div>

          {/* Height */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="heightCm">Height (cm)</label>
            <div className={styles.heightRow}>
              <input id="heightCm" className={styles.input} type="number"
                min="50" max="300" step="0.1"
                value={form.heightCm} onChange={e => handleChange('heightCm', e.target.value)}
                placeholder="e.g. 175.5" required />
              {heightPreview && (
                <span className={styles.heightPreview} aria-label={`Equivalent to ${heightPreview}`}>
                  = {heightPreview}
                </span>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          {/* UOM preferences */}
          <p className={styles.sectionLabel}>Unit Preferences</p>

          <UomRadioGroup
            id="heightUom"
            label="Height Primary UOM"
            options={HEIGHT_OPTIONS}
            value={form.heightUom}
            onChange={v => handleChange('heightUom', v)}
          />

          <UomRadioGroup
            id="weightUom"
            label="Weight Primary UOM"
            options={WEIGHT_OPTIONS}
            value={form.weightUom}
            onChange={v => handleChange('weightUom', v)}
          />

          {error && <div className={styles.errorBanner} role="alert">⚠️ {error}</div>}
          {success && <div className={styles.successBanner} role="status">✅ Profile saved successfully!</div>}

          <div className={styles.actions}>
            <button className={styles.saveBtn} type="submit" disabled={saving} aria-busy={saving}>
              {saving ? 'Saving…' : profile ? 'Update Profile' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileSettings
