/*
 * Section B2 — Special Conditions of Contract.
 *
 * B2 exists to amend, add to or disapply clauses of the B1 General Conditions.
 * It is organised as CLASSES (the clause families of the General Conditions)
 * containing SUB-CLASSES (the individual special conditions). Each sub-class
 * records which B1 clause it acts on, how it deviates, and the drafted text.
 *
 * This is the seed set the AI produces on first open; the Contract Engineer can
 * add, edit and delete classes and sub-classes, and rewrite any clause text.
 */

export const B2_DEVIATIONS = {
  as_b1:   { label: 'As B1 — no change', badge: 'closed',            hint: 'The General Conditions clause applies unamended.' },
  amended: { label: 'Amended',           badge: 'warning',           hint: 'The General Conditions clause applies as modified by this special condition.' },
  added:   { label: 'Additional',        badge: 'info',              hint: 'A new obligation with no equivalent in the General Conditions.' },
  deleted: { label: 'Disapplied',        badge: 'error',             hint: 'The General Conditions clause is deleted and does not apply to this contract.' },
}

export const B2_DEVIATION_ORDER = ['as_b1', 'amended', 'added', 'deleted']

let uid = 0
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`

const sc = (code, title, b1Ref, deviation, content) => ({
  id: `b2-${code.replace(/\./g, '-')}`, code, title, b1Ref, deviation, content,
})

export const B2_DEFAULT_CLASSES = [
  {
    id: 'b2c-1', code: '1', title: 'Definitions & Interpretation',
    description: 'Contract-specific definitions and the order of precedence between the tender documents.',
    subclasses: [
      sc('1.1', 'Contract-Specific Definitions', 'GCC 1.1', 'amended',
        'The definitions in Clause 1.1 of the General Conditions shall apply, save that:\n\n• "SITE" means the locations identified in Section D — Statement of Work, together with any laydown, fabrication or storage area made available by the COMPANY in writing.\n• "WORKING DAY" means Sunday to Thursday inclusive, excluding public holidays declared in the Sultanate of Oman.\n• "COMPANY REPRESENTATIVE" means the person notified to the CONTRACTOR in writing under Clause 3.2, and any authorised delegate of that person.'),
      sc('1.2', 'Order of Precedence', 'GCC 1.4', 'amended',
        'Clause 1.4 of the General Conditions is deleted and replaced with the following order of precedence, highest first:\n\n1. The Form of Agreement (Section A)\n2. These Special Conditions of Contract (Section B2)\n3. The General Conditions of Contract (Section B1)\n4. The Statement of Work (Section D)\n5. The QHSSE Requirements (Section C)\n6. The Schedule of Prices (Section E)\n7. All other tender documents\n\nWhere a conflict remains after applying this order, the CONTRACTOR shall seek the COMPANY\'s written direction before proceeding.'),
    ],
  },
  {
    id: 'b2c-2', code: '2', title: 'Scope & Performance of the Work',
    description: 'Contract-specific obligations on how the work is planned, executed and reported.',
    subclasses: [
      sc('2.1', "Contractor's General Obligations", 'GCC 4.1', 'amended',
        'In addition to Clause 4.1 of the General Conditions, the CONTRACTOR shall:\n\n• Provide a dedicated Contract Manager based in the Sultanate of Oman for the full duration of the CONTRACT.\n• Submit a monthly progress report by the fifth WORKING DAY of each month, covering progress against the programme, HSSE performance, ICV performance and any anticipated deviation.\n• Attend a monthly contract review meeting with the COMPANY REPRESENTATIVE at a location nominated by the COMPANY.'),
      sc('2.2', "Company's Obligations", 'GCC 5.1', 'as_b1',
        'Clause 5.1 of the General Conditions applies without amendment.'),
      sc('2.3', 'Programme & Milestones', 'GCC 6.2', 'amended',
        'The CONTRACTOR shall submit a detailed baseline programme within fourteen (14) days of the Notice to Proceed, showing all milestones identified in Section D. The programme shall not be revised without the COMPANY\'s prior written acceptance, and progress shall be measured against the accepted baseline throughout.'),
      sc('2.4', 'Subcontracting', 'GCC 7.3', 'amended',
        'No part of the WORK shall be subcontracted without the COMPANY\'s prior written consent. The CONTRACTOR remains fully responsible for the acts and omissions of every subcontractor, and shall flow down these Special Conditions in full.'),
    ],
  },
  {
    id: 'b2c-3', code: '3', title: 'Contract Price & Payment',
    description: 'Pricing basis, invoicing, payment terms and price adjustment for this contract.',
    subclasses: [
      sc('3.1', 'Contract Price Basis', 'GCC 12.1', 'amended',
        'The CONTRACT PRICE is a firm, fixed lump sum as set out in Section E — Schedule of Prices, and is not subject to adjustment except as expressly provided in these Special Conditions.'),
      sc('3.2', 'Invoicing Procedure', 'GCC 12.4', 'amended',
        'Invoices shall be submitted monthly in arrears, quoting the CONTRACT number and the relevant purchase order line, and supported by:\n\n• A progress statement certified by the COMPANY REPRESENTATIVE\n• Timesheets or delivery notes for all reimbursable elements\n• A current ICV certificate\n\nInvoices not meeting these requirements will be returned and will not start the payment period.'),
      sc('3.3', 'Payment Terms', 'GCC 12.5', 'amended',
        'Payment shall be made within sixty (60) days of receipt of a correctly submitted and certified invoice. No advance payment shall be made under this CONTRACT.'),
      sc('3.4', 'Currency & Exchange Rate', 'GCC 12.7', 'added',
        'All payments shall be made in Omani Rial (OMR). Where any element of the CONTRACT PRICE is quoted in another currency, it shall be converted at the Central Bank of Oman reference rate prevailing on the tender closing date, and that rate shall be fixed for the duration of the CONTRACT.'),
      sc('3.5', 'Price Escalation', 'GCC 12.9', 'amended',
        'Escalation shall be applied annually on the anniversary of the Notice to Proceed, linked to the published Oman Consumer Price Index and capped at three percent (3%) per annum. Escalation shall apply only to the labour element of the CONTRACT PRICE.'),
      sc('3.6', 'Retention', 'GCC 12.11', 'amended',
        'The COMPANY shall retain five percent (5%) of each certified invoice, up to a ceiling of five percent (5%) of the CONTRACT PRICE. Half of the retention shall be released on issue of the Completion Certificate and the balance on expiry of the Defects Liability Period.'),
    ],
  },
  {
    id: 'b2c-4', code: '4', title: 'Duration, Delay & Liquidated Damages',
    description: 'Commencement, completion, extensions of time and the consequences of delay.',
    subclasses: [
      sc('4.1', 'Commencement & Completion', 'GCC 9.1', 'amended',
        'The CONTRACTOR shall commence the WORK on the date stated in the Notice to Proceed and shall achieve completion within twenty-four (24) weeks of that date.'),
      sc('4.2', 'Extension of Time', 'GCC 9.4', 'as_b1',
        'Clause 9.4 of the General Conditions applies without amendment.'),
      sc('4.3', 'Liquidated Damages for Delay', 'GCC 10.1', 'amended',
        'Liquidated damages shall accrue at zero point five percent (0.5%) of the CONTRACT PRICE for each completed week of delay, up to an aggregate ceiling of ten percent (10%) of the CONTRACT PRICE. The parties agree this is a genuine pre-estimate of the COMPANY\'s loss and not a penalty.'),
      sc('4.4', 'Force Majeure', 'GCC 11.1', 'as_b1',
        'Clause 11.1 of the General Conditions applies without amendment.'),
    ],
  },
  {
    id: 'b2c-5', code: '5', title: 'Security, Guarantees & Warranty',
    description: 'Performance security and the defects liability regime for this contract.',
    subclasses: [
      sc('5.1', 'Performance Bond', 'GCC 14.1', 'amended',
        'The CONTRACTOR shall provide, within fourteen (14) days of the Notice to Proceed, an unconditional and irrevocable performance bond for ten percent (10%) of the CONTRACT PRICE, issued by a bank licensed in the Sultanate of Oman and valid until twenty-eight (28) days after expiry of the Defects Liability Period.'),
      sc('5.2', 'Parent Company Guarantee', 'GCC 14.4', 'added',
        'Where the CONTRACTOR is a subsidiary, a parent company guarantee in the COMPANY\'s standard form shall be provided before the Notice to Proceed is issued.'),
      sc('5.3', 'Warranty & Defects Liability', 'GCC 15.2', 'amended',
        'The Defects Liability Period shall be twenty-four (24) months from the date of the Completion Certificate. Any element repaired or replaced during that period shall carry a fresh twenty-four (24) month period from the date of rectification.'),
    ],
  },
  {
    id: 'b2c-6', code: '6', title: 'Insurance, Indemnity & Liability',
    description: 'Minimum cover, indemnities and the liability cap applying to this contract.',
    subclasses: [
      sc('6.1', "Contractor's Insurances", 'GCC 17.1', 'amended',
        'The CONTRACTOR shall maintain, for the duration of the CONTRACT and the Defects Liability Period:\n\n• Contractor All Risks cover for not less than OMR 2,000,000 per occurrence\n• Workmen\'s Compensation cover for all personnel, in accordance with Omani law\n• Third Party Liability cover for not less than OMR 2,000,000 per occurrence\n• Motor Third Party cover for all vehicles used in connection with the WORK\n\nCertificates of cover shall be provided before mobilisation and on each renewal.'),
      sc('6.2', 'Indemnities', 'GCC 18.1', 'as_b1',
        'Clause 18.1 of the General Conditions applies without amendment.'),
      sc('6.3', 'Limitation of Liability', 'GCC 19.1', 'amended',
        'The CONTRACTOR\'s aggregate liability under this CONTRACT shall not exceed one hundred percent (100%) of the CONTRACT PRICE, save that no limit shall apply to liability arising from death or personal injury, gross negligence, wilful misconduct, breach of confidentiality, or the CONTRACTOR\'s indemnities in respect of its own personnel.'),
    ],
  },
  {
    id: 'b2c-7', code: '7', title: 'Health, Safety, Security & Environment',
    description: 'HSSE obligations specific to this contract, read with Section C.',
    subclasses: [
      sc('7.1', 'HSSE Compliance', 'GCC 21.1', 'amended',
        'The CONTRACTOR shall comply with Section C — QHSSE Requirements, the COMPANY\'s Life Saving Rules and all applicable Omani HSE legislation. A breach of a Life Saving Rule is a material breach of this CONTRACT.'),
      sc('7.2', 'Permit to Work', 'GCC 21.4', 'added',
        'No work shall commence on the SITE without a valid permit issued under the COMPANY\'s Permit to Work system. All CONTRACTOR supervisors shall hold current permit-receiver certification.'),
      sc('7.3', 'Incident Reporting', 'GCC 21.6', 'amended',
        'All incidents, near misses and unsafe conditions shall be reported to the COMPANY REPRESENTATIVE immediately and confirmed in writing within twenty-four (24) hours. A full investigation report shall follow within seven (7) days.'),
    ],
  },
  {
    id: 'b2c-8', code: '8', title: 'Personnel, Omanisation & Local Content',
    description: 'Manpower, Omanisation and In-Country Value obligations, read with Sections H, J, K and L.',
    subclasses: [
      sc('8.1', 'Key Personnel', 'GCC 22.1', 'amended',
        'The personnel named in the CONTRACTOR\'s tender as Key Personnel shall not be replaced without the COMPANY\'s prior written consent. Any replacement shall be of equal or better qualification and experience.'),
      sc('8.2', 'Omanisation', 'GCC 22.4', 'amended',
        'The CONTRACTOR shall achieve and maintain the Omanisation percentage committed in its tender, and shall report actual Omanisation monthly. Shortfalls shall be remedied within sixty (60) days of notification.'),
      sc('8.3', 'Minimum Salaries', 'GCC 22.6', 'added',
        'The CONTRACTOR shall pay all Omani personnel not less than the minimum salaries set out in Section L, and shall make payslips available for audit on request.'),
      sc('8.4', 'ICV Commitments', 'GCC 23.1', 'amended',
        'The CONTRACTOR shall deliver the In-Country Value commitments made in its tender and reported under Section H, and shall submit an audited ICV certificate annually and on completion.'),
    ],
  },
  {
    id: 'b2c-9', code: '9', title: 'Variations, Suspension & Termination',
    description: 'Change control and the grounds and consequences of suspension or termination.',
    subclasses: [
      sc('9.1', 'Variation Orders', 'GCC 25.1', 'amended',
        'No variation shall be valid unless issued as a written Variation Order signed by the COMPANY REPRESENTATIVE. The CONTRACTOR shall not act on a verbal instruction and shall have no claim in respect of work performed without a Variation Order.'),
      sc('9.2', 'Valuation of Variations', 'GCC 25.4', 'amended',
        'Variations shall be valued using the rates in Section E where applicable. Where no rate applies, the parties shall agree a rate before the work proceeds, failing which the COMPANY shall determine a fair valuation.'),
      sc('9.3', 'Suspension', 'GCC 27.1', 'as_b1',
        'Clause 27.1 of the General Conditions applies without amendment.'),
      sc('9.4', 'Termination for Convenience', 'GCC 28.1', 'amended',
        'The COMPANY may terminate this CONTRACT for convenience on thirty (30) days written notice. The CONTRACTOR shall be paid for work properly executed to the date of termination, together with reasonable, evidenced demobilisation costs, but shall have no claim for loss of profit or anticipated earnings.'),
    ],
  },
  {
    id: 'b2c-10', code: '10', title: 'Confidentiality, Disputes & Governing Law',
    description: 'Confidentiality, intellectual property and how disputes are resolved.',
    subclasses: [
      sc('10.1', 'Confidentiality', 'GCC 30.1', 'amended',
        'The confidentiality obligations in Clause 30.1 of the General Conditions shall survive expiry or termination of this CONTRACT for a period of five (5) years.'),
      sc('10.2', 'Intellectual Property', 'GCC 31.1', 'as_b1',
        'Clause 31.1 of the General Conditions applies without amendment.'),
      sc('10.3', 'Governing Law', 'GCC 33.1', 'amended',
        'This CONTRACT shall be governed by and construed in accordance with the laws of the Sultanate of Oman.'),
      sc('10.4', 'Dispute Resolution', 'GCC 33.3', 'amended',
        'The parties shall first attempt to resolve any dispute by good-faith negotiation between senior representatives within thirty (30) days. Failing resolution, the dispute shall be finally settled by arbitration in Muscat under the rules of the Oman Commercial Arbitration Centre, before a single arbitrator, in the English language.'),
    ],
  },
]

// A fresh, deep copy — the editor mutates its own working set, never the seed.
export const cloneB2Classes = () => B2_DEFAULT_CLASSES.map(c => ({
  ...c,
  subclasses: c.subclasses.map(s => ({ ...s })),
}))

export const countSubclasses = (classes) => classes.reduce((n, c) => n + c.subclasses.length, 0)
export const countDeviations = (classes) =>
  classes.reduce((n, c) => n + c.subclasses.filter(s => s.deviation !== 'as_b1').length, 0)

// Flatten the classes to the plain text that fills the B2 template's
// "clauses where deviate from B1" field on export.
export function renderB2Text(classes) {
  const lines = []
  classes.forEach(c => {
    const deviating = c.subclasses.filter(s => s.deviation !== 'as_b1')
    if (!deviating.length) return
    lines.push(`${c.code}. ${c.title}`)
    deviating.forEach(s => {
      lines.push(`${s.code} ${s.title} [${B2_DEVIATIONS[s.deviation].label}${s.b1Ref ? ` · ${s.b1Ref}` : ''}]`)
      lines.push(s.content.trim())
    })
  })
  return lines.length
    ? lines.join('\n')
    : 'NOT USED — Section B1 General Conditions of Contract apply without modification.'
}
