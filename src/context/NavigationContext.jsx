import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAccess } from '../utils/permissions'

/*
 * Back navigation.
 *
 * Two things have to be true for "Back" to feel right:
 *   1. If the user actually walked here from another page in the app, back should
 *      return to that page — plain browser-history back.
 *   2. If they landed here directly (deep link, refresh, redirect after login),
 *      there is nothing to pop, so back has to fall through to the route's
 *      logical parent instead of leaving the app.
 *
 * Pages with internal steps (wizards, list -> detail kept in local state) can
 * register their own handler with useBackHandler so the shared button unwinds
 * the step rather than the route.
 */

// Parent for routes that are not the dashboard. ':id' matches the tenderId segment.
const PARENT_ROUTES = {
  '/tenders':                     '/dashboard',
  '/audit-log':                   '/dashboard',
  '/users':                       '/dashboard',
  '/contract-strategy':           '/dashboard',
  '/contract-strategy/:id':       '/tenders',
  '/strategy-templates/:id':      '/contract-strategy/:id',
  '/psf-strategy/:id':            '/strategy-templates/:id',
  '/pre-qualification':           '/dashboard',
  '/pre-qualification/:id':       '/strategy-templates/:id',
  '/create-itt':                  '/dashboard',
  '/create-itt/:id':              '/create-itt',
  '/upload':                      '/dashboard',
  '/upload/:id':                  '/upload',
  '/technical-eval':              '/dashboard',
  '/technical-eval/:id':          '/technical-eval',
  '/commercial-eval':             '/dashboard',
  '/commercial-eval/:id':         '/commercial-eval',
  '/scm-tech-review':             '/dashboard',
  '/scm-tech-review/:id':         '/scm-tech-review',
  '/scm-review':                  '/dashboard',
  '/scm-review/:id':              '/scm-review',
  '/scm-contract-review':         '/dashboard',
  '/scm-contract-review/:id':     '/scm-contract-review',
  '/contract':                    '/dashboard',
  '/contract/:id':                '/contract',
  '/legal-review':                '/dashboard',
  '/legal-review/:id':            '/legal-review',
  '/contract-execution':          '/dashboard',
  '/contract-execution/:id':      '/contract-execution',
  '/contract-management':         '/dashboard',
  '/contract-management/:id':     '/contract-management',
  '/contract-closure':            '/dashboard',
  '/contract-closure/:id':        '/contract-closure',
}

// '/upload/T-1042' -> pattern '/upload/:id' + id 'T-1042'
function toPattern(pathname) {
  const [, base, id] = pathname.split('/')
  return { pattern: id ? `/${base}/:id` : `/${base}`, id }
}

export function parentPathOf(pathname) {
  const { pattern, id } = toPattern(pathname)
  const parent = PARENT_ROUTES[pattern]
  if (!parent) return null
  return id ? parent.replace(':id', id) : parent
}

const NavigationContext = createContext({
  goBack: () => {},
  canGoBack: false,
  registerBackHandler: () => () => {},
  registerDismissable: () => () => {},
})

// Our position in the session history. React Router stamps this index onto every
// entry it creates, so unlike a hand-rolled counter it survives a refresh and
// stays right through browser Back *and* Forward — useNavigationType() reports
// both as POP, so counting pops would drift.
function historyIndex() {
  return window.history.state?.idx ?? 0
}

export function NavigationProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { can, home } = useAccess()

  // 0 means this is the first entry we own, so navigate(-1) would leave the app.
  const [depth, setDepth] = useState(historyIndex)
  const handlerRef = useRef(null)
  // Open overlays, in the order they opened. Back closes the last one first.
  const dismissRef = useRef([])
  const [openCount, setOpenCount] = useState(0)

  useEffect(() => { setDepth(historyIndex()) }, [location.key])

  const registerBackHandler = useCallback(fn => {
    handlerRef.current = fn
    return () => { if (handlerRef.current === fn) handlerRef.current = null }
  }, [])

  const registerDismissable = useCallback(fn => {
    const entry = { fn }
    dismissRef.current.push(entry)
    setOpenCount(dismissRef.current.length)
    return () => {
      dismissRef.current = dismissRef.current.filter(e => e !== entry)
      setOpenCount(dismissRef.current.length)
    }
  }, [])

  // Top-level pages hang off the Dashboard, which not every role may open. When
  // the logical parent is closed to this role — statically, or because an admin
  // just revoked the module — fall back to its own landing page rather than a
  // route the router would only bounce them out of.
  const rawParent = parentPathOf(location.pathname)
  const parent = rawParent && !can(rawParent) ? home : rawParent

  const goBack = useCallback(() => {
    // Topmost overlay first — a modal must never let Back tear down the page
    // underneath it.
    const open = dismissRef.current
    if (open.length) { open[open.length - 1].fn(); return }
    // Then the page's own step unwinding, but only if it consumed the press.
    if (handlerRef.current && handlerRef.current() === true) return
    if (depth > 0) { navigate(-1); return }
    if (parent) navigate(parent, { replace: true })
  }, [depth, navigate, parent])

  const canGoBack = depth > 0 || !!parent || openCount > 0

  return (
    <NavigationContext.Provider value={{ goBack, canGoBack, registerBackHandler, registerDismissable }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  return useContext(NavigationContext)
}

/*
 * Register an overlay (modal, drawer, full-screen preview) so Back closes it
 * instead of leaving the page. Pass whether it is currently open and how to
 * close it; nested overlays close newest-first.
 *
 *   useDismissable(showEditor, () => setShowEditor(false))
 */
export function useDismissable(isOpen, onDismiss) {
  const { registerDismissable } = useNavigation()
  const latest = useRef(onDismiss)
  useEffect(() => { latest.current = onDismiss })

  useEffect(() => {
    if (!isOpen) return
    return registerDismissable(() => latest.current())
  }, [isOpen, registerDismissable])
}

/*
 * Let a page intercept the shared Back button — return true from `handler` when
 * you consumed the press (e.g. you stepped a wizard back), false/undefined to
 * let normal route back happen. Runs after any open overlay is dismissed.
 */
export function useBackHandler(handler, deps = []) {
  const { registerBackHandler } = useNavigation()
  const latest = useRef(handler)
  useEffect(() => { latest.current = handler })

  // Registered once; the ref keeps it reading fresh state, so deps are optional.
  useEffect(() => registerBackHandler(() => latest.current()), deps) // eslint-disable-line react-hooks/exhaustive-deps
}
