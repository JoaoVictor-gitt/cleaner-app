import { Link } from 'react-router-dom'
import { CalendarCheck, Inbox, Timer, UserCheck } from 'lucide-react'
import PageHeader from '../../src/components/ui/PageHeader.jsx'
import StatCard from '../../src/components/ui/StatCard.jsx'
import SectionCard from '../../src/components/ui/SectionCard.jsx'
import DataTable from '../../src/components/ui/DataTable.jsx'
import CleaningStatusBadge from '../../src/components/ui/CleaningStatusBadge.jsx'
import EmployeeName from '../../src/components/admin/schedule/EmployeeName.jsx'
import PendingRequestsPanel from '../../src/components/admin/overview/PendingRequestsPanel.jsx'
import { formatAppDateTimeShort } from '../../src/utils/timezone.js'
import { REQUESTS, STATS, UPCOMING } from '../data.js'
import { DemoNote } from '../DemoUi.jsx'

const todayLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Dublin',
}).format(new Date())

const UPCOMING_COLUMNS = [
  { key: 'start', header: 'Data e horário', render: (c) => formatAppDateTimeShort(c.scheduled_start) },
  { key: 'client', header: 'Cliente', render: (c) => <span className="cell-strong">{c.client.full_name}</span> },
  { key: 'service', header: 'Serviço', render: (c) => c.cleaning_type.name },
  { key: 'employee', header: 'Funcionário', render: (c) => <EmployeeName employee={c.employee} /> },
  { key: 'status', header: 'Status', render: (c) => <CleaningStatusBadge status={c.status} /> },
]

function Overview() {
  return (
    <>
      <PageHeader title="Visão Geral" description={`Resumo da operação · ${todayLabel}`} />
      <DemoNote />

      <div className="stat-grid">
        <StatCard icon={CalendarCheck} label="Limpezas hoje" value={STATS.todayCount} caption="Agendadas para hoje" />
        <StatCard
          icon={Inbox}
          label="Solicitações pendentes"
          tone="amber"
          to="/admin/solicitacoes"
          value={REQUESTS.length}
          caption="Aguardando análise"
        />
        <StatCard
          icon={Timer}
          label="Em andamento"
          tone="blue"
          value={STATS.inProgressCount}
          caption="Limpezas sendo realizadas"
        />
        <StatCard
          icon={UserCheck}
          label="Funcionários ativos"
          tone="violet"
          value={STATS.activeEmployeesCount}
          caption="Com acesso ativo"
        />
      </div>

      <div className="overview-grid">
        <SectionCard
          title="Próximas limpezas"
          action={
            <Link to="/admin/agenda" className="text-link">
              Ver agenda
            </Link>
          }
        >
          <DataTable columns={UPCOMING_COLUMNS} rows={UPCOMING} />
        </SectionCard>

        <SectionCard
          title="Solicitações pendentes"
          description={`${REQUESTS.length} aguardando análise`}
          action={
            <Link to="/admin/solicitacoes" className="text-link">
              Ver todas
            </Link>
          }
        >
          <PendingRequestsPanel requests={REQUESTS} />
        </SectionCard>
      </div>
    </>
  )
}

export default Overview
