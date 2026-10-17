import { useEffect } from 'react'
import { useAiLock } from '../context/aiLockStore'

// Holds the app-wide AI lock for as long as `active` is true, and always
// releases it on unmount so a page left mid-generation never leaves the
// sidebar stuck behind the overlay.
export function useAiLockWhile(active, label) {
  const { lock, unlock } = useAiLock()
  useEffect(() => {
    if (!active) return undefined
    lock(label)
    return () => unlock()
  }, [active, label, lock, unlock])
}
