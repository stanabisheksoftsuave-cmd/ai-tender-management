import { createContext, useContext } from 'react'

// Context object + hook for the app-wide AI lock. Kept apart from the provider
// component (AiLockContext.jsx) so React Fast Refresh keeps working.
export const AiLockContext = createContext({ isGenerating: false, label: '', lock: () => {}, unlock: () => {} })

export const useAiLock = () => useContext(AiLockContext)
