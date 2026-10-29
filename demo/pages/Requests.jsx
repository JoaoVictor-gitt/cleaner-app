import { useState } from 'react'
import PageHeader from '../../src/components/ui/PageHeader.jsx'
import RequestCard from '../../src/components/admin/requests/RequestCard.jsx'
import { REQUESTS } from '../data.js'
import { DemoNote } from '../DemoUi.jsx'

// Mesmos cartões da tela real. "Analisar solicitação" não abre o formulário
// (escrita no banco): informa que a análise existe na versão completa.
function Requests() {
  const [notice, setNotice] = useState(null)

  return (
    <>
      <PageHeader
        title="Solicitações"
        description={`${REQUESTS.length} solicitações aguardando análise, pela data solicitada.`}
      />
      <DemoNote />

      <div aria-live="polite">
        {notice && (
          <p className="demo-note" role="status">
            {`A análise da solicitação de ${notice} (confirmar, atribuir funcionário ou recusar) está disponível na versão completa.`}
          </p>
        )}
      </div>

      <div className="request-list">
        {REQUESTS.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onAnalyze={(item) => setNotice(item.client?.full_name ?? 'cliente')}
          />
        ))}
      </div>
    </>
  )
}

export default Requests
