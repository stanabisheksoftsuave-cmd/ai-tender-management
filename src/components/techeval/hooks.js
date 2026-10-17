import { useEffect, useRef, useState } from 'react'

/**
 * Toast list for the evaluation screens — `showToast({ tone, message })`
 * auto-dismisses after a few seconds.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  const showToast = ({ tone = 'info', message }) => {
    nextId.current += 1
    const id = nextId.current
    setToasts(prev => [...prev.filter(t => t.message !== message), { id, tone, message }])
    timers.current.push(setTimeout(() => dismissToast(id), 4500))
    return id
  }
  return { toasts, showToast, dismissToast }
}

/**
 * A simulated AI run: steps tick on a timer, then `onDone` fires after a short
 * hold at 100%. Started from an event handler (or a deferred timeout), never
 * synchronously inside an effect. Timers are cleared on unmount.
 *
 *   const { run, start } = useStepRun()
 *   start({ total: 7, interval: 520, hold: 700, meta: {...}, onDone })
 *   run → null | { step, total, meta }
 */
export function useStepRun() {
  const [run, setRun] = useState(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const start = ({ total, interval, hold, meta, onDone }) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setRun({ step: 0, total, meta })
    for (let i = 1; i < total; i += 1) {
      timers.current.push(setTimeout(() => setRun(r => (r ? { ...r, step: i } : r)), i * interval))
    }
    timers.current.push(setTimeout(() => {
      setRun(null)
      onDone?.()
    }, (total - 1) * interval + hold))
  }
  return { run, start }
}
