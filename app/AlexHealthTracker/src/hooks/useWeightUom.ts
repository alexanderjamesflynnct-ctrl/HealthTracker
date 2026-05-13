import { useEffect, useState } from 'react'

export type WeightUom = 'kg' | 'lbs'

export const useWeightUom = (): WeightUom => {
  const [uom, setUom] = useState<WeightUom>('kg')

  useEffect(() => {
    fetch('http://localhost:5181/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.weightUom === 'lbs') setUom('lbs') })
      .catch(() => {})
  }, [])

  return uom
}
