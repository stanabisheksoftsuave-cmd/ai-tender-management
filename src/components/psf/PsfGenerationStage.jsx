/*
 * PSF Strategy — Stage 2 "AI Generation" (Next.js Stage2AiGeneration.tsx).
 *
 * Walks PSF_GENERATION_TASKS one tick at a time, then hands over. Holds the
 * app-wide AI lock for as long as it is mounted, so the sidebar goes inert
 * while the form is being drafted; leaving the stage releases it.
 */

import { useEffect, useRef, useState } from 'react'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { PSF_GENERATION_TASKS, PSF_GENERATION_TICK_MS } from '../../data/psfTemplate'

/** Pause on the fully-ticked list before handing over, so the last row is seen done. */
const SETTLE_MS = 400

export default function PsfGenerationStage({ onComplete }) {
  const [completed, setCompleted] = useState(0)
  const total = PSF_GENERATION_TASKS.length

  useAiLockWhile(true, 'Generating the Procurement Submission Form')

  // Latest callback without restarting the ticker when the parent re-renders.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    if (completed >= total) {
      const settle = setTimeout(() => onCompleteRef.current?.(), SETTLE_MS)
      return () => clearTimeout(settle)
    }
    const tick = setTimeout(() => setCompleted(c => c + 1), PSF_GENERATION_TICK_MS)
    return () => clearTimeout(tick)
  }, [completed, total])

  return (
    <div className="flex items-center justify-center py-10">
      <AiAnalysisLoader
        className="max-w-md"
        title="Generating the Procurement Submission Form"
        description="Building the PSF Strategy from your templates and contract details"
        progress={(completed / total) * 100}
        steps={PSF_GENERATION_TASKS.map((task, i) => ({
          id: task,
          label: task,
          status: i < completed ? 'complete' : i === completed ? 'active' : 'pending',
        }))}
      />
    </div>
  )
}
