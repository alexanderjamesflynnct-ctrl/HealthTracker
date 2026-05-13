import { useEffect, useState, useMemo, useCallback } from 'react'
import styles from './WeightRawData.module.css'
import { useWeightUom } from '../hooks/useWeightUom'

interface WeightRow {
  dataUuid: string
  weightValue: number
  createTime: string | null
}

interface PagedResult {
  items: WeightRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

type SortKey = 'createTime' | 'weightValue'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const API_BASE = 'http://localhost:5181/api/weight'

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <span className={styles.sortIcon} aria-hidden="true">⇅</span>
  return <span className={styles.sortIcon} aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

const WeightRawData = () => {
  const [result, setResult] = useState<PagedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState({ createTime: '', weightValue: '' })
  const [search, setSearch] = useState({ createTime: '', weightValue: '' })

  const [sortKey, setSortKey] = useState<SortKey>('createTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Debounce search inputs 400ms
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset to page 1 on filter/sort/pageSize change
  useEffect(() => { setPage(1) }, [search, sortKey, sortDir, pageSize])

  // Fetch from API
  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      sortBy:   sortKey,
      sortDir:  sortDir,
    })
    if (search.createTime)  params.set('search_createTime', search.createTime)
    if (search.weightValue) params.set('search_weight',     search.weightValue)

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
    setSearchInput({ createTime: '', weightValue: '' })
    setSearch({ createTime: '', weightValue: '' })
  }

  const hasActiveSearch = Object.values(searchInput).some(v => v !== '')

  const weightUom = useWeightUom()
  const isPrimLbs = weightUom === 'lbs'
  const totalPages = result?.totalPages ?? 1
  const safePage   = result?.page ?? 1

  const pageWindow = useMemo(() => {
    const delta = 3
    const start = Math.max(1, safePage - delta)
    const end   = Math.min(totalPages, safePage + delta)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  const thClass = (col: SortKey) =>
    [styles.th, col === 'weightValue' ? styles.thNum : '', styles.thSortable, col === sortKey ? styles.thActive : '']
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
          <h2 className={styles.title}>⚖️ Weight & Body — Raw Data</h2>
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
        <table className={styles.table} aria-label="Weight records">
          <thead>
            <tr>
              <th scope="col" className={thClass('createTime')} onClick={() => handleSort('createTime')}
                aria-sort={sortKey === 'createTime' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <span className={styles.thContent}>
                  Date / Time <SortIcon col="createTime" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
              <th scope="col" className={thClass('weightValue')} onClick={() => handleSort('weightValue')}
                aria-sort={sortKey === 'weightValue' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <span className={styles.thContent}>
                  {isPrimLbs ? 'Weight (lbs)' : 'Weight (kg)'} <SortIcon col="weightValue" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
              <th scope="col" className={`${styles.th} ${styles.thNum}`}>
                <span className={styles.thContent}>{isPrimLbs ? 'Weight (kg)' : 'Weight (lbs)'}</span>
              </th>
            </tr>
            {/* Search row */}
            <tr className={styles.searchRow}>
              <th scope="col" className={styles.searchCell}>
                <input className={styles.searchInput} type="text" placeholder="Search date…"
                  value={searchInput.createTime}
                  onChange={e => handleSearchChange('createTime', e.target.value)}
                  aria-label="Filter by date/time" />
              </th>
              <th scope="col" className={styles.searchCell}>
                <input className={`${styles.searchInput} ${styles.searchInputNum}`} type="text" placeholder="Search…"
                  value={searchInput.weightValue}
                  onChange={e => handleSearchChange('weightValue', e.target.value)}
                  aria-label="Filter by weight" />
              </th>
              <th scope="col" className={styles.searchCell} aria-label="Weight in pounds (calculated)" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><span className={styles.skeletonCell} /></td>
                  <td className={`${styles.td} ${styles.tdNum}`}><span className={styles.skeletonCell} /></td>
                  <td className={`${styles.td} ${styles.tdNum}`}><span className={styles.skeletonCell} /></td>
                </tr>
              ))
            ) : result?.items.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.emptyCell}>No records match your filters.</td>
              </tr>
            ) : (
              result?.items.map(row => (
                <tr key={row.dataUuid} className={styles.tr}>
                  <td className={styles.td}>{row.createTime ?? '—'}</td>
                  <td className={`${styles.td} ${styles.tdNum}`}>
                    {isPrimLbs ? (row.weightValue * 2.20462).toFixed(1) : row.weightValue.toFixed(1)}
                  </td>
                  <td className={`${styles.td} ${styles.tdNum}`}>
                    {isPrimLbs ? row.weightValue.toFixed(1) : (row.weightValue * 2.20462).toFixed(1)}
                  </td>
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

export default WeightRawData
