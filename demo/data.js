// Dados FICTÍCIOS da versão de demonstração. Nomes, telefones e endereços são
// inventados; nada vem do banco. As datas são relativas a "hoje" (Dublin), para
// a agenda e o painel nunca ficarem vazios.
import { shiftDays } from '../src/utils/calendar.js'
import { appDateOf, todayInAppZone, zonedToUtcISO } from '../src/utils/timezone.js'

const today = todayInAppZone()
const dayAt = (offset) => shiftDays(today, offset)
const instant = (offset, time) => zonedToUtcISO(dayAt(offset), time)

export const SERVICES = [
  { id: 's1', name: 'Limpeza padrão', description: 'Limpeza regular de todos os cômodos.', default_duration_minutes: 120, base_price: 70, active: true },
  { id: 's2', name: 'Limpeza profunda', description: 'Inclui armários, forno e áreas de difícil acesso.', default_duration_minutes: 240, base_price: 140, active: true },
  { id: 's3', name: 'Pós-obra', description: 'Remoção de poeira e resíduos após reformas.', default_duration_minutes: 300, base_price: 190, active: true },
  { id: 's4', name: 'Fim de contrato', description: 'Limpeza completa para entrega do imóvel.', default_duration_minutes: 240, base_price: 160, active: false },
]

export const EMPLOYEES = [
  { id: 'e1', color: '#0e7490', hourly_rate: 16, profile: { full_name: 'Aoife Byrne', phone: '+353 83 000 1101', active: true } },
  { id: 'e2', color: '#7c3aed', hourly_rate: 15.5, profile: { full_name: 'Mariana Costa', phone: '+353 85 000 2202', active: true } },
  { id: 'e3', color: '#d97706', hourly_rate: 15, profile: { full_name: 'Ciarán Walsh', phone: '+353 87 000 3303', active: true } },
  { id: 'e4', color: '#64748b', hourly_rate: 14.5, profile: { full_name: 'Tomás Doyle', phone: '+353 86 000 4404', active: false } },
]

const ADDRESSES = {
  a1: { label: 'Casa', address_line_1: '12 Exemplo Road', address_line_2: null, city: 'Dublin', county: 'Dublin', eircode: 'D04 X0X1' },
  a2: { label: 'Apartamento', address_line_1: '5 Demo Street', address_line_2: 'Apt 3', city: 'Dublin', county: 'Dublin', eircode: 'D08 X0X2' },
  a3: { label: 'Casa', address_line_1: '27 Fictícia Avenue', address_line_2: null, city: 'Cork', county: 'Cork', eircode: 'T12 X0X3' },
  a4: { label: 'Escritório', address_line_1: '3 Modelo Lane', address_line_2: 'Unit 4', city: 'Galway', county: 'Galway', eircode: 'H91 X0X4' },
  a5: { label: 'Casa', address_line_1: '88 Amostra Park', address_line_2: null, city: 'Dublin', county: 'Dublin', eircode: 'D15 X0X5' },
  a6: { label: 'Casa', address_line_1: '14 Teste Crescent', address_line_2: null, city: 'Limerick', county: 'Limerick', eircode: 'V94 X0X6' },
}

export const CLIENTS = [
  { id: 'c1', full_name: 'Siobhán Murphy', phone: '+353 83 100 0001', active: true, address: ADDRESSES.a1, since: dayAt(-120) },
  { id: 'c2', full_name: 'Patrick O’Brien', phone: '+353 85 100 0002', active: true, address: ADDRESSES.a2, since: dayAt(-95) },
  { id: 'c3', full_name: 'Emma Kelly', phone: '+353 87 100 0003', active: true, address: ADDRESSES.a3, since: dayAt(-60) },
  { id: 'c4', full_name: 'Ana Ferreira', phone: '+353 86 100 0004', active: true, address: ADDRESSES.a4, since: dayAt(-41) },
  { id: 'c5', full_name: 'Liam Ryan', phone: '+353 83 100 0005', active: true, address: ADDRESSES.a5, since: dayAt(-20) },
  { id: 'c6', full_name: 'Declan Moore', phone: '+353 85 100 0006', active: false, address: ADDRESSES.a6, since: dayAt(-200) },
]

const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]))
const employeeById = byId(EMPLOYEES)
const clientById = byId(CLIENTS)
const serviceById = byId(SERVICES)

function cleaning(id, { client, service, employee = null, status, day, start, minutes }) {
  const c = clientById[client]
  const s = serviceById[service]
  const e = employee ? employeeById[employee] : null
  const startISO = instant(day, start)
  return {
    id,
    status,
    scheduled_start: startISO,
    scheduled_end: new Date(Date.parse(startISO) + (minutes ?? s.default_duration_minutes) * 60000).toISOString(),
    client: { full_name: c.full_name, phone: c.phone },
    cleaning_type: { name: s.name },
    address: c.address,
    employee: e ? { id: e.id, color: e.color, profile: { full_name: e.profile.full_name } } : null,
    price: s.base_price,
  }
}

