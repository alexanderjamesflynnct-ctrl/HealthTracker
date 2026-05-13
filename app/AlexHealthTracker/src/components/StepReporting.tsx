import { useEffect, useRef, useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ErrorBar, ReferenceLine,
  BarChart, Cell,
} from 'recharts'
import styles from './StepReporting.module.css'

interface MonthlyActivityStats {
  month: string
  monthLabel: string
  minSteps: number
  maxSteps: number
  avgSteps: number
  dayCount: number
}

const API_BASE = 'http://localhost:5181/api/activity'
const LATEST_URL = 'http://localhost:5181/api/dashboard/latest'
const DEFAULT_VISIBLE = 12
const BAR_WIDTH = 72
const CHART_HEIGHT = 400
const Y_AXIS_WIDTH = 80

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

interface ChartPoint {
  label: string
  avg: number
  min: number
  max: number
  whiskerCenter: number
  whiskerError: [number, number]
}

interface YearlyTotal {
  year: string
  totalSteps: number
}

const TOTALS_URL = `${API_BASE}/totals`

// ── Yearly totals tooltip ────────────────────────────────
const TotalTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      <p className={styles.tooltipAvg}>Total: <strong>{payload[0].value.toLocaleString()} steps</strong></p>
    </div>
  )
}
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const avg = payload.find(p => p.name === 'Avg')?.value
  const min = payload.find(p => p.name === 'Min')?.value
  const max = payload.find(p => p.name === 'Max')?.value
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      {max !== undefined && <p className={styles.tooltipMax}>Max: <strong>{max.toLocaleString()} steps</strong></p>}
      {avg !== undefined && <p className={styles.tooltipAvg}>Avg: <strong>{avg.toLocaleString()} steps</strong></p>}
      {min !== undefined && <p className={styles.tooltipMin}>Min: <strong>{min.toLocaleString()} steps</strong></p>}
    </div>
  )
}

