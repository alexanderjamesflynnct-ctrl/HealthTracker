import { useEffect, useState, useMemo, useCallback } from 'react'
import styles from './PedometerRawData.module.css'
import { useAppStrings } from '../hooks/useAppStrings'

interface PedometerRow {
  dataUuid: string
  dayTime: string | null
  stepCount: number
  calorie: number
}

interface PagedResult {
  items: PedometerRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

type SortKey = 'dayTime' | 'stepCount' | 'calorie'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const API_BASE = 'http://localhost:5181/api/pedometer'

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <span className={styles.sortIcon} aria-hidden="true">⇅</span>
  return <span className={styles.sortIcon} aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

const PedometerRawData = () => {
  const { s } = useAppStrings()
  const [result, setResult] = useState<PagedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search inputs are debounced before being sent to the API
  const [searchInput, setSearchInput] = useState({ dayTime: '', stepCount: '', calorie: '' })
  const [search, setSearch] = useState({ dayTime: '', stepCount: '', calorie: '' })

  const [sortKey, setSortKey] = useState<SortKey>('dayTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Debounce search inputs by 400ms
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset to page 1 when filters or sort change
  useEffect(() => { setPage(1) }, [search, sortKey, sortDir, pageSize])

  // Fetch from API whenever page/pageSize/sort/search changes
  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page:      String(page),
      pageSize:  String(pageSize),
      sortBy:    sortKey,
      sortDir:   sortDir,
    })
    if (search.dayTime)    params.set('search_dayTime',   search.dayTime)
    if (search.stepCount)  params.set('search_stepCount', search.stepCount)
    if (search.calorie)    params.set('search_calorie',   search.calorie)

