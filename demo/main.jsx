// Versão de DEMONSTRAÇÃO estática do CleanerApp: somente telas com dados
// fictícios. Sem autenticação, sem Supabase e sem chamadas de rede.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import '../src/styles/index.css'
import DemoLayout from './DemoLayout.jsx'
import Overview from './pages/Overview.jsx'
import Agenda from './pages/Agenda.jsx'
import Requests from './pages/Requests.jsx'
import Clients from './pages/Clients.jsx'
import Employees from './pages/Employees.jsx'
import Services from './pages/Services.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<DemoLayout />}>
          <Route index element={<Overview />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="solicitacoes" element={<Requests />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="funcionarios" element={<Employees />} />
          <Route path="servicos" element={<Services />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
