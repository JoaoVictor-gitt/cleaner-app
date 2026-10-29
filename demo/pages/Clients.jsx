import { Eye } from 'lucide-react'
import PageHeader from '../../src/components/ui/PageHeader.jsx'
import SectionCard from '../../src/components/ui/SectionCard.jsx'
import DataTable from '../../src/components/ui/DataTable.jsx'
import Badge from '../../src/components/ui/Badge.jsx'
import { formatShortDate } from '../../src/utils/date.js'
import { formatAddressLocality } from '../../src/utils/address.js'
import { CLIENTS, clientCleaningCount } from '../data.js'
import { DemoNote, DisabledAction } from '../DemoUi.jsx'

const COLUMNS = [
  { key: 'name', header: 'Cliente', render: (c) => <span className="cell-strong">{c.full_name}</span> },
  { key: 'phone', header: 'Telefone', render: (c) => c.phone },
  { key: 'address', header: 'Endereço principal', render: (c) => formatAddressLocality(c.address) },
  { key: 'cleanings', header: 'Limpezas', render: (c) => clientCleaningCount(c.id) },
  { key: 'since', header: 'Cliente desde', render: (c) => formatShortDate(c.since) },
  {
    key: 'status',
    header: 'Status',
    render: (c) => (c.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="neutral">Inativo</Badge>),
  },
  {
    key: 'actions',
    header: 'Ações',
    render: () => (
      <span className="row-actions">
        <DisabledAction icon={Eye} label="Ver detalhes" />
      </span>
    ),
  },
]

function Clients() {
  return (
    <>
      <PageHeader title="Clientes" description={`${CLIENTS.length} clientes cadastrados.`} />
      <DemoNote />
      <SectionCard>
        <DataTable columns={COLUMNS} rows={CLIENTS} />
      </SectionCard>
    </>
  )
}

export default Clients
