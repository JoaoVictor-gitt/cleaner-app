import { CalendarClock, Pencil, Plus, Power, PowerOff } from 'lucide-react'
import PageHeader from '../../src/components/ui/PageHeader.jsx'
import SectionCard from '../../src/components/ui/SectionCard.jsx'
import DataTable from '../../src/components/ui/DataTable.jsx'
import Badge from '../../src/components/ui/Badge.jsx'
import { formatCurrency } from '../../src/utils/format.js'
import { EMPLOYEES } from '../data.js'
import { DemoNote, DisabledAction } from '../DemoUi.jsx'

// Mesmas colunas da tabela real de funcionários; ações desativadas.
const COLUMNS = [
  {
    key: 'name',
    header: 'Funcionário',
    render: (e) => (
      <span className="person-cell">
        <span className="person-cell__dot" style={{ background: e.color }} aria-hidden="true" />
        <span className="person-cell__name">{e.profile.full_name}</span>
      </span>
    ),
  },
  { key: 'phone', header: 'Telefone', render: (e) => e.profile.phone },
  { key: 'hourly_rate', header: 'Valor/hora', render: (e) => formatCurrency(e.hourly_rate) },
  {
    key: 'status',
    header: 'Status',
    render: (e) =>
      e.profile.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="neutral">Inativo</Badge>,
  },
  {
    key: 'actions',
    header: 'Ações',
    render: (e) => (
      <span className="row-actions">
        <DisabledAction icon={CalendarClock} label="Disponibilidade" />
        {e.profile.active ? (
          <DisabledAction icon={PowerOff} label="Desativar" />
        ) : (
          <DisabledAction icon={Power} label="Reativar" />
        )}
        <DisabledAction icon={Pencil} label="Editar" />
      </span>
    ),
  },
]

function Employees() {
  return (
    <>
      <PageHeader
        title="Funcionários"
        description="Equipe responsável pela execução das limpezas."
        actions={<DisabledAction icon={Plus} label="Novo funcionário" variant="btn--primary" />}
      />
      <DemoNote />
      <SectionCard>
        <DataTable columns={COLUMNS} rows={EMPLOYEES} />
      </SectionCard>
    </>
  )
}

export default Employees
