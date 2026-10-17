const BULLET_PREFIX = /^(\s*[-•]\s+)/

/**
 * One line of `body` → one rendered line, offset-tracked so a DOM selection
 * inside it maps back to a `start`/`end` pair in the section text. Blank lines
 * render nothing but are counted so paragraph gaps survive.
 */
function splitSectionLines(body) {
  const lines = []
  let offset = 0
  let blankRun = 0
  for (const raw of String(body ?? '').split('\n')) {
    const start = offset
    offset = start + raw.length + 1
    if (raw.trim().length === 0) { blankRun += 1; continue }
    const bullet = BULLET_PREFIX.exec(raw)
    lines.push({
      displayText: bullet ? raw.slice(bullet[0].length) : raw,
      bodyOffset: bullet ? start + bullet[0].length : start,
      isBullet: bullet !== null,
      blankLinesBefore: blankRun,
    })
    blankRun = 0
  }
  return lines
}

function gapClass(blankLinesBefore) {
  if (blankLinesBefore <= 0) return ''
  if (blankLinesBefore === 1) return 'mt-4'
  if (blankLinesBefore === 2) return 'mt-8'
  return 'mt-12'
}

/** Select a whole rendered line as a real DOM selection (keyboard / double-click). */
function selectEntireLine(lineEl) {
  const domSelection = window.getSelection()
  if (!domSelection) return
  const range = document.createRange()
  range.selectNodeContents(lineEl)
  domSelection.removeAllRanges()
  domSelection.addRange(range)
}

const LINE_CLASS = 'rounded outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf] focus-visible:ring-offset-2 olng-sow-editable'

/**
 * Renders one SOW section's plain-text body as paragraphs + bullet lists
 * (MAIN SowSectionBody). Every line carries `data-section-id` and
 * `data-line-start` so the page's selection handler can locate it, and is
 * focusable: Enter/Space or double-click selects the whole line for AI edit.
 */
export default function SowSectionBody({ section, highlighted, onLineActivate }) {
  const lines = splitSectionLines(section.content)
  const groups = []
  let bulletBuffer = []
  let bulletGap = ''

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    selectEntireLine(event.currentTarget)
    onLineActivate?.()
  }
  const handleDoubleClick = (event) => {
    if (!onLineActivate) return
    selectEntireLine(event.currentTarget)
    onLineActivate()
  }
  const lineProps = line => ({
    'data-section-id': section.id,
    'data-line-start': line.bodyOffset,
    tabIndex: 0,
    role: 'button',
    'aria-label': `Select to edit with AI: ${line.displayText}`,
    onKeyDown: handleKeyDown,
    onDoubleClick: handleDoubleClick,
  })

  const flushBullets = (key) => {
    if (bulletBuffer.length === 0) return
    groups.push(
      <ul key={key} className={`list-disc pl-6 sm:pl-8 space-y-2 text-slate-600 marker:text-[#0089cf] ${bulletGap}`}>
        {bulletBuffer.map(line => (
          <li key={line.bodyOffset}>
            <span {...lineProps(line)} className={`inline-block ${LINE_CLASS}`}>{line.displayText}</span>
          </li>
        ))}
      </ul>,
    )
    bulletBuffer = []
    bulletGap = ''
  }

  lines.forEach((line, index) => {
    const gap = index === 0 ? '' : gapClass(line.blankLinesBefore)
    if (line.isBullet) {
      if (bulletBuffer.length === 0) bulletGap = gap
      else if (line.blankLinesBefore > 0) { flushBullets(`bullets-${index}`); bulletGap = gap }
      bulletBuffer.push(line)
      return
    }
    flushBullets(`bullets-${index}`)
    groups.push(
      <p key={line.bodyOffset} {...lineProps(line)} className={`text-slate-600 pl-3.5 leading-relaxed ${gap} ${LINE_CLASS}`}>
        {line.displayText}
      </p>,
    )
  })
  flushBullets('bullets-end')

  return (
    <section
      className="rounded-lg break-words transition-colors duration-700"
      style={highlighted ? { background: 'rgba(245,158,11,0.12)' } : undefined}
    >
      <h3 className="text-base font-bold flex items-center gap-2 mb-3" style={{ color: '#1e293b' }}>
        <span className="w-1.5 h-6 shrink-0 rounded-full" style={{ background: 'linear-gradient(180deg, #0089cf, #1b4c6f)' }} aria-hidden="true" />
        {section.heading}
      </h3>
      {groups}
    </section>
  )
}
