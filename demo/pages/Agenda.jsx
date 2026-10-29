import { useState } from 'react'
import { CalendarX, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import PageHeader from '../../src/components/ui/PageHeader.jsx'
import SectionCard from '../../src/components/ui/SectionCard.jsx'
import CleaningStatusBadge from '../../src/components/ui/CleaningStatusBadge.jsx'
import EmployeeName from '../../src/components/admin/schedule/EmployeeName.jsx'
import AgendaDayView from '../../src/components/agenda/AgendaDayView.jsx'
import AgendaWeekView from '../../src/components/agenda/AgendaWeekView.jsx'
import AgendaMonthView from '../../src/components/agenda/AgendaMonthView.jsx'
import {
  formatDayLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  monthGrid,
  shiftDays,
  shiftMonths,
  startOfMonth,
  weekDays,
} from '../../src/utils/calendar.js'
import { appDateOf, formatAppDateTimeShort, formatAppTime, todayInAppZone } from '../../src/utils/timezone.js'
import { formatAddressLocality } from '../../src/utils/address.js'
import { formatCurrency } from '../../src/utils/format.js'
import { CLEANINGS } from '../data.js'
import { DemoNote, DisabledAction } from '../DemoUi.jsx'

// Mesma barra e visões (Dia/Semana/Mês) da agenda real, com dados fictícios em
// memória (sem consulta). Clicar numa limpeza mostra seus detalhes, somente leitura.
const VIEWS = [
  { value: 'day', label: 'Dia', prev: 'Dia anterior', next: 'Próximo dia' },
  { value: 'week', label: 'Semana', prev: 'Semana anterior', next: 'Próxima semana' },
  { value: 'month', label: 'Mês', prev: 'Mês anterior', next: 'Próximo mês' },
]

const EVENTS_BY_DAY = CLEANINGS.reduce((groups, cleaning) => {
  const day = appDateOf(cleaning.scheduled_start)
  ;(groups[day] ??= []).push(cleaning)
  return groups
}, {})

function shiftReference(view, referenceDate, direction) {
  if (view === 'day') return shiftDays(referenceDate, direction)
  if (view === 'week') return shiftDays(referenceDate, 7 * direction)
  return shiftMonths(startOfMonth(referenceDate), direction)
}

function periodLabel(view, referenceDate) {
  if (view === 'day') return formatDayLabel(referenceDate)
  if (view === 'week') return formatWeekRangeLabel(referenceDate)
  return formatMonthLabel(referenceDate)
}

function Item({ label, children, wide }) {
  return (
    <div className={`field-grid__item${wide ? ' field-grid__item--wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function CleaningDetails({ cleaning, onClose }) {
  const { address } = cleaning
  return (
    <SectionCard
      title={`${cleaning.cleaning_type.name} · ${cleaning.client.full_name}`}
      description={`${formatAppDateTimeShort(cleaning.scheduled_start)} – ${formatAppTime(cleaning.scheduled_end)}`}
      action={
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Fechar detalhes
        </button>
      }
    >
      <dl className="field-grid field-grid--compact">
        <Item label="Status">
          <CleaningStatusBadge status={cleaning.status} />
        </Item>
        <Item label="Preço">{formatCurrency(cleaning.price)}</Item>
        <Item label="Funcionário">
          <EmployeeName employee={cleaning.employee} />
        </Item>
        <Item label="Telefone do cliente">{cleaning.client.phone}</Item>
        <Item label="Endereço" wide>
          {address.label && <strong>{address.label} · </strong>}
          {address.address_line_1}
          {address.address_line_2 ? `, ${address.address_line_2}` : ''}, {formatAddressLocality(address)}
        </Item>
      </dl>
      <div className="demo-actions">
        <DisabledAction icon={CalendarX} label="Cancelar limpeza" variant="btn--secondary" />
        <DisabledAction icon={Pencil} label="Editar agendamento" variant="btn--primary" />
      </div>
    </SectionCard>
  )
}

function Agenda() {
  const [view, setView] = useState('week')
  const [referenceDate, setReferenceDate] = useState(() => todayInAppZone())
  const [selected, setSelected] = useState(null)
  const today = todayInAppZone()
  const current = VIEWS.find((option) => option.value === view)

  function openDay(day) {
    setView('day')
    setReferenceDate(day)
  }

  let body
  if (view === 'day') {
    body = (
      <AgendaDayView
        events={EVENTS_BY_DAY[referenceDate] ?? []}
        emptyMessage="Nenhuma limpeza agendada para este dia."
        showEmployee
        onSelectEvent={setSelected}
      />
    )
  } else if (view === 'week') {
    body = (
      <AgendaWeekView
        days={weekDays(referenceDate)}
        eventsByDay={EVENTS_BY_DAY}
        today={today}
        showEmployee
        onSelectEvent={setSelected}
      />
    )
  } else {
    body = (
      <AgendaMonthView
        weeks={monthGrid(referenceDate)}
        referenceDate={referenceDate}
        eventsByDay={EVENTS_BY_DAY}
        today={today}
        onSelectDay={openDay}
      />
    )
  }

  return (
    <>
      <PageHeader title="Agenda" description="Limpezas agendadas da equipe." />
      <DemoNote>Dados fictícios. Clique em uma limpeza para ver os detalhes.</DemoNote>

      <SectionCard className="agenda">
        <div className="agenda__toolbar">
          <div className="agenda__nav">
            <button
              type="button"
              className="btn btn--secondary agenda-nav__button"
              onClick={() => setReferenceDate((d) => shiftReference(view, d, -1))}
              aria-label={current.prev}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span className="agenda-nav__label">{current.prev}</span>
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => setReferenceDate(todayInAppZone())}>
              Hoje
            </button>
            <button
              type="button"
              className="btn btn--secondary agenda-nav__button"
              onClick={() => setReferenceDate((d) => shiftReference(view, d, 1))}
              aria-label={current.next}
            >
              <span className="agenda-nav__label">{current.next}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <span className="agenda__period" aria-live="polite">
              {periodLabel(view, referenceDate)}
            </span>
          </div>

          <div className="segmented" role="group" aria-label="Visualização">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`segmented__option${view === option.value ? ' is-active' : ''}`}
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="agenda__body">{body}</div>
      </SectionCard>

      {selected && <CleaningDetails key={selected.id} cleaning={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export default Agenda
