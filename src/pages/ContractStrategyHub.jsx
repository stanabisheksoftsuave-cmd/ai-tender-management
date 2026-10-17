import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CheckCircle, Clock } from 'lucide-react'
import { useTenders } from '../context/TenderContext'
import { AiSystemStatusCard, HeroPanel, HubStatCard } from '../components/shell/HubPanels'
import HubTenderTrackingTable from '../components/shell/HubTenderTrackingTable'
import { HUB_ACTIVE_STATUSES, HUB_REVIEW_STATUSES, countByStatuses, hubTenders } from '../components/shell/hubData'

/*
 * Contract Strategy hub (/strategy-hub) — the main app's
 * contract-holder/contract-strategy/page.tsx: hero, three stat cards, AI
 * system status and the Tender Tracking card. Driven by the real tenders
 * (TenderContext), not the main app's mock board.
 */
const NEW_CIF_ROUTE = '/contract-strategy/new'

export default function ContractStrategyHub() {
  const navigate = useNavigate()
  const { tenders } = useTenders()
  const board = useMemo(() => hubTenders(tenders), [tenders])

  const activeCount = countByStatuses(board, HUB_ACTIVE_STATUSES)
  const reviewCount = countByStatuses(board, HUB_REVIEW_STATUSES)
  const awardCount = countByStatuses(board, ['award'])

  // Hero / "New" actions — always a blank Contract Initiating Form.
  const openNewCif = () => navigate(NEW_CIF_ROUTE)

  return (
    <div className="space-y-6">
      <HeroPanel onStartStrategy={openNewCif} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <HubStatCard label="Active Strategies" value={activeCount} hint="In Progress"        icon={Activity}    tone="primary" />
        <HubStatCard label="Pending Review"    value={reviewCount} hint="Awaiting Approvals" icon={Clock}       tone="warning" />
        <HubStatCard label="Completed"         value={awardCount}  hint="This Quarter"       icon={CheckCircle} tone="success" />
      </section>

      <AiSystemStatusCard tenders={board} />

      <HubTenderTrackingTable tenders={board} onNewCif={openNewCif} onNavigate={navigate} />
    </div>
  )
}