    fetch(`${API_BASE}?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<PagedResult>
      })
      .then(data => { setResult(data); setLoading(false) })
      .catch(err => {
        setError(`Failed to load data: ${err.message}. Make sure the API is running.`)
        setLoading(false)
      })
  }, [page, pageSize, sortKey, sortDir, search])

  const handleSort = useCallback((col: SortKey) => {
    if (col === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(col)
      setSortDir('asc')
    }
  }, [sortKey])

  const handleSearchChange = (col: keyof typeof searchInput, value: string) => {
    setSearchInput(prev => ({ ...prev, [col]: value }))
  }

  const clearSearch = () => {
    setSearchInput({ dayTime: '', stepCount: '', calorie: '' })
    setSearch({ dayTime: '', stepCount: '', calorie: '' })
  }

  const hasActiveSearch = Object.values(searchInput).some(v => v !== '')

  const totalPages = result?.totalPages ?? 1
  const safePage   = result?.page ?? 1

  const pageWindow = useMemo(() => {
    const delta = 3
    const start = Math.max(1, safePage - delta)
    const end   = Math.min(totalPages, safePage + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  const thClass = (col: SortKey) =>
    [styles.th, col !== 'dayTime' ? styles.thNum : '', styles.thSortable, col === sortKey ? styles.thActive : '']
      .filter(Boolean).join(' ')

  if (error && !result) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={() => setPage(p => p)} type="button">Retry</button>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 className={styles.title}>{s('PedometerRawData', 'page_title', '🏃 Activity — Raw Data')}</h2>
          {result && (
            <span className={styles.badge}>
              {result.totalCount.toLocaleString()} row{result.totalCount !== 1 ? 's' : ''}
              {hasActiveSearch ? ' (filtered)' : ''}
            </span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          {hasActiveSearch && (
            <button className={styles.clearBtn} onClick={clearSearch} type="button">
              ✕ Clear filters
            </button>
          )}
          <label className={styles.pageSizeLabel}>
            Rows per page
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Pedometer day summary data">
          <thead>
            <tr>
              <th scope="col" className={thClass('dayTime')} onClick={() => handleSort('dayTime')}
                aria-sort={sortKey === 'dayTime' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <span className={styles.thContent}>
                  {s('PedometerRawData', 'col_date', 'Date / Time')} <SortIcon col="dayTime" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
              <th scope="col" className={thClass('stepCount')} onClick={() => handleSort('stepCount')}
                aria-sort={sortKey === 'stepCount' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <span className={styles.thContent}>
                  {s('PedometerRawData', 'col_steps', 'Steps')} <SortIcon col="stepCount" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
              <th scope="col" className={thClass('calorie')} onClick={() => handleSort('calorie')}
                aria-sort={sortKey === 'calorie' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <span className={styles.thContent}>
                  {s('PedometerRawData', 'col_calories', 'Calories')} <SortIcon col="calorie" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
            </tr>
            {/* Search row */}
            <tr className={styles.searchRow}>
              <th scope="col" className={styles.searchCell}>
                <input className={styles.searchInput} type="text" placeholder={s('PedometerRawData', 'search_date', 'Search date…')}
                  value={searchInput.dayTime}
                  onChange={e => handleSearchChange('dayTime', e.target.value)}
                  aria-label="Filter by date/time" />
              </th>
              <th scope="col" className={styles.searchCell}>
                <input className={`${styles.searchInput} ${styles.searchInputNum}`} type="text" placeholder={s('PedometerRawData', 'search_placeholder', 'Search…')}
                  value={searchInput.stepCount}
                  onChange={e => handleSearchChange('stepCount', e.target.value)}
                  aria-label="Filter by step count" />
              </th>
              <th scope="col" className={styles.searchCell}>
                <input className={`${styles.searchInput} ${styles.searchInputNum}`} type="text" placeholder={s('PedometerRawData', 'search_placeholder', 'Search…')}
                  value={searchInput.calorie}
                  onChange={e => handleSearchChange('calorie', e.target.value)}
                  aria-label="Filter by calories" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows while loading
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><span className={styles.skeletonCell} /></td>
                  <td className={`${styles.td} ${styles.tdNum}`}><span className={styles.skeletonCell} /></td>
                  <td className={`${styles.td} ${styles.tdNum}`}><span className={styles.skeletonCell} /></td>
                </tr>
              ))
            ) : result?.items.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.emptyCell}>{s('PedometerRawData', 'no_records', 'No records match your filters.')}</td>
              </tr>
            ) : (
              result?.items.map(row => (
                <tr key={row.dataUuid} className={styles.tr}>
                  <td className={styles.td}>{row.dayTime ?? '—'}</td>
                  <td className={`${styles.td} ${styles.tdNum}`}>{row.stepCount.toLocaleString()}</td>
                  <td className={`${styles.td} ${styles.tdNum}`}>{row.calorie.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination} role="navigation" aria-label="Table pagination">
        <span className={styles.pageInfo}>
          {result
            ? `Page ${safePage} of ${totalPages} — ${result.totalCount.toLocaleString()} total rows`
            : 'Loading…'}
        </span>
        <div className={styles.pageButtons}>
          <button className={styles.pageBtn} onClick={() => setPage(1)} disabled={safePage === 1 || loading} aria-label="First page">«</button>
          <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1 || loading} aria-label="Previous page">‹</button>
          {pageWindow[0] > 1 && <span className={styles.pageEllipsis}>…</span>}
          {pageWindow.map(n => (
            <button key={n}
              className={`${styles.pageBtn} ${n === safePage ? styles.pageBtnActive : ''}`}
              onClick={() => setPage(n)} disabled={loading}
              aria-label={`Page ${n}`} aria-current={n === safePage ? 'page' : undefined}
            >{n}</button>
          ))}
          {pageWindow[pageWindow.length - 1] < totalPages && <span className={styles.pageEllipsis}>…</span>}
          <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages || loading} aria-label="Next page">›</button>
          <button className={styles.pageBtn} onClick={() => setPage(totalPages)} disabled={safePage === totalPages || loading} aria-label="Last page">»</button>
        </div>
      </div>
    </div>
  )
}

export default PedometerRawData
