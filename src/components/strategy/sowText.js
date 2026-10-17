/*
 * Plain-text round-trip for a SOW section — the same shapes the Contract
 * Initiating Form's SOW editor uses: free-text `content`, a "Label: value"
 * `items` grid, or titled bullet `subsections`.
 */

export const sectionHeading = section => section?.heading || section?.title || ''

export function sectionToEditText(section) {
  if (typeof section.content === 'string') return section.content
  if (typeof section.body === 'string') return section.body
  if (section.items) return section.items.map(item => `${item.label}: ${item.value ?? ''}`).join('\n')
  if (section.subsections) {
    return section.subsections
      .map(sub => `${sub.title}:\n${(sub.items || []).map(item => `• ${item}`).join('\n')}`)
      .join('\n\n')
  }
  return ''
}

export function editTextToSection(section, text) {
  if (typeof section.content === 'string') return { ...section, content: text }
  if (typeof section.body === 'string') return { ...section, body: text }
  if (section.items) {
    const items = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const sep = line.indexOf(':')
        return sep === -1
          ? { label: line, value: '' }
          : { label: line.slice(0, sep).trim(), value: line.slice(sep + 1).trim() }
      })
    return { ...section, items: items.length ? items : section.items }
  }
  if (section.subsections) {
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const subsections = blocks.map(block => {
      const [first, ...rest] = block.split('\n').map(l => l.trim()).filter(Boolean)
      return { title: (first || '').replace(/:\s*$/, ''), items: rest.map(l => l.replace(/^[•-]\s*/, '')) }
    })
    return { ...section, subsections: subsections.length ? subsections : section.subsections }
  }
  return section
}

/** The section's free text, when it has one (the only kind AI-edited in place). */
export const sectionContent = section =>
  typeof section.content === 'string' ? section.content : typeof section.body === 'string' ? section.body : null

export const withSectionContent = (section, text) =>
  typeof section.content === 'string' ? { ...section, content: text } : { ...section, body: text }

const EDITOR_MIN_ROWS = 4
const EDITOR_MAX_ROWS = 40
const EDITOR_CHARS_PER_ROW = 110

export function editorRows(text) {
  const rows = String(text || '')
    .split('\n')
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / EDITOR_CHARS_PER_ROW)), 0)
  return Math.min(EDITOR_MAX_ROWS, Math.max(EDITOR_MIN_ROWS, rows + 1))
}
