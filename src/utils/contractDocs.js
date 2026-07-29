// Award outcome + issued-document helpers shared by the two pages that deal
// with the contract after SCM gate 2: Contract Drafting (ContractTemplate) and
// Contract Management (the post-issue record). Both have to agree on who won and
// who gets a regret letter, so the derivation lives here rather than in each page.

import { bidders as seedBidders } from '../data/mockData'
import { openHtmlDoc, rejectionLetterDoc } from './docGen'

// Simple average of the technical and commercial results, out of 100. Only used
// to break a tie when no award decision was recorded (legacy seed tenders).
export const combinedScore = b => Math.round(((b.techScore ?? 75) + (b.commScore ?? 70)) / 2)

export const tenderBiddersOf = (tender) =>
  Array.isArray(tender?.bidderList) ? tender.bidderList : seedBidders.slice(0, tender?.bidders || 4)

/*
 * Who the contract was issued to, and who has to be regretted. The SCM award
 * gate stamps mgmtWinnerId; a tender that never went through it falls back to
 * the strongest combined score so the page still has something to show.
 */
export function awardOutcome(tender) {
  const bidders = tenderBiddersOf(tender)
  const ranked = [...bidders].sort((a, b) => combinedScore(b) - combinedScore(a))
  const awarded = tender?.mgmtWinnerId
    ? bidders.find(b => b.id === tender.mgmtWinnerId) ?? ranked[0]
    : ranked[0]
  const unsuccessful = awarded ? ranked.filter(b => b.id !== awarded.id) : []
  return { bidders, ranked, awarded, unsuccessful }
}

export const letterDateStr = (iso) =>
  new Date(iso || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

// Opens one bidder's regret letter in a new tab. `issuedAt` dates the letter to
// the day the SCM released it, so a re-export is not stamped with today.
export function openRegretLetter(tender, bidder, awardedName, issuedAt) {
  const d = rejectionLetterDoc({
    tenderId: tender?.id,
    tenderTitle: tender?.title,
    bidderName: bidder?.name,
    department: tender?.department,
    awardedTo: awardedName,
    dateStr: letterDateStr(issuedAt),
  })
  return openHtmlDoc(d.title, d.content)
}
