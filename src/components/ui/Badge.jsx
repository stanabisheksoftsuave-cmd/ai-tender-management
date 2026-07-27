const variants = {
  draft:             'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  upload:            'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  evaluation:        'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  tech_eval:         'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  comm_eval:         'bg-violet-50 text-violet-600 ring-1 ring-violet-200',
  parallel_eval:     'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200',
  mgmt_review:       'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200',
  review:            'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  award:             'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed:            'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  success:           'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning:           'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  error:             'bg-red-50 text-red-700 ring-1 ring-red-200',
  ai:                'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  info:              'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  compliant:         'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  partial_compliant: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  non_compliant:     'bg-red-50 text-red-700 ring-1 ring-red-200',
  tech_eval_export:  'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  comm_eval_export:  'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  prequal_stage1:    'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  prequal_stage2:    'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  prequal_stage3:    'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  prequal_stage4:    'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  prequal_final_review: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  prequal_rejected:  'bg-red-50 text-red-700 ring-1 ring-red-200',
  legal_review:      'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200',
  contract_execution:'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  active:            'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  contract_closure:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}

export default function Badge({ variant = 'info', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide whitespace-nowrap ${variants[variant] || variants.info} ${className}`}>
      {children}
    </span>
  )
}
