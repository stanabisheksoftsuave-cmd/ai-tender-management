import { useCallback, useMemo, useState } from 'react'
import { AiLockContext } from './aiLockStore'

/*
 * App-wide "AI is running" lock. While a long AI generation runs (a strategy
 * template pre-fill, SOW generation, PSF generation…) the sidebar is covered by
 * an overlay and made inert, so the user can't navigate away mid-generation and
 * leave a half-written record behind. Mirrors the main app's
 * templateGenerationSlice + TemplateGenerationLock.
 *
 *   const { isGenerating, label, lock, unlock } = useAiLock()   // from ./aiLockStore
 *
 * Pages should prefer useAiLockWhile(isRunning, label) from hooks/useAiLockWhile,
 * which also releases the lock if the page unmounts mid-generation.
 */
export function AiLockProvider({ children }) {
  const [label, setLabel] = useState(null)

  const lock = useCallback((text = 'AI is running') => setLabel(text), [])
  const unlock = useCallback(() => setLabel(null), [])

  const value = useMemo(
    () => ({ isGenerating: label !== null, label: label || '', lock, unlock }),
    [label, lock, unlock],
  )

  return <AiLockContext.Provider value={value}>{children}</AiLockContext.Provider>
}
