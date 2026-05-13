import { useEffect, useState } from 'react'

export interface AppString {
  application: string
  page: string
  uniqueId: string
  language: string
  value: string
}

const API_URL = 'http://localhost:5181/api/strings'

let cachedStrings: Map<string, string> | null = null
let loadPromise: Promise<void> | null = null

const loadStrings = async () => {
  if (cachedStrings) return
  const res = await fetch(API_URL)
  if (!res.ok) return
  const data = await res.json() as AppString[]
  cachedStrings = new Map(data.map(s => [`${s.page}.${s.uniqueId}`, s.value]))
}

// Get a string by page.uniqueId, with a fallback
export const getString = (page: string, uniqueId: string, fallback: string = ''): string => {
  if (!cachedStrings) return fallback
  return cachedStrings.get(`${page}.${uniqueId}`) ?? fallback
}

// Hook that triggers a load and re-renders when strings are ready
export const useAppStrings = () => {
  const [ready, setReady] = useState(cachedStrings !== null)

  useEffect(() => {
    if (cachedStrings) { setReady(true); return }
    if (!loadPromise) {
      loadPromise = loadStrings().then(() => { loadPromise = null })
    }
    loadPromise.then(() => setReady(true))
  }, [])

  return { ready, s: (page: string, uniqueId: string, fallback?: string) => getString(page, uniqueId, fallback ?? '') }
}

// Force reload (after editing strings)
export const reloadStrings = async () => {
  cachedStrings = null
  await loadStrings()
}