// Limpezas agendadas (Agenda, Visão Geral): passado recente, hoje e próximos dias.
export const CLEANINGS = [
  cleaning('k01', { client: 'c1', service: 's1', employee: 'e1', status: 'completed', day: -6, start: '09:00' }),
  cleaning('k02', { client: 'c3', service: 's2', employee: 'e2', status: 'completed', day: -5, start: '10:00' }),
  cleaning('k03', { client: 'c2', service: 's1', employee: 'e3', status: 'completed', day: -3, start: '14:00' }),
  cleaning('k04', { client: 'c4', service: 's1', employee: 'e1', status: 'completed', day: -2, start: '09:30' }),
  cleaning('k05', { client: 'c5', service: 's3', employee: 'e2', status: 'completed', day: -1, start: '08:30' }),
  cleaning('k06', { client: 'c1', service: 's1', employee: 'e1', status: 'in_progress', day: 0, start: '09:00' }),
  cleaning('k07', { client: 'c3', service: 's2', employee: 'e2', status: 'on_the_way', day: 0, start: '11:00' }),
  cleaning('k08', { client: 'c2', service: 's1', employee: 'e3', status: 'assigned', day: 0, start: '15:00' }),
  cleaning('k09', { client: 'c4', service: 's1', employee: 'e1', status: 'assigned', day: 1, start: '10:00' }),
  cleaning('k10', { client: 'c5', service: 's2', status: 'confirmed', day: 1, start: '13:00' }),
  cleaning('k11', { client: 'c1', service: 's1', employee: 'e2', status: 'assigned', day: 2, start: '09:00' }),
  cleaning('k12', { client: 'c2', service: 's3', employee: 'e3', status: 'assigned', day: 3, start: '08:30' }),
  cleaning('k13', { client: 'c3', service: 's1', employee: 'e1', status: 'assigned', day: 4, start: '14:00' }),
  cleaning('k14', { client: 'c4', service: 's2', status: 'confirmed', day: 5, start: '10:00' }),
  cleaning('k15', { client: 'c5', service: 's1', employee: 'e2', status: 'assigned', day: 7, start: '09:30' }),
  cleaning('k16', { client: 'c1', service: 's1', employee: 'e3', status: 'assigned', day: 9, start: '11:00' }),
  cleaning('k17', { client: 'c3', service: 's2', employee: 'e1', status: 'assigned', day: 12, start: '09:00' }),
  cleaning('k18', { client: 'c2', service: 's1', employee: 'e2', status: 'assigned', day: 15, start: '13:30' }),
].sort((a, b) => Date.parse(a.scheduled_start) - Date.parse(b.scheduled_start))

// Solicitações pendentes (status = requested), no formato lido por RequestCard.
function request(id, { client, service, day, time, property, bedrooms, bathrooms, notes, createdDaysAgo }) {
  const c = clientById[client]
  const s = serviceById[service]
  return {
    id,
    status: 'requested',
    requested_date: dayAt(day),
    requested_time: `${time}:00`,
    property_type: property,
    bedrooms,
    bathrooms,
    client_notes: notes,
    estimated_duration_minutes: s.default_duration_minutes,
    created_at: instant(-createdDaysAgo, '10:15'),
    client: { full_name: c.full_name, phone: c.phone },
    address: c.address,
    cleaning_type: { name: s.name, base_price: s.base_price },
  }
}

export const REQUESTS = [
  request('r1', { client: 'c5', service: 's1', day: 2, time: '10:00', property: 'apartment', bedrooms: 2, bathrooms: 1, notes: 'Tenho um gato; por favor, manter a porta da varanda fechada.', createdDaysAgo: 1 }),
  request('r2', { client: 'c2', service: 's2', day: 3, time: '14:00', property: 'house', bedrooms: 3, bathrooms: 2, notes: null, createdDaysAgo: 1 }),
  request('r3', { client: 'c4', service: 's3', day: 6, time: '09:00', property: 'other', bedrooms: 0, bathrooms: 1, notes: 'Escritório recém-reformado, bastante poeira.', createdDaysAgo: 0 }),
  request('r4', { client: 'c1', service: 's1', day: 8, time: '11:30', property: 'house', bedrooms: 4, bathrooms: 2, notes: 'Chave com o vizinho do número 14.', createdDaysAgo: 0 }),
]

// Contagens derivadas (mesmas regras do painel real: "hoje" = início hoje em
// Dublin, exceto canceladas; "em andamento" = in_progress).
const SCHEDULED = ['confirmed', 'assigned', 'on_the_way', 'in_progress']

export const STATS = {
  todayCount: CLEANINGS.filter((c) => c.status !== 'cancelled' && appDateOf(c.scheduled_start) === today).length,
  inProgressCount: CLEANINGS.filter((c) => c.status === 'in_progress').length,
  activeEmployeesCount: EMPLOYEES.filter((e) => e.profile.active).length,
}

export const UPCOMING = CLEANINGS.filter(
  (c) => SCHEDULED.includes(c.status) && Date.parse(c.scheduled_end) >= Date.now(),
).slice(0, 6)

export function clientCleaningCount(clientId) {
  const name = clientById[clientId]?.full_name
  return CLEANINGS.filter((c) => c.client.full_name === name).length
}
