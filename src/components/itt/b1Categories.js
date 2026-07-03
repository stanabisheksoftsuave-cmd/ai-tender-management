export const B1_CATEGORY_MAP = {
  'high-high': {
    label: 'High Value / High Risk', sub: '≥ USD 500,000 · High Risk',
    docxUrl: '/itt-templates/section-b1-high-value-high-risk.docx',
    exportFilename: 'Section B1 - High Value High Risk.docx',
    isStandIn: false, nearestTier: 'High Value',
  },
  'high-low': {
    label: 'High Value / Low Risk', sub: '≥ USD 500,000 · Low Risk',
    docxUrl: '/itt-templates/section-b1-high-value-high-risk.docx',
    exportFilename: 'Section B1 - High Value Low Risk.docx',
    isStandIn: true, nearestTier: 'High Value',
  },
  'medium-high': {
    label: 'Medium Value / High Risk', sub: 'USD 50k–500k · High Risk',
    docxUrl: '/itt-templates/section-b1-medium-value-low-risk.docx',
    exportFilename: 'Section B1 - Medium Value High Risk.docx',
    isStandIn: true, nearestTier: 'Medium Value',
  },
  'medium-low': {
    label: 'Medium Value / Low Risk', sub: 'USD 50k–500k · Low Risk',
    docxUrl: '/itt-templates/section-b1-medium-value-low-risk.docx',
    exportFilename: 'Section B1 - Medium Value Low Risk.docx',
    isStandIn: false, nearestTier: 'Medium Value',
  },
}
