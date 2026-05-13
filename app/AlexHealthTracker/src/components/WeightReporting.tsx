import { useEffect, useRef, useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ErrorBar, ReferenceLine,
} from 'recharts'
import styles from './WeightReporting.module.css'
import { useWeightUom } from '../hooks/useWeightUom'
import { useAppStrings } from '../hooks/useAppStrings'

interface MonthlyWeightStats {
  month: string
  monthLabel: string
  minKg: number; minLbs: number
  maxKg: number; maxLbs: number
  avgKg: number; avgLbs: number
  recordCount: number
}

const API_BASE = 'http://localhost:5181/api/weight'
const DEFAULT_VISIBLE = 12
const BAR_WIDTH = 72
const CHART_HEIGHT = 400
const Y_AXIS_WIDTH = 72

const MONTHS_FALLBACK = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const MONTH_KEYS = [
  'month_jan','month_feb','month_mar','month_apr','month_may','month_jun',
  'month_jul','month_aug','month_sep','month_oct','month_nov','month_dec',
]

interface ChartPoint {
  label: string
  avg: number; min: number; max: number
  whiskerCenter: number
  whiskerError: [number, number]
}

// ── Shared tooltip ───────────────────────────────────────
const CustomTooltip = ({ active, payload, label, uom }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
  uom: string
}) => {
  if (!active || !payload?.length) return null
  const avg = payload.find(p => p.name === 'Avg')?.value
  const min = payload.find(p => p.name === 'Min')?.value
  const max = payload.find(p => p.name === 'Max')?.value
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      {max !== undefined && <p className={styles.tooltipMax}>Max: <strong>{max} {uom}</strong></p>}
      {avg !== undefined && <p className={styles.tooltipAvg}>Avg: <strong>{avg} {uom}</strong></p>}
      {min !== undefined && <p className={styles.tooltipMin}>Min: <strong>{min} {uom}</strong></p>}
    </div>
  )
}

