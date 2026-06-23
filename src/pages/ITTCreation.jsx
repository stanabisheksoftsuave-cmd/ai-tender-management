import { useState, useEffect, useRef } from 'react'
import {
  Bot, Sparkles, CheckCircle, RefreshCw, Highlighter, Send, ChevronRight,
  FileText, AlertCircle, Clock, RotateCcw, Circle, UserCheck, Download, ShieldCheck
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { exportTenderPDF } from '../utils/exportPDF'

const ITT_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Government Procurement',
    icon: '🏛️',
    description: 'General-purpose tender for goods, services, or works under Oman Government Tenders & Procurement Law.',
    tags: ['GTPL Compliant', 'Fixed-Price', 'Standard SLA'],
    colorBg: 'bg-blue-50', colorBorder: 'border-blue-200', colorText: 'text-blue-700', colorTag: 'bg-blue-100 text-blue-600',
    extraSection: {
      id: 'compliance',
      title: '4. Compliance & Legal Requirements',
      content: `4.1 Regulatory Compliance\nAll submissions must comply with the Oman Government Tenders & Procurement Law (Royal Decree No. 36/2008 and amendments).\n\n4.2 Financial Requirements\nBidders must submit a Bid Bond of 5% of the total bid value issued by an Omani licensed bank, valid for 120 days.\n\n4.3 Eligibility\nOnly companies registered with the Oman Chamber of Commerce and Industry (OCCI) are eligible to submit. Proof of registration must be included.\n\n4.4 Conflict of Interest\nBidders must declare any actual or potential conflicts of interest. Failure to disclose will result in immediate disqualification.`,
    },
  },
  {
    id: 'it',
    name: 'IT & Technology Solutions',
    icon: '💻',
    description: 'Optimised for software, hardware, cloud infrastructure, digital transformation, and IT managed services.',
    tags: ['ISO 27001', 'Cloud-Ready', 'NITA Compliant'],
    colorBg: 'bg-violet-50', colorBorder: 'border-violet-200', colorText: 'text-violet-700', colorTag: 'bg-violet-100 text-violet-600',
    extraSection: {
      id: 'tech_security',
      title: '4. Security & Technology Stack Requirements',
      content: `4.1 Information Security\nAll solutions must comply with ISO 27001 and the NITA Cybersecurity Framework v2. Evidence of valid certification (not older than 12 months) is mandatory.\n\n4.2 Data Residency\nAll data must be hosted within the Sultanate of Oman or in approved sovereign cloud environments. Cross-border data transfer requires prior written approval from NITA.\n\n4.3 Technology Standards\nPreferred technology stack must align with ITA interoperability guidelines. Open standards and APIs are required for integration with existing government systems.\n\n4.4 Disaster Recovery\nBidders must provide a documented DR/BCP plan with RTO ≤ 4 hours and RPO ≤ 1 hour for Tier-1 services.`,
    },
  },
  {
    id: 'construction',
    name: 'Construction & Civil Works',
    icon: '🏗️',
    description: 'Tailored for construction, civil engineering, infrastructure projects and public works contracts.',
    tags: ['CIOB Standards', 'HSE Requirements', 'Milestone-Based'],
    colorBg: 'bg-amber-50', colorBorder: 'border-amber-200', colorText: 'text-amber-700', colorTag: 'bg-amber-100 text-amber-600',
    extraSection: {
      id: 'hse',
      title: '4. Health, Safety & Environment (HSE)',
      content: `4.1 HSE Policy\nThe Contractor must maintain a documented HSE Management System aligned with ISO 45001 (Occupational Health & Safety) and ISO 14001 (Environmental Management).\n\n4.2 Site Safety\nA dedicated HSE Officer must be assigned full-time to the project site. Incident reporting must comply with the Ministry of Manpower requirements.\n\n4.3 Environmental Impact\nAn Environmental Impact Assessment (EIA) must be submitted with the proposal. The Contractor is responsible for waste disposal in accordance with the Environmental Protection Authority (EPA) regulations.\n\n4.4 Local Workforce\nMinimum 30% Omanisation of the workforce is required, in compliance with the In-Country Value Programme and Ministry of Manpower directives.`,
    },
  },
  {
    id: 'services',
    name: 'Professional Services',
    icon: '📋',
    description: 'Designed for consulting, advisory, training, staffing, and managed professional services.',
    tags: ['T&M or Fixed', 'Deliverable-Based', 'SLA Defined'],
    colorBg: 'bg-emerald-50', colorBorder: 'border-emerald-200', colorText: 'text-emerald-700', colorTag: 'bg-emerald-100 text-emerald-600',
    extraSection: {
      id: 'sla',
      title: '4. Deliverables & Service Level Agreement',
      content: `4.1 Deliverables\nAll deliverables must be clearly defined with measurable acceptance criteria. Each deliverable requires sign-off from the designated Project Manager before milestone payment is released.\n\n4.2 Service Level Agreement\nThe Contractor must maintain the following service levels:\n• Response time for critical issues: ≤ 2 hours\n• Resolution time for critical issues: ≤ 8 hours\n• Monthly service availability: ≥ 99.5%\n• Monthly SLA reporting: within 5 business days of month-end\n\n4.3 Key Personnel\nKey personnel identified in the proposal may not be substituted without prior written approval from ${'{'}form.department${'}'}.\n\n4.4 Intellectual Property\nAll work products, reports, and deliverables created under this contract shall be the exclusive property of the Government of Oman.`,
    },
  },
]

