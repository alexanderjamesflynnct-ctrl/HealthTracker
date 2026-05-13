import { useEffect, useState, useCallback } from 'react'

export interface AppString {
  application: string
  page: string
  uniqueId: string
  language: string
  value: string
}

const API_URL = 'http://localhost:5181/api/strings'

let cachedStrings: Map<string, string> | null = null
let version = 0
const listeners = new Set<() => void>()

const notifyListeners = () => {
  version++
  listeners.forEach(fn => fn())
}

const loadStrings = async () => {
  const res = await fetch(API_URL)
  if (!res.ok) return
  const data = await res.json() as AppString[]
  cachedStrings = new Map(data.map(s => [`${s.page}.${s.uniqueId}`, s.value]))
  notifyListeners()
}

// Get a string by page.uniqueId, with a fallback
export const getString = (page: string, uniqueId: string, fallback: string = ''): string => {
  if (!cachedStrings) return fallback
  return cachedStrings.get(`${page}.${uniqueId}`) ?? fallback
}

// Hook that subscribes to string cache updates and re-renders on change
export const useAppStrings = () => {
  const [, setVer] = useState(version)

  useEffect(() => {
    // Load on first use
    if (!cachedStrings) { loadStrings() }

    const listener = () => setVer(v => v + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const s = useCallback(
    (page: string, uniqueId: string, fallback?: string) => getString(page, uniqueId, fallback ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  )

  return { ready: cachedStrings !== null, s }
}

// Force reload — call after editing strings. All subscribed components will re-render.
export const reloadStrings = async () => {
  cachedStrings = null
  await loadStrings()
}
