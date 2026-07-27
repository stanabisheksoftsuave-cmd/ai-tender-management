/*
 * Mock "AI" rewrite engine shared by every select-to-edit surface.
 *
 * It interprets a natural-language instruction and transforms the selected text
 * accordingly — replace/remove/shorten/expand/formalise/bullet/number/case, and
 * an "add …" fallback. Swap applyAiInstruction for a real LLM call when one is
 * available; the callers only depend on (selected, instruction) -> string.
 */

export const AI_QUICK_ACTIONS = [
  'Make it more formal',
  'Shorten this',
  'Expand with more detail',
  'Convert to bullet points',
]

const FORMAL_SWAPS = [
  [/\bget\b/gi, 'obtain'], [/\bfix\b/gi, 'rectify'], [/\bmake sure\b/gi, 'ensure'],
  [/\bhelp\b/gi, 'assist'], [/\bneed to\b/gi, 'shall'], [/\bmust\b/gi, 'shall'],
  [/\bwill\b/gi, 'shall'], [/\bstart\b/gi, 'commence'], [/\bend\b/gi, 'conclude'],
  [/\buse\b/gi, 'utilise'], [/\bshow\b/gi, 'demonstrate'], [/\babout\b/gi, 'regarding'],
]

const sentenceCase = s => s.charAt(0).toUpperCase() + s.slice(1)

export function applyAiInstruction(selected, instruction) {
  const ins = instruction.trim()
  const q = ins.toLowerCase()
  const lines = selected.split('\n')
  const bulletLines = lines.filter(l => /^\s*[•\-*]/.test(l))
  const isBulleted = bulletLines.length > 0

  // "replace X with Y" / "change X to Y"
  const swap = q.match(/(?:replace|change|swap)\s+["“']?(.+?)["”']?\s+(?:with|to|by)\s+["”']?(.+?)["”']?\s*$/i)
  if (swap) {
    const [, from, to] = ins.match(/(?:replace|change|swap)\s+["“']?(.+?)["”']?\s+(?:with|to|by)\s+["“']?(.+?)["”']?\s*$/i)
    const rx = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    return selected.replace(rx, to)
  }

  if (/\b(remove|delete|drop|strike)\b/.test(q)) {
    const target = q.match(/\b(?:remove|delete|drop)\b\s+(?:the\s+)?(.+)/)?.[1]
    if (isBulleted && target) {
      const kept = lines.filter(l => !(/^\s*[•\-*]/.test(l) && target.split(/\s+/).some(w => w.length > 3 && l.toLowerCase().includes(w))))
      if (kept.length !== lines.length) return kept.join('\n')
    }
    return ''
  }

  if (/\b(shorten|concise|brief|summari[sz]e|trim|tighten)\b/.test(q)) {
    if (isBulleted) {
      return lines.map(l => {
        if (!/^\s*[•\-*]/.test(l)) return l
        const [head, ...rest] = l.split(/[:—-]\s+/)
        return rest.length ? `${head.trim()}${rest[0] ? `: ${rest[0].split(/(?<=\.)\s/)[0].trim()}` : ''}` : l
      }).join('\n')
    }
    const sentences = selected.split(/(?<=\.)\s+/)
    return sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(' ').trim()
  }

  if (/\b(expand|elaborate|more detail|detailed|add detail)\b/.test(q)) {
    if (isBulleted) {
      return lines.map(l => /^\s*[•\-*]/.test(l) && !/\.$/.test(l.trim())
        ? `${l.trimEnd()}, subject to Contract Holder review and written acceptance.`
        : l).join('\n')
    }
    return `${selected.trimEnd()} All such activities shall be planned, documented and executed in accordance with Oman LNG procedures, and evidence of compliance shall be made available for audit on request.`
  }

  if (/\b(formal|professional|contractual|legal)\b/.test(q)) {
    return FORMAL_SWAPS.reduce((acc, [rx, to]) => acc.replace(rx, to), selected)
  }

  if (/\b(number|numbered|ordered)\b/.test(q) && isBulleted) {
    let n = 0
    return lines.map(l => /^\s*[•\-*]/.test(l) ? `${++n}. ${l.replace(/^\s*[•\-*]\s*/, '')}` : l).join('\n')
  }

  if (/\bbullet|list\b/.test(q) && !isBulleted) {
    return selected.split(/(?<=\.)\s+/).filter(Boolean).map(s => `• ${s.trim().replace(/\.$/, '')}`).join('\n')
  }

  if (/\b(upper ?case|capital)\b/.test(q)) return selected.toUpperCase()
  if (/\b(lower ?case)\b/.test(q)) return selected.toLowerCase()

  // "add …" / fallback: fold the instruction in as an additional clause
  const addition = ins.replace(/^\s*(please\s+)?(add|include|insert|append|mention|state)\s+(a\s+|an\s+|the\s+)?/i, '').replace(/\.$/, '')
  if (isBulleted) {
    const marker = lines.find(l => /^\s*[•\-*]/.test(l)).match(/^\s*([•\-*])/)[1]
    return `${selected.trimEnd()}\n${marker} ${sentenceCase(addition)}`
  }
  return `${selected.trimEnd()} ${sentenceCase(addition)}.`
}