const generateSections = (form, template) => {
  const budgetNum = parseFloat((form.budget || '').replace(/[^0-9.]/g, '')) || 0
  const isHighValue = budgetNum >= 500000

  const templateScopeNote = template ? {
    standard: `This contract is procured under Oman Government Tenders & Procurement Law (Royal Decree No. 36/2008 and amendments). The CONTRACTOR shall comply with all applicable Government Procurement regulations throughout the duration of the CONTRACT.`,
    it: `This contract covers IT and technology solutions. The CONTRACTOR shall comply with the National Information Technology Authority (NITA) Cybersecurity Framework and all applicable ITA interoperability guidelines. All software, hardware, and cloud solutions must align with OLNG's technology standards and data residency requirements.`,
    construction: `This contract covers construction and civil works. The CONTRACTOR shall comply with all Ministry of Housing and Urban Planning regulations, adhere to CIOB professional standards, and maintain a full HSE Management System aligned with ISO 45001 throughout the CONTRACT duration.`,
    services: `This contract covers professional services. All deliverables shall be produced to a standard consistent with recognised professional bodies. Key personnel must be confirmed in writing prior to mobilisation and may not be substituted without prior written approval from COMPANY.`,
  }[template.id] || '' : ''

  return [
    {
      id: 'section1',
      title: 'Section 1 — Instructions to Tenderers',
      tag: 'Instructions',
      content: `INVITATION TO TENDER
Tender Reference: [${form.title || 'CONTRACT TITLE'}]
Issuing Department: ${form.department || '[DEPARTMENT]'}
Submission Deadline: ${form.deadline || '[DEADLINE]'}
Estimated Contract Value: ${form.budget || '[BUDGET]'}

1.1 INTRODUCTION
Oman LNG LLC ("COMPANY") invites suitably qualified TENDERERS to submit a Tender Proposal for the provision of services/works described in this Invitation to Tender (ITT).

1.2 TENDER SUBMISSION REQUIREMENTS
TENDERERS shall submit their Tender Proposal in accordance with the structure, sequence, and numbering set out in Section F – Execution Methodology. Failure to submit the required information and supporting documents may render the Tender Proposal non-compliant and liable to rejection.

TENDERER shall submit:
(a) One (1) original and two (2) hard copies of the Technical Tender
(b) One (1) original and two (2) hard copies of the Commercial Tender (sealed separately)
(c) Electronic copies on USB drive in PDF and editable format

1.3 BID VALIDITY
Tender Proposals shall remain valid and open for acceptance by COMPANY for a period of ninety (90) calendar days from the Tender closing date.

1.4 TENDER CLARIFICATIONS
TENDERERS requiring clarification on any aspect of this ITT shall submit written questions to the designated Contract Engineer (CE) no later than seven (7) days before the Tender closing date. COMPANY will issue responses to all TENDERERS simultaneously.

1.5 LATE SUBMISSIONS
Tender Proposals received after the Tender closing date and time shall not be considered and will be returned unopened.

1.6 CONFIDENTIALITY
This ITT and all information contained herein are strictly confidential and are issued solely for the purpose of obtaining Tender Proposals. Recipients shall not disclose the contents of this ITT to any third party without prior written consent of COMPANY.

1.7 RIGHT TO REJECT
COMPANY reserves the right to reject any or all Tender Proposals without assigning any reason and without incurring any liability to TENDERERS.`,
    },
    {
      id: 'sectionA',
      title: 'Section A — Form of Agreement',
      tag: 'Agreement',
      content: `OMAN LNG LLC
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

FORM OF AGREEMENT

THIS AGREEMENT is made on [DATE] between:

COMPANY:
Oman LNG LLC, a limited liability company duly organised and existing under the laws of the Sultanate of Oman, having its registered office at P.O. Box 560, Mina Al Fahal P.C. 116, Muscat, Sultanate of Oman.
(hereinafter referred to as "COMPANY")

AND

CONTRACTOR:
[CONTRACTOR FULL LEGAL NAME], a company incorporated under the laws of [JURISDICTION], having its registered office at [ADDRESS].
(hereinafter referred to as "CONTRACTOR")

WHEREAS COMPANY desires to have CONTRACTOR perform the WORK as described in this CONTRACT, and CONTRACTOR desires to perform such WORK under the terms and conditions set out herein.

NOW THEREFORE, in consideration of the mutual covenants and agreements herein contained, the parties agree as follows:

A.1 CONTRACT DOCUMENTS
The following documents shall constitute and be read and construed as part of this CONTRACT:
• Section 1 – Instructions to Tenderers
• Section A – Form of Agreement (this document)
• Section B1 – General Conditions of Contract
• Section C – QHSSE Requirements
• Section D – Scope of Work
• Section E – Schedule of Prices
• Section F – Execution Methodology
• Section G – Administration Instructions
• Section H – In-Country Value (ICV) Requirements
• Section J – JSRS Requirements
• Section K – OPAL Requirements
• Section L – Minimum Salaries

A.2 CONTRACT PRICE
In consideration of the performance of the WORK by CONTRACTOR, COMPANY agrees to pay CONTRACTOR the CONTRACT PRICE of:
${form.budget || '[CONTRACT PRICE IN OMR]'} (Omani Rials)
subject to adjustment as provided in this CONTRACT.

A.3 CONTRACT DURATION
The CONTRACT shall commence on [COMMENCEMENT DATE] and shall be completed within ${form.duration || '[CONTRACT DURATION]'} unless extended by mutual written agreement.

IN WITNESS WHEREOF the parties have executed this CONTRACT as of the date first written above.

For and on behalf of COMPANY:                    For and on behalf of CONTRACTOR:
Oman LNG LLC                                     [CONTRACTOR NAME]

_______________________________                  _______________________________
Name: ___________________________                Name: ___________________________
Title: __________________________                Title: __________________________
Date:  __________________________                Date:  __________________________`,
    },
    {
      id: 'sectionB1',
      title: `Section B1 — General Conditions of Contract${isHighValue ? ' (High Value ≥ USD 500k / High Risk)' : ' (Medium Value USD 50–500k / Low Risk)'}`,
      tag: isHighValue ? 'High Value' : 'Medium Value',
      content: `OMAN LNG LLC
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION B1 — GENERAL CONDITIONS OF CONTRACT
${isHighValue ? 'HIGH VALUE (≥ USD 500,000) / HIGH RISK — June 2018' : 'MEDIUM VALUE (USD 50,000–500,000) / LOW RISK — June 2018'}

1. DEFINITIONS
Capitalised words and expressions have the following meanings when interpreting the CONTRACT:

(a) ACCEPTANCE — COMPANY accepts WORK in writing or is deemed to have accepted WORK in the manner specified by the CONTRACT.

(b) AFFILIATE — with respect to either party shall mean any corporations, partnerships, trusts, or other entities which are more than 50% owned by such party, or owns directly or indirectly more than 50% of such party, or more than 50% owned directly or indirectly by the same entity which owns such party.

(c) ANTI-BRIBERY LAWS — shall mean all national, regional, provincial, state, municipal or local APPLICABLE LAWS that prohibit the bribery of, or the providing of unlawful gratuities, facilitation payments or other benefits to, any GOVERNMENT OFFICIAL or any other PERSON, including without limitation the Oman Penal Code (Royal Decree 7/1994, as amended); the Law for the Protection of Public Funds and Avoidance of Conflicts of Interest (Royal Decree 112/2011); Royal Decree 64/2013 ratifying the UN Convention against Corruption; and Royal Decree 28/2014 ratifying the Arab Anticorruption Convention.

(d) APPLICABLE LAWS — shall mean all national, municipal or state statutes, ordinances or other laws (including but not limited to ANTI-BRIBERY LAWS), regulations, by-laws, rules, codes, directions or any licence, consent, permit, authorisation or other approval required by any public body or authority applicable to such PERSON, property or circumstance.

(e) CALL-OFF — shall mean an instruction in the form of a purchase order from COMPANY to CONTRACTOR issued in accordance with Article 2 herewith and Section G – Administration Instructions to carry out WORK. In the event of any conflict between the provisions of CONTRACT and a CALL-OFF, the former shall take precedence.

(f) COMPANY — shall mean Oman LNG LLC, a limited liability company duly organised and existing under the laws of the Sultanate of Oman having its registered office at P.O. Box 560, Mina Al Fahal P.C. 116, Muscat, Sultanate of Oman.

(g) COMPANY GROUP — shall mean COMPANY and its AFFILIATES and its and their respective directors, officers and employees (including agency personnel), but shall not include any member of CONTRACTOR GROUP.

(h) CONFIDENTIAL INFORMATION — all technical, commercial, or other information or materials, and all documents and other tangible items that record information, whether on paper, in machine-readable format, by sound or video, or otherwise, relating to a PERSON's business, processes, activities, suppliers, customers, financial affairs, products, services or affairs.

${isHighValue ? `HIGH RISK PROVISIONS (≥ USD 500k):
The following additional provisions apply given the high-value and high-risk nature of this CONTRACT:
• CONTRACTOR shall provide a Performance Bond equal to 10% of the CONTRACT PRICE, issued by an Omani-licensed bank, valid for the duration of CONTRACT plus 90 days.
• An independent Third-Party Assurance review shall be conducted at key milestones.
• COMPANY's right to audit extends to sub-contractors and sub-sub-contractors without limitation.
• Liquidated Damages shall apply at a rate of 0.5% of the CONTRACT PRICE per week of delay, up to a maximum of 10%.` : `MEDIUM VALUE PROVISIONS (USD 50k–500k):
• CONTRACTOR shall provide a Performance Bond equal to 5% of the CONTRACT PRICE.
• Liquidated Damages shall apply at a rate of 0.25% of the CONTRACT PRICE per week of delay, up to a maximum of 5%.
• Audit rights are limited to CONTRACTOR's direct operations under this CONTRACT.`}

2. OBLIGATIONS OF CONTRACTOR
CONTRACTOR shall perform the WORK in a safe, professional, and workmanlike manner using skilled personnel and in accordance with:
• The CONTRACT Documents
• APPLICABLE LAWS of the Sultanate of Oman
• COMPANY's HSSE Standards and procedures
• Recognised industry best practices and standards`,
    },
    {
      id: 'sectionC',
      title: 'Section C — QHSSE Requirements',
      tag: 'QHSSE',
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION C — QHSSE REQUIREMENTS

1. DEFINITIONS
"ALARP" (As Low As Reasonably Practicable) means such level of reduction of risk where the cost and effort of further reduction measures becomes unreasonably disproportionate to the additional risk reduction obtained.

"CONTRACT HSSE PLAN" — a site-specific plan prepared by CONTRACTOR detailing how HSSE requirements will be managed during the CONTRACT.

"HSSE STANDARD(S)" — HSSE policies, standards and procedures applicable to the performance of the WORK under the CONTRACT.

"HSSE MS" or "HSSE Management System" — a system for managing HSSE that provides a structured framework of controls at all levels, to ensure that WORK is executed in accordance with HSSE STANDARDS.

2. HSSE STANDARDS
CONTRACTOR shall at all times comply with:
(a) All APPLICABLE LAWS of the Sultanate of Oman relating to HSSE
(b) COMPANY's HSSE Standards, policies and procedures
(c) ISO 45001 (Occupational Health & Safety Management Systems)
(d) ISO 14001 (Environmental Management Systems)

3. CONTRACTOR'S HSSE MANAGEMENT SYSTEM & CONTRACT HSSE PLAN
CONTRACTOR shall maintain a documented HSSE Management System and shall prepare a Contract HSSE Plan specific to the WORK within 14 days of CONTRACT award. The plan shall address:
• Risk assessment methodology and hazard identification
• Emergency response procedures
• Incident reporting and investigation protocol
• HSE performance monitoring and reporting frequencies
• Toolbox talk programme and safety induction arrangements

4. SUBCONTRACTING BY CONTRACTOR
CONTRACTOR shall ensure that all SUBCONTRACTORS comply with the same HSSE requirements as CONTRACTOR. CONTRACTOR shall not subcontract any part of the WORK without prior written approval from COMPANY.

5. HSSE COMPETENCE
CONTRACTOR shall provide evidence of HSSE competence prior to mobilisation, including:
• Completed OLNG Contractor HSE Capability Questionnaire (Appendix 1 to Section F)
• Safety records for the past five (5) years
• CVs and organogram of key HSE personnel assigned to the WORK

6. LIFE SAVING RULES
CONTRACTOR personnel shall comply at all times with COMPANY's Life Saving Rules (LSRs). Violation of any LSR may result in immediate suspension from the WORK.

7. PERFORMANCE MONITORING & INCIDENT INVESTIGATION
CONTRACTOR shall report all incidents, near-misses, and unsafe conditions to COMPANY within 24 hours of occurrence. A written incident investigation report shall be submitted within 7 days.

8. HSE NON-COMPLIANCES
COMPANY reserves the right to suspend the WORK, without prejudice to any other rights or remedies, where CONTRACTOR fails to comply with HSSE requirements. CONTRACTOR shall rectify any non-compliance at no additional cost to COMPANY.`,
    },
    {
      id: 'sectionD',
      title: 'Section D — Scope of Work',
      tag: 'AI Generated',
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION D — SCOPE OF WORK
${templateScopeNote ? `\nTemplate Context: ${templateScopeNote}\n` : ''}
1. INTRODUCTION
${form.department || 'Oman LNG LLC'} ("COMPANY") requires the provision of ${form.title || '[SERVICE/WORKS TITLE]'} as described in this Scope of Work. The successful CONTRACTOR shall deliver all services, works, and deliverables in accordance with this Section D and all other CONTRACT Documents.

2. PROJECT BACKGROUND & OBJECTIVES
${form.description || '[Project description and key objectives to be provided by the Contract Engineer]'}

3. SCOPE OF SERVICES / WORKS
The CONTRACTOR shall provide, but not be limited to, the following:

3.1 Core Deliverables
• Full scope delivery of ${form.title || '[WORKS/SERVICES]'} as specified herein
• Provision of all required personnel, equipment, materials, and resources
• Integration with COMPANY's existing systems and facilities where applicable
• Compliance with all APPLICABLE LAWS and COMPANY standards throughout

3.2 Project Management
• Appointment of a dedicated Project Manager prior to mobilisation
• Submission of a detailed Project Execution Plan within 14 days of CONTRACT award
• Monthly progress reports including schedule, cost, risk register, and action log
• Attendance at progress review meetings as required by COMPANY

3.3 Handover & Closeout
• All deliverables shall be formally handed over to COMPANY with signed acceptance certificates
• CONTRACTOR shall provide full documentation, as-built records, and training as specified
• A closeout report shall be submitted within 30 days of WORK completion

4. CONTRACT PARAMETERS
• Estimated Contract Value: ${form.budget || '[TO BE CONFIRMED]'}
• Contract Duration: ${form.duration || '[TO BE CONFIRMED AT AWARD]'}
• Submission Deadline: ${form.deadline || '[TO BE CONFIRMED]'}
• Issuing Department: ${form.department || '[DEPARTMENT]'}

5. EXCLUSIONS
The following are explicitly excluded from this CONTRACT scope unless agreed in writing by COMPANY:
• Permanent works not described in this Section D
• Supply of materials not listed in Section E – Schedule of Prices
• Services performed outside COMPANY premises unless specifically authorised

6. STANDARDS & SPECIFICATIONS
All WORK shall be performed in accordance with the latest edition of applicable international and Omani national standards. Where conflict exists, the more stringent standard shall apply.`,
    },
    {
      id: 'sectionE',
      title: 'Section E — Schedule of Prices',
      tag: 'Pricing',
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION E — SCHEDULE OF PRICES

1. GENERAL PREAMBLE
CONTRACTOR must read the general pricing preamble in conjunction with the particular pricing preamble. CONTRACTOR shall state in Section E their prices for the provision of the WORK as detailed in all Sections of this CONTRACT.

The quoted prices shall include but not be limited to all costs to CONTRACTOR for the full and complete performance of the WORK and any other items not specifically mentioned but reasonably implied by the nature of the WORK as set forth herein, unless specifically noted otherwise.

CONTRACTOR shall state all-inclusive rates for provision of WORK irrespective of actual resources expended by CONTRACTOR.

2. PRICING RULES
• All submitted rates must be in Omani Rials (OMR) and are fixed for CONTRACT DURATION unless a mechanism for adjustment is included in CONTRACT
• Value-added tax (VAT) cost shall not be included in the price but invoiced separately as applicable
• CONTRACTOR agrees to present all rates to a maximum of 2 decimal places only
• In case of errors in addition or extension, the submitted rates prevail
• COMPANY reserves the full right to award WORK in whole or in part at its entire discretion
• This CONTRACT shall be non-exclusive; COMPANY retains the right to obtain similar services from another supplier

3. PRICING SCHEDULES
CONTRACTOR shall complete the Pricing Schedule tables provided in Appendix to Section E, covering:
• Schedule 1: Lump Sum Items (if applicable)
• Schedule 2: Unit Rate Items
• Schedule 3: Reimbursable/Daywork Rates (if applicable)
• Schedule 4: Third-Party Materials and Services (TPM/TPS)

4. PROVISION OF THIRD-PARTY MATERIALS AND SERVICES (TPM/TPS)
Where CONTRACTOR procures third-party materials or services, the costs shall be passed through to COMPANY at actual cost plus an agreed management fee not to exceed [__]% as stated in Schedule 4.

5. PRICE ESCALATION / ADJUSTMENT
Prices are fixed for the duration of CONTRACT. Price escalation will only be considered where:
(a) COMPANY directs a change in scope via a formal Variation Order
(b) A change in APPLICABLE LAWS directly affects CONTRACTOR's costs
(c) An extension of CONTRACT DURATION is granted by COMPANY

6. PERFORMANCE BOND
${isHighValue ? 'CONTRACTOR shall provide a Performance Bond equal to 10% of the CONTRACT PRICE within 14 days of CONTRACT award, issued by an Omani-licensed bank acceptable to COMPANY.' : 'CONTRACTOR shall provide a Performance Bond equal to 5% of the CONTRACT PRICE within 14 days of CONTRACT award, issued by an Omani-licensed bank acceptable to COMPANY.'}

7. LIQUIDATED DAMAGES (LD) AND PENALTIES
${isHighValue ? 'Liquidated Damages shall apply at a rate of 0.5% of the CONTRACT PRICE per week of delay, subject to a maximum of 10% of the CONTRACT PRICE.' : 'Liquidated Damages shall apply at a rate of 0.25% of the CONTRACT PRICE per week of delay, subject to a maximum of 5% of the CONTRACT PRICE.'}`,
    },
    {
      id: 'sectionF',
      title: 'Section F — Execution Methodology',
      tag: 'Methodology',
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION F — EXECUTION METHODOLOGY

PURPOSE
This Section sets out the minimum information and documentary evidence that the TENDERER shall submit as part of its Tender Proposal for evaluation by COMPANY. Failure to submit the required information and supporting documents may render the Tender Proposal non-compliant and liable to rejection.

TENDER PROPOSAL STRUCTURE
The TENDERER shall submit its Tender Proposal in accordance with the following structure:

Ref.   Submission Requirement
─────────────────────────────────────────────────────────────────
A      Form of Agreement
A-1    Form of Tender (Refer to Appendix 1 of Section 1)
       TENDERER shall complete and return the Form of Tender duly signed.

B1     General Conditions of Contract
B1-1   CONTRACT Terms & Conditions (Refer to Section B1)
       TENDERER shall submit a duly signed confirmation of acceptance.

C      QHSSE Submission
C-1    HSE Capability Questionnaire (Refer to Appendix 1 to Section F)
       TENDERER shall complete the OLNG Contractor HSE Capability Questionnaire
       and submit all required supporting evidence.
C-2    Quality Management System
       TENDERER shall submit details of its QMS including relevant policies
       and procedures.
C-3    Quality Plan
       TENDERER shall submit its proposed QA/QC Plan or Inspection and Test
       Plan applicable to the CONTRACT scope.

D      Scope of Work Response
D-1    Technical Approach & Methodology
       TENDERER shall provide a detailed description of its proposed approach
       to delivering the WORK, including methodology, sequence of activities,
       and key deliverables.
D-2    Project Schedule
       TENDERER shall submit a project schedule showing all key milestones.
D-3    Resource Plan
       TENDERER shall provide an organisation chart and CV of key personnel.

E      Schedule of Prices
E-1    Completed Pricing Schedule (all schedules as provided)

H      In-Country Value (ICV) Plan (Refer to Section H)
J      JSRS Registration Evidence
K      OPAL Compliance Certification Evidence

CONTRACTUAL STATUS OF TENDER PROPOSAL
For the successful TENDERER, those parts of the Tender Proposal expressly accepted by COMPANY, including any agreed clarifications, committed plans, schedules, certifications, and supporting documents, shall form part of the CONTRACT.`,
    },
    {
      id: 'sectionG',
      title: 'Section G — Administration Instructions',
      tag: 'Admin',
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION G — ADMINISTRATION INSTRUCTIONS

This section comprises the following parts:
PART A: ACCESS TO SITE
PART B: ADMINISTRATION
PART C: HSE REQUIREMENTS
PART D: QUALITY MANAGEMENT
PART E: MATERIALS CONTROL
PART F: IMPORT OF MATERIALS & EQUIPMENT

PART A: ACCESS TO SITE
CONTRACTOR to whom WORK is awarded shall be given access to COMPANY Qalhat Complex or Head Office building only after completing and passing the Site Safety Induction Programme and complying with the following requirements:

1. CONTRACTOR shall submit to COMPANY the list of personnel to be assigned to the WORK. Each staff on the list shall be supported by:
   • Personnel CV with passport-size photo
   • CONTRACTOR Identification Card
   • Photocopy of Labour Permit for Non-Omani Nationals
   • Photocopy of Passport for Non-Omani Nationals
   • Copy of recent Security Clearance Certificate for Omani Nationals

2. COMPANY shall issue each CONTRACTOR staff an electronic access card. CONTRACTOR personnel must wear their ID while inside COMPANY property.

3. In the event of loss or non-return of Identification Card upon completion of a contract, COMPANY shall charge CONTRACTOR RO 5/- (Rials Omani Five) per lost or non-returned card.

4. Upon completion of a CONTRACTOR staff member's assignment, or in the event of termination, CONTRACTOR shall immediately notify COMPANY Security Department and surrender the electronic access card.

PART B: ADMINISTRATION
5. All WORK shall be executed under the direction of COMPANY's designated Contract Engineer (CE).

6. CONTRACTOR shall designate a single point of contact (Project Manager) who shall be available during COMPANY business hours and respond to queries within 24 hours.

7. CONTRACTOR shall attend monthly progress review meetings and submit written progress reports covering:
   • Work completed vs planned
   • Budget status (actual vs committed vs forecast)
   • Risk register update
   • Upcoming activities and resource plan

8. All correspondence shall reference the CONTRACT number and be addressed to the designated CE.

PART C: HSE REQUIREMENTS (see also Section C)
9. CONTRACTOR vehicles shall require a vehicle entry permit. COMPANY Engineering Department shall inspect vehicle mechanical condition before a vehicle pass is issued.

10. COMPANY security reserves the right to detain and search staff entering or leaving COMPANY premises during random security checks.`,
    },
    {
      id: 'sectionH',
      title: 'Section H — In-Country Value (ICV) Requirements',
      tag: 'ICV',
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION H — IN-COUNTRY VALUE (ICV) REQUIREMENTS

A. TERMS AND CONDITIONS

1. INTRODUCTION
Oman LNG LLC is committed to maximising In-Country Value (ICV) in all its procurement activities, in alignment with the Sultanate of Oman's Vision 2040 objectives and the national ICV Programme.

2. GENERAL
CONTRACTOR shall maximise ICV throughout the performance of WORK by:
(a) Employing Omani nationals (Omanisation)
(b) Sourcing goods and services from local Omani suppliers where technically and commercially competitive
(c) Investing in fixed assets and facilities within the Sultanate of Oman
(d) Transferring knowledge and skills to Omani personnel

3. EVIDENCE OF OMANI ORIGIN FOR GOODS
CONTRACTOR shall provide COMPANY with evidence of Omani origin for all goods claimed as local content. Evidence shall include a Certificate of Origin issued by the Oman Chamber of Commerce and Industry (OCCI).

4. ICV MONITORING AND REPORTING
CONTRACTOR shall submit ICV Reports to COMPANY on a quarterly basis using the template provided in Appendix C to this Section. Reports shall include:
• Workforce composition (Omani vs. expatriate headcount and cost)
• Local goods and services procurement (OMR value and % of total)
• Investment in fixed assets in Oman (OMR value)

5. COMPANY RIGHT TO VERIFY AND AUDIT
COMPANY reserves the right to audit CONTRACTOR's ICV claims at any time during the CONTRACT period. CONTRACTOR shall maintain all supporting records for a minimum of 5 years after CONTRACT completion.

6. NON-CONFORMANCE
Failure to meet agreed ICV targets or submit ICV reports on time shall constitute a non-conformance. COMPANY may apply financial remedies of up to [__]% of the relevant quarterly payment in cases of material ICV non-conformance.

B. ICV PLAN REQUIREMENTS
TENDERER shall submit an ICV Plan as part of the Tender Proposal (Appendix A to this Section) covering:
3.1 Overview of ICV approach
3.2 Planned investments in Fixed Assets in Oman
3.3 Omanisation targets by role/grade
3.4 Local sourcing plan for Goods
3.5 Local sourcing plan for Sub-Contracted Services`,
    },
    {
      id: 'sectionJ',
      title: 'Section J — JSRS Requirements',
      tag: 'JSRS',
      autoApproved: true,
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION J — JSRS REQUIREMENTS

JSRS REGISTRATION
COMPANY shall only award CONTRACT to those CONTRACTORS who are registered, or intend to register, with the Joint Supplier Registration System (JSRS) for the Oil & Gas Industry in the Sultanate of Oman.

Should COMPANY award CONTRACT to a CONTRACTOR who is not yet registered, CONTRACTOR shall have a grace period of 4 months to register with JSRS. In the event of CONTRACTOR failing to register with JSRS within this grace period:
• CONTRACTOR shall be contra-charged at a rate of RO 500.000 for each subsequent month, or part thereof, without JSRS Registration, for a further period of 6 months
• At the expiry of this second period (total 10 months from CONTRACT award), COMPANY shall have the right to Terminate CONTRACT on the grounds of CONTRACTOR default

RENEWAL OF JSRS REGISTRATION
CONTRACTOR is required to maintain their JSRS registration valid throughout the CONTRACT period. Should CONTRACTOR fail to maintain their JSRS Registration:
• CONTRACTOR shall accrue contra-charges as described above for a 4-month period upon expiry
• If CONTRACTOR fails to renew during this 4-month period, COMPANY shall have the right to Terminate CONTRACT on the grounds of CONTRACTOR default

MOL OMANISATION CERTIFICATE
The CONTRACTOR shall ensure compliance with Omanisation requirements, including maintaining a "Green" status in the JSRS system as per the Ministry of Labour (MOL) classification, throughout the CONTRACT duration. The CONTRACTOR shall promptly notify COMPANY of any change in status and take necessary corrective actions. Failure to comply may result in CONTRACT Suspension and Termination.

JSRS CONTACT DETAILS
Business Gateway International
Office 14, Building 4, Knowledge Oasis Muscat (KOM), Sultanate of Oman
Support Hotline: 24166123 | Tel: 24166100 | Fax: 24170045
Web: https://businessgateways.com

CONTRACTOR confirms having read and understood the foregoing JSRS Registration Requirements and undertakes to act in full compliance thereof for the duration of CONTRACT.`,
    },
    {
      id: 'sectionK',
      title: 'Section K — OPAL Requirements',
      tag: 'OPAL',
      autoApproved: true,
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION K — OPAL REQUIREMENTS

OPAL COMPLIANCE VERIFICATION CERTIFICATION
COMPANY shall only award CONTRACT to those CONTRACTORS who already have, or intend to achieve, OPAL Compliance Verification Certification (OPAL CVC).

Should COMPANY award CONTRACT to a CONTRACTOR who does not yet hold a current OPAL CVC:
• CONTRACTOR shall have a grace period of 6 months in which to achieve Certification
• Failure to achieve OPAL CVC within this grace period shall result in contra-charges at a rate of RO 500.000 per month for a further 6 months
• At the expiry of this second period (total 12 months from CONTRACT award), COMPANY shall have the right to Terminate CONTRACT on the grounds of CONTRACTOR default

OPAL RECERTIFICATION
CONTRACTOR is required to maintain their OPAL CVC throughout the CONTRACT period. Failure to maintain certification shall trigger contra-charges and ultimately the right to Terminate CONTRACT as described above.

LICENSING REQUIREMENTS FOR PRACTISING CERTAIN PROFESSIONS
The CONTRACTOR shall comply with all applicable requirements issued by the Ministry of Labour and the Oman Energy Association (OPAL) regarding licensing for practising designated professions. Without prejudice to the generality of the foregoing, the CONTRACTOR shall:

• Ensure that all personnel (Omani and expatriate) assigned to perform the WORK in regulated professional categories obtain and maintain valid OPAL professional licenses prior to mobilisation and throughout the CONTRACT duration
• Ensure that no personnel requiring OPAL certification are deployed or allowed to perform the WORK unless such certification has been obtained and is valid
• Comply with all applicable timelines, assessment requirements, and regulatory updates issued by the relevant authorities
• Ensure that all job titles used in submissions, mobilisation requests, and CONTRACT documentation are fully aligned with OPAL-approved job titles
• Upon request by COMPANY, provide evidence of compliance including copies of valid OPAL licenses and a compliance plan within the timeframe specified by COMPANY
• Immediately remove and replace any personnel found to be non-compliant with OPAL requirements, at no additional cost to COMPANY

Failure to comply with this clause shall constitute a material breach of CONTRACT and may result in contractual remedies, including rejection, suspension, or termination.`,
    },
    {
      id: 'sectionL',
      title: 'Section L — Minimum Salaries',
      tag: 'Salaries',
      autoApproved: true,
      content: `OMAN LNG LLC — QALHAT
CONTRACT TITLE: ${form.title || '[CONTRACT TITLE]'}
CONTRACT NUMBER: [CONTRACT NO.]

SECTION L — MINIMUM SALARIES

COMPANY is committed to ensuring that all Omani staff working on COMPANY's behalf receives fair remuneration for their work. CONTRACTOR is required to comply with the following requirements in relation to Omani staff salaries.

MINIMUM SALARY TABLE (All amounts in OMR per month)

Qualification Level   | Basic | Housing | Transport | Desert Allow. | Full Pkg (No Desert) | Full Pkg (With Desert)
─────────────────────────────────────────────────────────────────────────────────────────────────────
Unskilled             |  120  |    25   |     20    |      30      |          165         |           195
Semi-skilled          |  150  |    30   |     25    |      40      |          205         |           245
Skilled               |  180  |    40   |     30    |      45      |          250         |           295
Technicians           |  250  |    50   |     40    |      65      |          340         |           405
Technical Professionals|  350  |    60   |     45    |      75      |          455         |           530
Junior Management     |  375  |    70   |     55    |      90      |          500         |           590

Note: For the purposes of this CONTRACT, Desert Allowance will NOT be mandatory.

CONTRACTOR shall use the above figures as a basis for their Tender submissions. In the event of COMPANY revising the above figures during the period of CONTRACT, CONTRACTOR may seek to recover such additional costs from COMPANY.

In the event of conflict between salaries required to be paid to Omani staff under the Oman Labour Law, OPAL Certification requirements, or COMPANY requirements, the higher value shall take precedence, and CONTRACTOR is deemed to have incorporated such in their CONTRACT PRICE.

AUDIT RIGHTS
COMPANY's Conditions of CONTRACT grant audit rights to COMPANY to ensure staff are paid in compliance with both the Omani Labour Law and CONTRACT Requirements. Random audits shall be performed to ensure the above salaries are being passed on to the relevant staff.

PENALTIES FOR NON-COMPLIANCE
• In the event of CONTRACTOR failing to pay either Omani or Expatriate staff in accordance with these requirements, CONTRACTOR shall be contra-charged at a rate of RO 100.000 for each individual violation per month
• CONTRACTOR shall be required to make up any salary deficit to the staff member at the next payment opportunity
• Should CONTRACTOR fail to rectify any payment shortfall, COMPANY shall have the right to Terminate CONTRACT on the grounds of CONTRACTOR default

Expatriate staff shall be reimbursed in full accordance with the Omani Labour Law.`,
    },
  ]
}

// steps moved inside component to use t()

const generationTasks = [
  'Analysing project requirements & template',
  'Generating Section 1 — Instructions to Tenderers',
  'Drafting Section A — Form of Agreement',
  'Selecting Section B1 — General Conditions (value-based)',
  'Populating Section C — QHSSE Requirements',
  'AI-generating Section D — Scope of Work',
  'Compiling Section E — Schedule of Prices',
  'Building Section F — Execution Methodology',
  'Applying Sections G, H, J, K, L — Compliance & Administration',
  'Quality check & finalization',
]

const draftStatusMap = [
  { label: 'ITT Draft', sub: 'Filling in project details', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  { label: 'ITT Draft', sub: 'Selecting document template', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: 'ITT Draft', sub: 'AI generating document...', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  { label: 'ITT Draft', sub: 'Under review', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'Pending Approval', sub: 'Awaiting approver decision', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
]

export default function ITTCreation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { tenders, addTender, advanceTender } = useTenders()
  const { lang, t } = useLanguage()
  const { user } = useAuth()
  const approverName = user?.name || 'Procurement Officer'
  const approverRole = user?.role?.label || 'Procurement Officer'
  const approverInitials = approverName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const steps = [t('itt.step1'), 'Template', t('itt.step2'), t('itt.step3'), t('itt.step4')]

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const initialForm = existingTender
    ? { title: existingTender.title, department: existingTender.department, budget: existingTender.budget, deadline: existingTender.deadline, duration: existingTender.duration || '', description: existingTender.description || '' }
    : { title: '', department: '', budget: '', deadline: '', duration: '', description: '' }

  const [step, setStep] = useState(existingTender ? 3 : 0)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [genStep, setGenStep] = useState(0)
  const [draftTenderId, setDraftTenderId] = useState(existingTender?.id || null)
  const [selectedText, setSelectedText] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [sections, setSections] = useState(() => generateSections(initialForm))
  const [approvedSections, setApprovedSections] = useState([])
  const [redesignSection, setRedesignSection] = useState(null)
  const [redesignNote, setRedesignNote] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [ittApproved, setIttApproved] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [showErrors, setShowErrors] = useState(false)
  const draftSavedRef = useRef(false)

  const requiredFields = ['title', 'department', 'budget', 'deadline', 'description']
  const isFormValid = requiredFields.every(f => form[f].trim() !== '')
  const fieldError = (key) => showErrors && form[key].trim() === ''

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const setBudget = (raw) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (!digits) { setField('budget', ''); return }
    const num = parseInt(digits, 10)
    setField('budget', 'OMR ' + num.toLocaleString('en-US'))
  }

  // Auto-tick generation tasks, then add draft tender + advance to Review
  useEffect(() => {
    if (step !== 2) return
    if (genStep >= generationTasks.length) {
      const t = setTimeout(() => {
        if (!draftSavedRef.current) {
          draftSavedRef.current = true
          setSections(generateSections(form, selectedTemplate))
          const maxNum = tenders.reduce((max, t) => Math.max(max, parseInt(t.id.split('-')[2]) || 0), 0)
          const newId = `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
          addTender({
            id: newId,
            title: form.title,
            department: form.department,
            budget: form.budget,
            deadline: form.deadline,
            description: form.description,
            duration: form.duration,
            status: 'draft',
            stage: 'Pending Approval',
            created: new Date().toISOString().split('T')[0],
            bidders: 0,
            bidderList: [],
            aiScore: null,
          })
          setDraftTenderId(newId)
        }
        setStep(3)
      }, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setGenStep(g => g + 1), 550)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, genStep])

  const handleGenerate = () => {
    if (!isFormValid) { setShowErrors(true); return }
    setStep(1)
  }

  const handleStartGeneration = () => {
    setGenStep(0)
    setStep(2)
  }

  const handleTextSelect = () => {
    const sel = window.getSelection()?.toString()
    if (sel && sel.length > 10) setSelectedText(sel)
  }

  const toggleApprove = (id) => {
    setApprovedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleRedesignSubmit = (id) => {
    setApprovedSections(prev => prev.filter(s => s !== id))
    setRedesignSection(null)
    setRedesignNote('')
  }

  const currentDraftStatus = ittApproved
    ? { label: 'ITT Created', sub: 'Approved & ready to export', cls: 'bg-green-100 text-green-700 border-green-200' }
    : draftStatusMap[step] || draftStatusMap[0]

  const reviewableSections = sections.filter(s => !s.autoApproved)
  const allApproved = approvedSections.length === reviewableSections.length

  return (
    <div className="space-y-5">
      {/* Draft status banner */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${currentDraftStatus.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
          <span>{currentDraftStatus.label}</span>
          <span className="opacity-40">·</span>
          <span className="opacity-70">{currentDraftStatus.sub}</span>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">{draftTenderId || 'New Draft'}</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 flex-wrap gap-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-green-500 border-green-500 text-white' :
                  i === step ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' :
                  'bg-white border-slate-200 text-slate-400'}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight size={16} className="mx-3 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Project Details ── */}
      {step === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[var(--color-primary)]" />
              Project Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'title',      label: t('itt.fieldTitle'),    placeholder: 'e.g. Enterprise Cloud Infrastructure Upgrade', span: 2, required: true },
                { key: 'department', label: t('itt.fieldDept'),     placeholder: 'e.g. IT Department', required: true },
                { key: 'budget',     label: t('itt.fieldBudget'),   placeholder: 'e.g. 500000', required: true, onChangeFn: setBudget },
                { key: 'deadline',   label: t('itt.fieldDeadline'), type: 'date', required: true },
                { key: 'duration',   label: t('itt.fieldDuration'), placeholder: 'e.g. 24 months', required: false },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => f.onChangeFn ? f.onChangeFn(e.target.value) : setField(f.key, e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-colors
                      ${fieldError(f.key)
                        ? 'border-red-400 focus:ring-red-300 bg-red-50'
                        : 'border-slate-200 focus:ring-[var(--color-primary)]/30'}`}
                  />
                  {fieldError(f.key) && (
                    <p className="text-[11px] text-red-500 mt-1">{f.label} is required</p>
                  )}
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Project Description / Key Requirements
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the project scope, objectives, and key requirements..."
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 resize-none transition-colors
                    ${fieldError('description')
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-[var(--color-primary)]/30'}`}
                />
                {fieldError('description') && (
                  <p className="text-[11px] text-red-500 mt-1">Project description is required</p>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Bot size={14} className="text-violet-600" />
                AI Configuration
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Evaluation Model</label>
                  <select className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none">
                    <option>60% Quality / 40% Price</option>
                    <option>70% Quality / 30% Price</option>
                    <option>50% Quality / 50% Price</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Contract Type</label>
                  <select className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none">
                    <option>Fixed-Price</option>
                    <option>Time & Materials</option>
                    <option>Framework Agreement</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Compliance Standards</label>
                  <div className="space-y-1.5">
                    {['ISO 27001', 'GDPR', 'Local Content', 'Financial Vetting'].map(c => (
                      <label key={c} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleGenerate}
              className="w-full justify-center"
              disabled={showErrors && !isFormValid}
            >
              <ChevronRight size={15} />
              Next: Select Template
            </Button>

            {showErrors && !isFormValid && (
              <p className="text-[11px] text-red-500 text-center flex items-center justify-center gap-1">
                <AlertCircle size={11} /> Please fill in all required fields marked with *
              </p>
            )}

            {!showErrors && (
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Choose a document template on the next step before AI generation.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Template Selection ── */}
      {step === 1 && (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-[var(--color-primary)]" />
                  Select a Document Template
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Choose the template that best matches your tender type. It shapes the generated document structure.</p>
              </div>
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Back
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ITT_TEMPLATES.map(tmpl => {
                const isSelected = selectedTemplate?.id === tmpl.id
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`text-left rounded-xl border-2 p-4 transition-all
                      ${isSelected
                        ? `${tmpl.colorBg} ${tmpl.colorBorder} ring-2 ring-offset-1`
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${isSelected ? tmpl.colorText : 'text-slate-800'}`}>{tmpl.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{tmpl.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle size={16} className={tmpl.colorText} />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.tags.map(tag => (
                        <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? tmpl.colorTag : 'bg-slate-100 text-slate-500'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={`mt-3 pt-3 border-t ${isSelected ? tmpl.colorBorder : 'border-slate-100'} text-[10px] font-medium ${isSelected ? tmpl.colorText : 'text-slate-400'}`}>
                      + Adds: {tmpl.extraSection.title.replace(/^\d+\.\s/, '')}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">
                {selectedTemplate ? `Selected: ${selectedTemplate.name}` : 'No template selected — AI will use standard structure'}
              </p>
              <Button onClick={handleStartGeneration} className="flex items-center gap-2">
                <Sparkles size={15} />
                {t('itt.generate')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Step 2: AI Generation ── */}
      {step === 2 && (
        <Card className="p-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Bot size={36} className="text-violet-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">AI is Generating Your ITT</h3>
            <p className="text-sm text-slate-400">Building your document based on project requirements and compliance standards</p>
          </div>

          <div className="max-w-xs mx-auto space-y-3 mb-10">
            {generationTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all
                  ${i < genStep ? 'bg-green-500' : i === genStep ? 'bg-violet-600' : 'bg-slate-200'}`}>
                  {i < genStep
                    ? <CheckCircle size={13} className="text-white" />
                    : i === genStep
                    ? <RefreshCw size={12} className="text-white animate-spin" />
                    : <Circle size={12} className="text-slate-400" />}
                </div>
                <span className={`text-sm transition-colors ${
                  i < genStep ? 'text-slate-400 line-through' :
                  i === genStep ? 'text-slate-800 font-medium' : 'text-slate-300'
                }`}>{task}</span>
              </div>
            ))}
          </div>

          <div className="max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${Math.round((genStep / generationTasks.length) * 100)}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              {Math.round((genStep / generationTasks.length) * 100)}% complete
            </p>
          </div>
        </Card>
      )}

      {/* ── Step 3: Review & Redesign ── */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="ai"><Bot size={10} /> AI Generated</Badge>
                <span className="text-xs text-slate-500">Approve or redesign each section</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setGenStep(0); setApprovedSections([]); setRedesignSection(null); setStep(2) }}>
                <RefreshCw size={13} /> Regenerate All
              </Button>
            </div>

            <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-xs text-violet-700">
              <Highlighter size={14} className="mt-0.5 shrink-0" />
              <span>Highlight text for targeted AI edits, approve sections you're satisfied with, or request a full redesign per section.</span>
            </div>

            {sections.map(s => {
              const isAutoApproved = s.autoApproved === true
              const isApproved = isAutoApproved || approvedSections.includes(s.id)
              const isRedesigning = !isAutoApproved && redesignSection === s.id
              const isDynamic = s.id === 'sectionD'
              return (
                <Card key={s.id} className={`overflow-hidden transition-all ${
                  isAutoApproved ? 'ring-2 ring-teal-300' :
                  isApproved ? 'ring-2 ring-green-400' :
                  isRedesigning ? 'ring-2 ring-amber-400' : ''}`}>
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b gap-2 flex-wrap ${
                    isAutoApproved ? 'bg-teal-50 border-teal-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      {isAutoApproved && <ShieldCheck size={13} className="text-teal-600 shrink-0" />}
                      {isDynamic && <Bot size={13} className="text-violet-600 shrink-0" />}
                      <span className={`text-sm font-semibold ${isAutoApproved ? 'text-teal-800' : 'text-slate-700'}`}>{s.title}</span>
                      {s.tag && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isAutoApproved ? 'bg-teal-100 text-teal-600' :
                          isDynamic ? 'bg-violet-100 text-violet-600' :
                          s.id === 'sectionB1' && s.tag === 'High Value' ? 'bg-red-100 text-red-600' :
                          s.id === 'sectionB1' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>{s.tag}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAutoApproved ? (
                        <>
                          <Badge variant="success"><CheckCircle size={10} /> Standard</Badge>
                          <span className="text-[10px] text-teal-600 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full font-medium">No Approval Required</span>
                        </>
                      ) : isApproved
                        ? <Badge variant="success"><CheckCircle size={10} /> Approved</Badge>
                        : isRedesigning
                        ? <Badge variant="warning"><RotateCcw size={10} /> Redesign Requested</Badge>
                        : <Badge variant="warning"><AlertCircle size={10} /> Pending Review</Badge>
                      }
                      {!isAutoApproved && !isRedesigning && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setRedesignSection(s.id); setApprovedSections(prev => prev.filter(id => id !== s.id)) }}
                          >
                            <RotateCcw size={12} /> Redesign
                          </Button>
                          <Button
                            variant={isApproved ? 'ghost' : 'primary'}
                            size="sm"
                            onClick={() => toggleApprove(s.id)}
                          >
                            {isApproved ? 'Unapprove' : 'Approve'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4" onMouseUp={!isAutoApproved ? handleTextSelect : undefined}>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line select-text font-mono">{s.content}</p>
                  </div>

                  {isAutoApproved && (
                    <div className="px-4 py-2.5 bg-teal-50/60 border-t border-teal-100 flex items-center gap-2">
                      <ShieldCheck size={12} className="text-teal-500 shrink-0" />
                      <p className="text-[11px] text-teal-700">Mandatory regulatory clause — automatically included. No Procurement Officer review required.</p>
                    </div>
                  )}

                  {isDynamic && !isRedesigning && (
                    <div className="px-4 py-2.5 bg-violet-50/60 border-t border-violet-100 flex items-center gap-2">
                      <Bot size={12} className="text-violet-500 shrink-0" />
                      <p className="text-[11px] text-violet-700">This section was AI-generated from your project description. Review carefully and use Redesign to refine.</p>
                    </div>
                  )}

                  {isRedesigning && (
                    <div className="px-4 pb-4 pt-3 border-t border-amber-100 bg-amber-50/50">
                      <p className="text-xs font-medium text-amber-700 mb-2">Redesign Instructions for this section</p>
                      <textarea
                        value={redesignNote}
                        onChange={e => setRedesignNote(e.target.value)}
                        placeholder="e.g. 'Make requirements more specific', 'Add a penalty clause', 'Expand on security requirements'..."
                        rows={3}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none mb-2"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRedesignSubmit(s.id)}>
                          <Sparkles size={12} /> Regenerate Section
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setRedesignSection(null); setRedesignNote('') }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}

            {allApproved ? (
              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => setStep(4)}>
                  <UserCheck size={15} /> Submit for Approval
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-right pt-1">
                {reviewableSections.length - approvedSections.length} section(s) remaining to approve before submission
              </p>
            )}
          </div>

          {/* AI Panel */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Bot size={14} className="text-violet-600" />
                AI Assistant
              </h3>
              {selectedText ? (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                    <p className="text-[10px] text-yellow-600 font-semibold uppercase mb-1">Selected Text</p>
                    <p className="text-xs text-slate-600 line-clamp-3">"{selectedText}"</p>
                  </div>
                  <textarea
                    value={aiInstruction}
                    onChange={e => setAiInstruction(e.target.value)}
                    placeholder="e.g. 'Make this more formal', 'Add penalty clause', 'Expand on security requirements'..."
                    rows={4}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                  />
                  <Button variant="ai" size="sm" className="w-full justify-center">
                    <Send size={12} /> Send to AI
                  </Button>
                  <button
                    onClick={() => { setSelectedText(''); setAiInstruction('') }}
                    className="w-full text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear selection
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Highlighter size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Select text in the document to start a targeted AI revision</p>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">AI Suggestions</h3>
              <div className="space-y-2">
                {[
                  'Add force majeure clause to Section 2',
                  'Specify penalty structure for delays',
                  'Include local content % requirement',
                ].map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-100">
                    <Sparkles size={11} className="text-violet-500 mt-0.5 shrink-0" />
                    {suggestion}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Step 4: Pending Approval ── */}
      {step === 4 && !ittApproved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Submission status */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Pending Approval</h3>
                <p className="text-xs text-slate-400">{draftTenderId} submitted for human review</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Submitted By', value: approverName, sub: approverRole },
                { label: 'Submitted On', value: new Date().toISOString().split('T')[0], sub: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' local time' },
                { label: 'Sections Reviewed', value: `${sections.length} of ${sections.length}`, sub: 'All sections approved' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-slate-800">{item.value}</p>
                  {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              Review the ITT summary and approve to publish it to the tender list.
            </div>
          </Card>

          {/* Approver panel */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm shrink-0">
                {approverInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{approverName}</p>
                <p className="text-xs text-slate-400">{approverRole}</p>
              </div>
              <Badge variant="info">Approver</Badge>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">ITT Summary</p>
            <div className="mb-4 space-y-0">
              {[
                { label: 'Tender ID', value: draftTenderId || '—' },
                { label: 'Project', value: form.title },
                { label: 'Budget', value: form.budget },
                { label: 'Department', value: form.department },
                { label: 'Sections', value: `${sections.length} sections · all reviewed` },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Approval Notes (Optional)</label>
              <textarea
                value={approvalNote}
                onChange={e => setApprovalNote(e.target.value)}
                rows={3}
                placeholder="Add comments or conditions before approving..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setStep(3)}>
                Request Changes
              </Button>
              <Button className="flex-1 justify-center" onClick={() => {
                if (draftTenderId) advanceTender(draftTenderId)
                setIttApproved(true)
              }}>
                <CheckCircle size={15} /> {t('itt.approveBtn')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── ITT Created (post-approval) ── */}
      {step === 4 && ittApproved && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <Badge variant="success" className="mb-3">ITT Created</Badge>
          <h2 className="text-xl font-bold text-slate-800 mb-1">ITT Approved & Created</h2>
          <p className="text-slate-500 text-sm mb-1">Approved by {approverName} · {approverRole}</p>
          <p className="text-slate-400 text-xs mb-6">{draftTenderId} — {form.title} is ready to be exported and sent to bidders</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => {
              const tender = tenders.find(t => t.id === draftTenderId) || {
                id: draftTenderId,
                title: form.title,
                department: form.department,
                budget: form.budget,
                deadline: form.deadline,
                description: form.description,
                duration: form.duration,
                stage: 'ITT Created',
                created: new Date().toISOString().split('T')[0],
                bidders: 0,
              }
              exportTenderPDF(tender)
            }}>
              <Download size={15} /> {t('itt.export')}
            </Button>
            <Button onClick={() => navigate('/tenders')}>
              <FileText size={15} /> View in Tender List
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
