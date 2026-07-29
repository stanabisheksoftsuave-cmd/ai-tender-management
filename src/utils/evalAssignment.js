import { ROLE } from './permissions'

/*
 * Who may work a given side of a tender, and who a returned tender lands with.
 *
 * Ingestion (BidderUpload) names an evaluator per side, and both evaluation
 * queues filter on that name. A tender that reaches an evaluation status without
 * an assignment — a legacy/seed tender, or anything routed straight into
 * tech_eval/comm_eval — was therefore invisible to everyone and permanently
 * stuck, with no screen anywhere that revealed it.
 *
 * The rule below closes that hole: an explicit assignment always wins, but an
 * UNASSIGNED side falls back to the role that owns the evaluation, matching the
 * ROUTE_ROLES grants for '/technical-eval' and '/commercial-eval'. The queue
 * flags such a tender as "Unassigned" so it reads as work to pick up.
 */

const SIDE = {
  tech:  { field: 'assignedTechEval',         role: ROLE.CONTRACT_HOLDER,   ownerLabel: 'Contract Holder' },
  comm:  { field: 'assignedCommEval',         role: ROLE.CONTRACT_ENGINEER, ownerLabel: 'Contract Engineer' },
  // Gate 3 returns to contract drafting rather than an evaluation.
  draft: { field: 'assignedContractEngineer', role: ROLE.CONTRACT_ENGINEER, ownerLabel: 'Contract Engineer' },
}

/** Is this side of the tender waiting for someone to pick it up? */
export const isUnassignedSide = (tender, side) => tender?.[SIDE[side].field]?.id == null

/**
 * May this user evaluate this side? Used for BOTH the queue filter and the hard
 * guard on every evaluation page — they must agree, or a tender ends up listed
 * but unopenable (or the reverse).
 */
export function canEvaluate(tender, side, user) {
  const { field, role } = SIDE[side]
  const assigned = tender?.[field]
  if (assigned?.id != null) return assigned.id === user?.id
  return user?.role?.id === role
}

/**
 * Who a return sends the tender to — the named owner where there is one, else
 * the role that owns the step. Lets the SCM see the destination before returning.
 */
export function returnRecipient(tender, side) {
  if (side === 'both') {
    const tech = returnRecipient(tender, 'tech')
    const comm = returnRecipient(tender, 'comm')
    return {
      name: `${tech.name} & ${comm.name}`,
      roleLabel: `${SIDE.tech.ownerLabel} & ${SIDE.comm.ownerLabel}`,
      unassigned: tech.unassigned || comm.unassigned,
    }
  }
  const def = SIDE[side] || SIDE.comm
  const assigned = tender?.[def.field]
  return assigned?.name
    ? { name: assigned.name, roleLabel: def.ownerLabel, unassigned: false }
    : { name: `Any ${def.ownerLabel}`, roleLabel: def.ownerLabel, unassigned: true }
}
