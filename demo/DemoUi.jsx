import { Info } from 'lucide-react'

export const FULL_VERSION_LABEL = 'Disponível na versão completa'

// Ação que depende do banco: sempre desativada, com a indicação no título e no
// nome acessível (nunca parece funcionar sem fazer nada).
export function DisabledAction({ icon: Icon, label, variant = 'btn--ghost' }) {
  return (
    <button
      type="button"
      className={`btn ${variant}`}
      disabled
      title={FULL_VERSION_LABEL}
      aria-label={`${label} (${FULL_VERSION_LABEL.toLowerCase()})`}
    >
      {Icon && <Icon size={15} aria-hidden="true" />}
      {label}
    </button>
  )
}

// Aviso discreto no topo de cada tela.
export function DemoNote({ children = 'Dados fictícios. Ações de cadastro e edição estão disponíveis na versão completa.' }) {
  return (
    <p className="demo-note">
      <Info size={15} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