// ── Reusable whisker chart ───────────────────────────────
const WhiskerChart = ({
  points, domain, scrollToRight = false, latestSteps,
}: {
  points: ChartPoint[]
  domain: [number, number]
  scrollToRight?: boolean
  latestSteps?: number
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
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              width={Y_AXIS_WIDTH}
              label={{
                value: 'Steps / day',
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
      <div ref={scrollRef} className={styles.chartScroll} tabIndex={0} aria-label="Scrollable step chart">
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
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
              <ReferenceLine y={domain[0]} stroke="transparent" />
              {latestSteps !== undefined && (
                <ReferenceLine
                  y={latestSteps}
                  stroke="#7b1fa2"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{
                    value: `Latest: ${latestSteps.toLocaleString()} steps`,
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
const AxisControls = ({ autoMin, autoMax, yMinInput, yMaxInput, setYMinInput, setYMaxInput }: {
  autoMin: number; autoMax: number
  yMinInput: string; yMaxInput: string
  setYMinInput: (v: string) => void
  setYMaxInput: (v: string) => void
}) => (
  <div className={styles.axisControls} role="group" aria-label="Y-axis range controls">
    <span className={styles.axisControlsLabel}>Y-axis range (steps)</span>
    <label className={styles.axisField}>
      <span className={styles.axisFieldLabel}>Min</span>
      <input className={styles.axisInput} type="number" step="100"
        value={yMinInput} onChange={e => setYMinInput(e.target.value)} />
    </label>
    <span className={styles.axisSep}>–</span>
    <label className={styles.axisField}>
      <span className={styles.axisFieldLabel}>Max</span>
      <input className={styles.axisInput} type="number" step="100"
        value={yMaxInput} onChange={e => setYMaxInput(e.target.value)} />
    </label>
    <button className={styles.resetBtn} type="button"
      onClick={() => { setYMinInput(String(autoMin)); setYMaxInput(String(autoMax)) }}>
      ↺ Auto
    </button>
  </div>
)

// ── Helpers ──────────────────────────────────────────────
const toPoints = (data: MonthlyActivityStats[]): ChartPoint[] =>
  data.map(m => ({
    label: m.monthLabel,
    avg: m.avgSteps,
    min: m.minSteps,
    max: m.maxSteps,
    whiskerCenter: m.avgSteps,
    whiskerError: [m.avgSteps - m.minSteps, m.maxSteps - m.avgSteps] as [number, number],
  }))

const autoBounds = (points: ChartPoint[]) => {
  const vals = points.flatMap(p => [p.min, p.max])
  return vals.length
    ? [Math.max(0, Math.floor(Math.min(...vals) - 500)), Math.ceil(Math.max(...vals) + 500)]
    : [0, 20000]
}

// ── Main component ───────────────────────────────────────
const StepReporting = () => {
  // Latest steps reference line
  const [latestSteps, setLatestSteps] = useState<number | undefined>()
  useEffect(() => {
    fetch(LATEST_URL)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.steps) setLatestSteps(d.steps) })
      .catch(() => {})
  }, [])

  // ── Yearly totals chart ──
  const [totalsData, setTotalsData] = useState<YearlyTotal[]>([])
  const [totalsLoading, setTotalsLoading] = useState(true)
  const [totalsError, setTotalsError] = useState(false)

  useEffect(() => {
    fetch(TOTALS_URL)
      .then(r => r.ok ? r.json() as Promise<YearlyTotal[]> : Promise.reject())
      .then(d => { setTotalsData(d); setTotalsLoading(false) })
      .catch(() => { setTotalsError(true); setTotalsLoading(false) })
  }, [])

  // ── All-time monthly chart ──
  const [allData, setAllData] = useState<MonthlyActivityStats[]>([])
  const [allLoading, setAllLoading] = useState(true)
  const [allError, setAllError] = useState(false)
  const [allYMin, setAllYMin] = useState('')
  const [allYMax, setAllYMax] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/monthly`)
      .then(r => r.ok ? r.json() as Promise<MonthlyActivityStats[]> : Promise.reject())
      .then(d => { setAllData(d); setAllLoading(false) })
      .catch(() => { setAllError(true); setAllLoading(false) })
  }, [])

  // ── YoY by month chart ──
  const currentMonth = new Date().getMonth() + 1
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [yoyData, setYoyData] = useState<MonthlyActivityStats[]>([])
  const [yoyLoading, setYoyLoading] = useState(true)
  const [yoyError, setYoyError] = useState(false)
  const [yoyYMin, setYoyYMin] = useState('')
  const [yoyYMax, setYoyYMax] = useState('')

  useEffect(() => {
    setYoyLoading(true); setYoyError(false)
    fetch(`${API_BASE}/yoy/${selectedMonth}`)
      .then(r => r.ok ? r.json() as Promise<MonthlyActivityStats[]> : Promise.reject())
      .then(d => { setYoyData(d); setYoyLoading(false) })
      .catch(() => { setYoyError(true); setYoyLoading(false) })
  }, [selectedMonth])

  // ── Annual summary chart ──
  const [annualData, setAnnualData] = useState<MonthlyActivityStats[]>([])
  const [annualLoading, setAnnualLoading] = useState(true)
  const [annualError, setAnnualError] = useState(false)
  const [annualYMin, setAnnualYMin] = useState('')
  const [annualYMax, setAnnualYMax] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/annual`)
      .then(r => r.ok ? r.json() as Promise<MonthlyActivityStats[]> : Promise.reject())
      .then(d => { setAnnualData(d); setAnnualLoading(false) })
      .catch(() => { setAnnualError(true); setAnnualLoading(false) })
  }, [])

  const allPoints    = useMemo(() => toPoints(allData),    [allData])
  const yoyPoints    = useMemo(() => toPoints(yoyData),    [yoyData])
  const annualPoints = useMemo(() => toPoints(annualData), [annualData])

  const [allAutoMin,    allAutoMax]    = useMemo(() => autoBounds(allPoints),    [allPoints])
  const [yoyAutoMin,    yoyAutoMax]    = useMemo(() => autoBounds(yoyPoints),    [yoyPoints])
  const [annualAutoMin, annualAutoMax] = useMemo(() => autoBounds(annualPoints), [annualPoints])

  useEffect(() => { if (allPoints.length)    { setAllYMin(String(allAutoMin));       setAllYMax(String(allAutoMax))       } }, [allAutoMin, allAutoMax])
  useEffect(() => { if (yoyPoints.length)    { setYoyYMin(String(yoyAutoMin));       setYoyYMax(String(yoyAutoMax))       } }, [yoyAutoMin, yoyAutoMax])
  useEffect(() => { if (annualPoints.length) { setAnnualYMin(String(annualAutoMin)); setAnnualYMax(String(annualAutoMax)) } }, [annualAutoMin, annualAutoMax])

  const allDomain:    [number, number] = [isNaN(parseFloat(allYMin))    ? allAutoMin    : parseFloat(allYMin),    isNaN(parseFloat(allYMax))    ? allAutoMax    : parseFloat(allYMax)]
  const yoyDomain:    [number, number] = [isNaN(parseFloat(yoyYMin))    ? yoyAutoMin    : parseFloat(yoyYMin),    isNaN(parseFloat(yoyYMax))    ? yoyAutoMax    : parseFloat(yoyYMax)]
  const annualDomain: [number, number] = [isNaN(parseFloat(annualYMin)) ? annualAutoMin : parseFloat(annualYMin), isNaN(parseFloat(annualYMax)) ? annualAutoMax : parseFloat(annualYMax)]

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>🏃 Step Reporting</h2>

      {/* ── Yearly totals ── */}
      <section aria-labelledby="step-totals-heading">
        <div className={styles.chartHeader}>
          <h3 id="step-totals-heading" className={styles.sectionHeading}>Total Steps by Year</h3>
          {!totalsLoading && !totalsError && <span className={styles.badge}>{totalsData.length} years</span>}
        </div>
        <p className={styles.chartHint}>Sum of all daily step counts per year (deduped to max per day).</p>
        {totalsLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         totalsError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         <div className={styles.totalsChart}>
           <ResponsiveContainer width="100%" height={280}>
             <BarChart data={totalsData} margin={{ top: 16, right: 24, bottom: 8, left: 16 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
               <XAxis dataKey="year"
                 tick={{ fontSize: 12, fill: '#616161' }}
                 tickLine={{ stroke: '#e0e0e0' }}
                 axisLine={{ stroke: '#bdbdbd' }} />
               <YAxis
                 tick={{ fontSize: 11, fill: '#616161' }}
                 tickLine={{ stroke: '#e0e0e0' }}
                 axisLine={{ stroke: '#bdbdbd' }}
                 tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                 width={64}
                 label={{ value: 'Total steps', angle: -90, position: 'insideLeft', offset: -4, style: { fontSize: 11, fill: '#616161' } }}
               />
               <Tooltip content={<TotalTooltip />} />
               <Bar dataKey="totalSteps" name="Total Steps" radius={[4, 4, 0, 0]}>
                 {totalsData.map((entry, i) => (
                   <Cell
                     key={entry.year}
                     fill={i === totalsData.length - 1 ? '#1b5e20' : '#4caf50'}
                   />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </div>}
      </section>

      {/* ── All-time monthly ── */}
      <section aria-labelledby="step-all-heading">
        <div className={styles.chartHeader}>
          <h3 id="step-all-heading" className={styles.sectionHeading}>All-Time Steps by Month</h3>
          {!allLoading && !allError && <span className={styles.badge}>{allData.length} months</span>}
        </div>
        <AxisControls autoMin={allAutoMin} autoMax={allAutoMax}
          yMinInput={allYMin} yMaxInput={allYMax}
          setYMinInput={setAllYMin} setYMaxInput={setAllYMax} />
        <p className={styles.chartHint}>Min→Max range bars with Min / Avg / Max lines. Scroll to see all months.</p>
        {allLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         allError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         <WhiskerChart points={allPoints} domain={allDomain} scrollToRight latestSteps={latestSteps} />}
      </section>

      {/* ── YoY by month ── */}
      <section aria-labelledby="step-yoy-heading" className={styles.section}>
        <div className={styles.chartHeader}>
          <h3 id="step-yoy-heading" className={styles.sectionHeading}>Year-over-Year by Month</h3>
          {!yoyLoading && !yoyError && <span className={styles.badge}>{yoyData.length} years</span>}
        </div>
        <div className={styles.monthSelector} role="group" aria-label="Select month">
          <span className={styles.axisControlsLabel}>Month</span>
          <div className={styles.monthButtons}>
            {MONTHS.map((name, i) => (
              <button key={name} type="button"
                className={`${styles.monthBtn} ${selectedMonth === i + 1 ? styles.monthBtnActive : ''}`}
                onClick={() => setSelectedMonth(i + 1)}
                aria-pressed={selectedMonth === i + 1}>
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <AxisControls autoMin={yoyAutoMin} autoMax={yoyAutoMax}
          yMinInput={yoyYMin} yMaxInput={yoyYMax}
          setYMinInput={setYoyYMin} setYMaxInput={setYoyYMax} />
        <p className={styles.chartHint}>
          Each bar is one year's data for <strong>{MONTHS[selectedMonth - 1]}</strong>. Oldest year on the left.
        </p>
        {yoyLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         yoyError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         yoyData.length === 0 ? <p className={styles.errorText}>No data for {MONTHS[selectedMonth - 1]}.</p> :
         <WhiskerChart points={yoyPoints} domain={yoyDomain} latestSteps={latestSteps} />}
      </section>

      {/* ── Annual summary ── */}
      <section aria-labelledby="step-annual-heading" className={styles.section}>
        <div className={styles.chartHeader}>
          <h3 id="step-annual-heading" className={styles.sectionHeading}>Year-over-Year Annual Summary</h3>
          {!annualLoading && !annualError && <span className={styles.badge}>{annualData.length} years</span>}
        </div>
        <AxisControls autoMin={annualAutoMin} autoMax={annualAutoMax}
          yMinInput={annualYMin} yMaxInput={annualYMax}
          setYMinInput={setAnnualYMin} setYMaxInput={setAnnualYMax} />
        <p className={styles.chartHint}>
          Each bar represents a full year — min, max, and average daily steps across all days that year.
        </p>
        {annualLoading ? <div className={styles.skeleton} aria-hidden="true" /> :
         annualError   ? <p className={styles.errorText}>⚠️ Could not load data — make sure the API is running.</p> :
         <WhiskerChart points={annualPoints} domain={annualDomain} latestSteps={latestSteps} />}
      </section>
    </div>
  )
}

export default StepReporting
