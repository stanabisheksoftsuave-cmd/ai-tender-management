import { useCallback, useEffect, useRef } from 'react'

/*
 * TenderContext.updateTender merges a plain object, so two writes built from
 * the same render's `tender` (an AI timer landing after a click, an export
 * landing after the debounced answers flush) would clobber each other's
 * nested fields. This keeps a ref of the latest tender, merged synchronously
 * on every write, so a patch may be computed from what was last written.
 *
 *   const { patch } = useTenderPatcher(tender, updateTender)
 *   patch(t => ({ prequalBidders: t.prequalBidders.map(...) }))
 */
export function useTenderPatcher(tender, updateTender) {
  const ref = useRef(tender)
  useEffect(() => { ref.current = tender }, [tender])

  const patch = useCallback((changes) => {
    const current = ref.current
    if (!current) return
    const delta = typeof changes === 'function' ? changes(current) : changes
    if (!delta) return
    ref.current = { ...current, ...delta }
    updateTender(current.id, delta)
  }, [updateTender])

  const getLatest = useCallback(() => ref.current, [])

  return { patch, getLatest }
}

// Patch one bidder row inside tender.prequalBidders.
export const patchBidderIn = (bidders, bidderId, fn) =>
  (bidders || []).map(b => (String(b.id) === String(bidderId) ? { ...b, ...(typeof fn === 'function' ? fn(b) : fn) } : b))
