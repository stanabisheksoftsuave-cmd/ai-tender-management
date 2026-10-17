import { useId, useState } from 'react'
import { TITLE_SUGGESTION_MIN_QUERY_LENGTH } from './cifConstants'

/**
 * Combobox listbox under the Project Title input listing existing tenders
 * whose title matches (MAIN shared/TitleSuggestions). `children` is a render
 * prop receiving the ARIA + event props for the input.
 */
export default function TitleSuggestions({ query, suggestions, onSelect, children }) {
  const listId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const isVisible = isOpen
    && query.trim().length >= TITLE_SUGGESTION_MIN_QUERY_LENGTH
    && suggestions.length > 0
  const activeSuggestion = isVisible ? suggestions[activeIndex] : undefined
  const optionId = id => `${listId}-${id}`

  const select = (id) => {
    setIsOpen(false)
    setActiveIndex(-1)
    onSelect(id)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'Tab') return
    if (event.key === 'Enter') {
      if (event.nativeEvent.isComposing || !activeSuggestion) return
      event.preventDefault()
      select(activeSuggestion.id)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!isVisible) { setIsOpen(true); return }
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(current => {
        const next = current + step
        if (next < 0) return suggestions.length - 1
        return next >= suggestions.length ? 0 : next
      })
      return
    }
    setIsOpen(true)
    setActiveIndex(-1)
  }

  return (
    <div className="relative">
      {children({
        role: 'combobox',
        'aria-autocomplete': 'list',
        'aria-expanded': isVisible,
        'aria-controls': listId,
        'aria-activedescendant': activeSuggestion ? optionId(activeSuggestion.id) : undefined,
        autoComplete: 'off',
        onFocus: () => setIsOpen(true),
        onBlur: () => { setIsOpen(false); setActiveIndex(-1) },
        onKeyDown: handleKeyDown,
      })}

      {isVisible && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Existing tenders with a matching title"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg py-1 shadow-lg"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={optionId(suggestion.id)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={event => event.preventDefault()}
              onClick={() => select(suggestion.id)}
              className={`flex cursor-pointer flex-col gap-0.5 px-3.5 py-2 text-sm ${index === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium" style={{ color: '#1e293b' }}>{suggestion.title}</span>
                {suggestion.status && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}
                  >
                    {suggestion.status}
                  </span>
                )}
              </span>
              {suggestion.detail && <span className="truncate text-xs text-slate-400">{suggestion.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
