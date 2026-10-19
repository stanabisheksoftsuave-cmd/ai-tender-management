import { formatDate } from '../../shell/chFlow'

/**
 * Caption facts for the ITT wizard's tender header band, in the order the
 * other tender headers use: department, bidder count, closing date. Missing
 * facts are skipped; a tender-less (brand-new) draft has none.
 */
export function tenderHeaderDetails(tender) {
  if (!tender) return []
  const bidders = Array.isArray(tender.bidderList) ? tender.bidderList.length : (tender.bidders ?? null)
  return [
    tender.department || null,
    bidders == null ? null : `${bidders} ${bidders === 1 ? 'bidder' : 'bidders'}`,
    tender.deadline ? `Closes ${formatDate(tender.deadline)}` : null,
  ].filter(Boolean)
}
