import { B1_CATEGORY_MAP } from './b1Categories'

/*
 * The ITT's section templates, in the order the fill-in wizard walks them:
 * 1 → A → D → B1 → B2 → C → E → F → H → J → K → L → G.
 *
 * This is the one list of what an ITT is made of. ITT creation walks it to fill
 * the templates in; contract drafting reads the same list so its template review
 * opens the very same document the section was authored against.
 */
export const SECTION_FLOW = [
  { id: 'section1', title: 'Section 1 — Instructions to Tenderers', docxUrl: '/itt-templates/section-1-instructions.docx', exportFilename: 'Section 1 - Instructions.docx' },
  { id: 'sectionA', title: 'Section A — Form of Agreement', docxUrl: '/itt-templates/section-a-form-of-agreement.docx', exportFilename: 'Section A - Form of Agreement.docx' },
  { id: 'sectionD', title: 'Section D — Statement of Work', docxUrl: '/itt-templates/section-d-scope-of-work.docx', exportFilename: 'Section D - Statement of Work.docx' },
  { id: 'sectionB1', title: 'Section B1 — General Conditions of Contract', kind: 'b1-chooser' },
  { id: 'sectionB2', title: 'Section B2 — Special Conditions of Contract', docxUrl: '/itt-templates/section-b2-special-conditions.docx', exportFilename: 'Section B2 - Special Conditions.docx', optional: true },
  { id: 'sectionC', title: 'Section C — QHSSE Requirements', docxUrl: '/itt-templates/section-c-qhsse.docx', exportFilename: 'Section C - QHSSE Requirements.docx' },
  { id: 'sectionE', title: 'Section E — Schedule of Prices', docxUrl: '/itt-templates/section-e-schedule-of-prices.docx', exportFilename: 'Section E - Schedule of Prices.docx' },
  { id: 'sectionF', title: 'Section F — Execution Methodology', docxUrl: '/itt-templates/section-f-execution-methodology.docx', exportFilename: 'Section F - Execution Methodology.docx' },
  { id: 'sectionH', title: 'Section H — ICV Requirements', docxUrl: '/itt-templates/section-h-icv-requirements.docx', exportFilename: 'Section H - ICV Requirements.docx', attachmentUrl: '/itt-templates/section-h-appendix-tenderplan.xlsx', attachmentLabel: 'Appendix A — Tender Plan (reference)' },
  { id: 'sectionJ', title: 'Section J — JSRS Requirements', docxUrl: '/itt-templates/section-j-jsrs-requirements.docx', exportFilename: 'Section J - JSRS Requirements.docx' },
  { id: 'sectionK', title: 'Section K — OPAL Requirements', docxUrl: '/itt-templates/section-k-opal-requirements.docx', exportFilename: 'Section K - OPAL Requirements.docx' },
  { id: 'sectionL', title: 'Section L — Minimum Salaries', docxUrl: '/itt-templates/section-l-minimum-salaries.docx', exportFilename: 'Section L - Minimum Salaries.docx' },
  { id: 'sectionG', title: 'Section G — Administration Instructions', docxUrl: '/itt-templates/section-g-admin-instructions.docx', exportFilename: 'Section G - Administration Instructions.docx' },
]

/*
 * Section B1 has no template of its own until a General Conditions tier is
 * chosen — the choice resolves to one of the B1 category templates. Until then
 * the entry keeps kind: 'b1-chooser' and no docxUrl, which is how callers tell
 * "not chosen yet" from "chosen".
 */
export function resolveFlow(b1Category) {
  return SECTION_FLOW.map(s => {
    if (s.kind !== 'b1-chooser') return s
    if (!b1Category) return s
    const cat = B1_CATEGORY_MAP[b1Category]
    return { id: s.id, title: s.title, docxUrl: cat.docxUrl, exportFilename: cat.exportFilename, isStandIn: cat.isStandIn, nearestTier: cat.nearestTier }
  })
}

/*
 * The sections a contract is made of — the very same section templates the ITT
 * was filled in against, resolved with this tender's B1 tier. Section 1
 * (Instructions to Tenderers) is left out: it governs how tenderers submit their
 * bids, not the contract that follows. Contract drafting and the post-award
 * issued-document record both read this, so they cannot show different papers.
 */
export const contractSections = (b1Category) =>
  resolveFlow(b1Category).filter(s => s.id !== 'section1')
