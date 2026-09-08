// Who owns each tender-wide role downstream of wherever it's assigned — the
// Contract Engineer owns the PQQ financial assessment and creates the ITT,
// HSE owns Section C (QHSSE) and ICV owns Section H on the ITT. One group per
// role, each drawn from the active users holding it.
//
// Normally set once at the Contract Initiating Form (ContractStrategy.jsx),
// so PSF, PQQ and ITT Creation just read who owns each side. The one other
// place that renders this same picker is ITT Creation's own "direct ITT" path
// (Contract Holder skipping CIF/PSF entirely) — there's no earlier form to
// have set it, so that page lets the Contract Holder assign it there instead.
export const ASSIGNMENT_GROUPS = [
  {
    key: 'ce',
    roleId: 'pof',
    title: 'Contract Engineers',
    short: 'CE',
    noun: 'Contract Engineers',
    empty: 'No active Contract Engineers',
    note: 'Picks this up for the PQQ financial assessment, PSF and ITT creation.',
    tenderKey: 'assignedContractEngineers',
    singleKey: 'assignedContractEngineer',
  },
  {
    key: 'hse',
    roleId: 'hse',
    title: 'HSE',
    short: 'HSE',
    noun: 'HSE Officers',
    empty: 'No active HSE Officers',
    note: 'Owns Section C — QHSSE Requirements on the ITT.',
    tenderKey: 'assignedHseOfficers',
  },
  {
    key: 'icv',
    roleId: 'icv',
    title: 'ICV',
    short: 'ICV',
    noun: 'ICV Leads',
    empty: 'No active ICV Leads',
    note: 'Owns Section H — ICV Requirements on the ITT.',
    tenderKey: 'assignedIcvLeads',
  },
]
