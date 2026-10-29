import { Pencil, Plus, Power, PowerOff } from 'lucide-react'
import PageHeader from '../../src/components/ui/PageHeader.jsx'
import SectionCard from '../../src/components/ui/SectionCard.jsx'
import DataTable from '../../src/components/ui/DataTable.jsx'
import Badge from '../../src/components/ui/Badge.jsx'
import { formatCurrency, formatDuration } from '../../src/utils/format.js'
import { SERVICES } from '../data.js'
import { DemoNote, DisabledAction } from '../DemoUi.jsx'

// Mesmas colunas da tabela real de serviços; ações desativadas.
const COLUMNS = [
  { key: 'name', header: 'Serviço', render: (s) => <span className="cell-strong">{s.name}</span> },
  {
    key: 'description',
    header: 'Descrição',
    render: (s) => (
      <span className="cell-truncate" title={s.description}>
        {s.description}
      </span>
    ),
  },
  { key: 'duration', header: 'Duração', render: (s) => formatDuration(s.default_duration_minutes) },
  { key: 'price', header: 'Preço base', render: (s) => formatCurrency(s.base_price) },
  {
    key: 'status',
    header: 'Status',
    render: (s) => (s.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="neutral">Inativo</Badge>),
  },
  {
    key: 'actions',
    header: 'Ações',
    render: (s) => (
      <span className="row-actions">
        <DisabledAction icon={Pencil} label="Editar" />
        {s.active ? (
          <DisabledAction icon={PowerOff} label="Desativar" />
        ) : (
          <DisabledAction icon={Power} label="Ativar" />
        )}
      </span>
    ),
  },
]

function Services() {
  return (
    <>
      <PageHeader
        title="Serviços"
        description="Gerencie os tipos de limpeza oferecidos aos clientes."
        actions={<DisabledAction icon={Plus} label="Novo serviço" variant="btn--primary" />}
      />
      <DemoNote />
      <SectionCard>
        <DataTable columns={COLUMNS} rows={SERVICES} />
      </SectionCard>
    </>
  )
}

export default Services