// ── Reusable whisker chart ───────────────────────────────
const WhiskerChart = ({
  points, domain, uom, scrollToRight = false, latestWeight,
}: {
  points: ChartPoint[]
  domain: [number, number]
  uom: string
  scrollToRight?: boolean
  latestWeight?: number
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const chartWidth = Math.max(points.length * BAR_WIDTH, DEFAULT_VISIBLE * BAR_WIDTH)
  const sharedMargin = { top: 16, right: 0, bottom: 60, left: 0 }

  useEffect(() => {
    if (scrollToRight && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [points, scrollToRight])

  return (
    <div className={styles.chartOuter}>
      {/* Fixed Y-axis */}
      <div className={styles.yAxisPanel} style={{ width: Y_AXIS_WIDTH }}>
        <ResponsiveContainer width={Y_AXIS_WIDTH} height={CHART_HEIGHT}>
          <ComposedChart data={points} margin={sharedMargin}>
            <YAxis
              domain={domain}
              tick={{ fontSize: 11, fill: '#616161' }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#bdbdbd' }}
              tickCount={8}
              unit={` ${uom}`}
              width={Y_AXIS_WIDTH}
              label={{
                value: `Weight (${uom})`,
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { fontSize: 11, fill: '#616161' },
              }}
            />
            <Bar dataKey="whiskerCenter" fill="transparent" stroke="none" barSize={0} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scrollable chart */}
      <div ref={scrollRef} className={styles.chartScroll} tabIndex={0} aria-label="Scrollable chart">
        <div style={{ width: chartWidth, minWidth: `${DEFAULT_VISIBLE * BAR_WIDTH}px` }}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <ComposedChart data={points} margin={sharedMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="label"
                tick={{ fontSize: 11, fill: '#616161' }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#bdbdbd' }}
                interval={0} angle={-40} textAnchor="end" height={60} />
              <YAxis domain={domain} hide />
              <Tooltip content={<CustomTooltip uom={uom} />} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
              <ReferenceLine y={domain[0]} stroke="transparent" />
              {latestWeight !== undefined && (
                <ReferenceLine
                  y={latestWeight}
                  stroke="#7b1fa2"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{
                    value: `Latest: ${latestWeight} ${uom}`,
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: '#7b1fa2',
                    fontWeight: 600,
                  }}
                />
              )}
              <Bar dataKey="whiskerCenter" name="Range"
                fill="rgba(46,125,50,0.12)" stroke="#2e7d32"
                strokeWidth={1} barSize={18} legendType="none">
                <ErrorBar dataKey="whiskerError" width={10} strokeWidth={2} stroke="#2e7d32" direction="y" />
              </Bar>
              <Line type="monotone" dataKey="min" name="Min"
                stroke="#66bb6a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="avg" name="Avg"
                stroke="#1b5e20" strokeWidth={2.5}
                dot={{ r: 3, fill: '#1b5e20' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="max" name="Max"
                stroke="#ef6c00" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ── Y-axis controls ──────────────────────────────────────
const AxisControls = ({ uom, autoMin, autoMax, yMinInput, yMaxInput, setYMinInput, setYMaxInput }: {
  uom: string; autoMin: number; autoMax: number
  yMinInput: string; yMaxInput: string
  setYMinInput: (v: string) => void
  setYMaxInput: (v: string) => void
}) => (
  <div className={styles.axisControls} role="group" aria-label="Y-axis range controls">
    <span className={styles.axisControlsLabel}>Y-axis range ({uom})</span>
    <label className={styles.axisField}>
      <span className={styles.axisFieldLabel}>Min</span>
      <input className={styles.axisInput} type="number" step="0.5"
        value={yMinInput} onChange={e => setYMinInput(e.target.value)} />
    </label>
    <span className={styles.axisSep}>–</span>
    <label className={styles.axisField}>
      <span className={styles.axisFieldLabel}>Max</span>
      <input className={styles.axisInput} type="number" step="0.5"
        value={yMaxInput} onChange={e => setYMaxInput(e.target.value)} />
    </label>
    <button className={styles.resetBtn} type="button"
      onClick={() => { setYMinInput(String(autoMin)); setYMaxInput(String(autoMax)) }}>
      ↺ Auto
    </button>
  </div>
)

// ── Helpers ──────────────────────────────────────────────
const toPoints = (data: MonthlyWeightStats[], isPrimLbs: boolean): ChartPoint[] =>
  data.map(m => {
    const avg = isPrimLbs ? m.avgLbs : m.avgKg
    const min = isPrimLbs ? m.minLbs : m.minKg
    const max = isPrimLbs ? m.maxLbs : m.maxKg
    return { label: m.monthLabel, avg, min, max, whiskerCenter: avg, whiskerError: [avg - min, max - avg] }
  })

const autoBounds = (points: ChartPoint[]) => {
  const vals = points.flatMap(p => [p.min, p.max])
  return vals.length
    ? [Math.floor(Math.min(...vals) - 2), Math.ceil(Math.max(...vals) + 2)]
    : [0, 100]
}

// ── Main component ───────────────────────────────────────
const WeightReporting = () => {
  const weightUom = useWeightUom()
  const { s } = useAppStrings()
  const months = MONTH_KEYS.map((key, i) => s('Common', key, MONTHS_FALLBACK[i]))
  const isPrimLbs = weightUom === 'lbs'
  const uom = isPrimLbs ? 'lbs' : 'kg'

  // ── Latest weight (for reference line) ──
  const [latestWeightKg, setLatestWeightKg] = useState<number | undefined>()

  useEffect(() => {
    fetch('http://localhost:5181/api/dashboard/latest')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.weightKg) setLatestWeightKg(d.weightKg) })
      .catch(() => {})
  }, [])

  // ── Annual summary chart ──
  const [annualData, setAnnualData] = useState<MonthlyWeightStats[]>([])
  const [annualLoading, setAnnualLoading] = useState(true)
  const [annualError, setAnnualError] = useState(false)
  const [annualYMin, setAnnualYMin] = useState('')
  const [annualYMax, setAnnualYMax] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/annual`)
      .then(r => r.ok ? r.json() as Promise<MonthlyWeightStats[]> : Promise.reject())
      .then(d => { setAnnualData(d); setAnnualLoading(false) })
      .catch(() => { setAnnualError(true); setAnnualLoading(false) })
  }, [])

  // ── All-time chart ──
  const [allData, setAllData] = useState<MonthlyWeightStats[]>([])
  const [allLoading, setAllLoading] = useState(true)
  const [allError, setAllError] = useState(false)
  const [allYMin, setAllYMin] = useState('')
  const [allYMax, setAllYMax] = useState('')

  // ── YoY chart ──
  const currentMonth = new Date().getMonth() + 1  // 1-12
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [yoyData, setYoyData] = useState<MonthlyWeightStats[]>([])
  const [yoyLoading, setYoyLoading] = useState(true)
  const [yoyError, setYoyError] = useState(false)
  const [yoyYMin, setYoyYMin] = useState('')
  const [yoyYMax, setYoyYMax] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/monthly`)
      .then(r => r.ok ? r.json() as Promise<MonthlyWeightStats[]> : Promise.reject())
      .then(d => { setAllData(d); setAllLoading(false) })
      .catch(() => { setAllError(true); setAllLoading(false) })
  }, [])

  useEffect(() => {
    setYoyLoading(true)
    setYoyError(false)
    fetch(`${API_BASE}/yoy/${selectedMonth}`)
      .then(r => r.ok ? r.json() as Promise<MonthlyWeightStats[]> : Promise.reject())
      .then(d => { setYoyData(d); setYoyLoading(false) })
      .catch(() => { setYoyError(true); setYoyLoading(false) })
  }, [selectedMonth])

  const allPoints = useMemo(() => toPoints(allData, isPrimLbs), [allData, isPrimLbs])
  const yoyPoints = useMemo(() => toPoints(yoyData, isPrimLbs), [yoyData, isPrimLbs])
  const annualPoints = useMemo(() => toPoints(annualData, isPrimLbs), [annualData, isPrimLbs])

  const [allAutoMin, allAutoMax] = useMemo(() => autoBounds(allPoints), [allPoints])
  const [yoyAutoMin, yoyAutoMax] = useMemo(() => autoBounds(yoyPoints), [yoyPoints])
  const [annualAutoMin, annualAutoMax] = useMemo(() => autoBounds(annualPoints), [annualPoints])

  // Seed axis inputs when auto bounds change
  useEffect(() => { if (allPoints.length) { setAllYMin(String(allAutoMin)); setAllYMax(String(allAutoMax)) } }, [allAutoMin, allAutoMax])
  useEffect(() => { if (yoyPoints.length) { setYoyYMin(String(yoyAutoMin)); setYoyYMax(String(yoyAutoMax)) } }, [yoyAutoMin, yoyAutoMax])
  useEffect(() => { if (annualPoints.length) { setAnnualYMin(String(annualAutoMin)); setAnnualYMax(String(annualAutoMax)) } }, [annualAutoMin, annualAutoMax])

  const allDomain: [number, number] = [
    isNaN(parseFloat(allYMin)) ? allAutoMin : parseFloat(allYMin),
    isNaN(parseFloat(allYMax)) ? allAutoMax : parseFloat(allYMax),
  ]
  const yoyDomain: [number, number] = [
    isNaN(parseFloat(yoyYMin)) ? yoyAutoMin : parseFloat(yoyYMin),
    isNaN(parseFloat(yoyYMax)) ? yoyAutoMax : parseFloat(yoyYMax),
  ]
  const annualDomain: [number, number] = [
    isNaN(parseFloat(annualYMin)) ? annualAutoMin : parseFloat(annualYMin),
    isNaN(parseFloat(annualYMax)) ? annualAutoMax : parseFloat(annualYMax),
  ]

  const latestDisplay = latestWeightKg !== undefined
    ? Math.round((isPrimLbs ? latestWeightKg * 2.20462 : latestWeightKg) * 10) / 10
    : undefined

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>{s('WeightReporting', 'page_title', '⚖️ Weight Reporting')}</h2>

      {/* ── All-time chart ── */}
      <section aria-labelledby="all-time-heading">
        <div className={styles.chartHeader}>
          <h3 id="all-time-heading" className={styles.sectionHeading}>All-Time Weight by Month</h3>
          {!allLoading && !allError && <span className={styles.badge}>{allData.length} months · {uom}</span>}
        </div>
        <AxisControls uom={uom} autoMin={allAutoMin} autoMax={allAutoMax}
          yMinInput={allYMin} yMaxInput={allYMax}
          setYMinInput={setAllYMin} setYMaxInput={setAllYMax} />
        <p className={styles.chartHint}>{s('WeightReporting', 'alltime_hint', 'Min→Max range bars with Min / Avg / Max lines. Scroll to see all months.')}</p>
        {allLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         allError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         <WhiskerChart points={allPoints} domain={allDomain} uom={uom} scrollToRight latestWeight={latestDisplay} />}
      </section>

      {/* ── Year-over-year chart ── */}
      <section aria-labelledby="yoy-heading" className={styles.yoySection}>
        <div className={styles.chartHeader}>
          <h3 id="yoy-heading" className={styles.sectionHeading}>Year-over-Year by Month</h3>
          {!yoyLoading && !yoyError && <span className={styles.badge}>{yoyData.length} years · {uom}</span>}
        </div>

        {/* Month selector */}
        <div className={styles.monthSelector} role="group" aria-label="Select month to compare">
          <span className={styles.axisControlsLabel}>Month</span>
          <div className={styles.monthButtons}>
            {months.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`${styles.monthBtn} ${selectedMonth === i + 1 ? styles.monthBtnActive : ''}`}
                onClick={() => setSelectedMonth(i + 1)}
                aria-pressed={selectedMonth === i + 1}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <AxisControls uom={uom} autoMin={yoyAutoMin} autoMax={yoyAutoMax}
          yMinInput={yoyYMin} yMaxInput={yoyYMax}
          setYMinInput={setYoyYMin} setYMaxInput={setYoyYMax} />
        <p className={styles.chartHint}>
          {s('WeightReporting', 'yoy_hint_prefix', 'Each bar is one year\'s data for')} <strong>{months[selectedMonth - 1]}</strong>. {s('WeightReporting', 'yoy_hint_suffix', 'Oldest year on the left.')}
        </p>
        {yoyLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         yoyError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         yoyData.length === 0 ? <p className={styles.errorText}>No data for {months[selectedMonth - 1]}.</p> :
         <WhiskerChart points={yoyPoints} domain={yoyDomain} uom={uom} latestWeight={latestDisplay} />}
      </section>

      {/* ── Annual summary chart ── */}
      <section aria-labelledby="annual-heading" className={styles.yoySection}>
        <div className={styles.chartHeader}>
          <h3 id="annual-heading" className={styles.sectionHeading}>Year-over-Year Annual Summary</h3>
          {!annualLoading && !annualError && <span className={styles.badge}>{annualData.length} years · {uom}</span>}
        </div>
        <AxisControls uom={uom} autoMin={annualAutoMin} autoMax={annualAutoMax}
          yMinInput={annualYMin} yMaxInput={annualYMax}
          setYMinInput={setAnnualYMin} setYMaxInput={setAnnualYMax} />
        <p className={styles.chartHint}>
          {s('WeightReporting', 'annual_hint', 'Each bar represents a full year — min, max, and average weight across all readings for that year. Oldest on the left.')}
        </p>
        {annualLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         annualError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         <WhiskerChart points={annualPoints} domain={annualDomain} uom={uom} latestWeight={latestDisplay} />}
      </section>
    </div>
  )
}

export default WeightReporting
