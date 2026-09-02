/**
 * The user-facing reference for a tender.
 *
 * Tenders carry two identifiers: the internal `id` (ITT-2025-0xx) used for
 * routing, React keys and persistence, and the Cost Code the Contract Holder
 * types on the Contract Initiating Form. Screens show the Cost Code; the id is
 * only a fallback for tenders created before the field existed.
 *
 * Never use this for routes, keys or updateTender() — those stay on `id`.
 */
export const tenderRef = (tender) => tender?.costCode || tender?.id || ''
