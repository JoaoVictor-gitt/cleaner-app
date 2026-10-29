import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import AdminTopbar from '../src/components/admin/AdminTopbar.jsx'
import BrandMark from '../src/components/ui/BrandMark.jsx'
import { ADMIN_NAV } from '../src/constants/adminNav.js'
import '../src/styles/panel.css'
import './demo.css'

// Mesmo layout e classes do painel administrativo real (AdminLayout/AdminSidebar),
// sem autenticação nem botão de sair. Configurações fica fora da demonstração.
const DEMO_NAV = ADMIN_NAV.filter((item) => item.path !== '/admin/configuracoes')

function DemoSidebar({ open, onClose }) {
  return (
    <aside id="admin-sidebar" className={`admin-sidebar${open ? ' is-open' : ''}`} aria-label="Menu principal">
      <div className="admin-sidebar__header">
        <BrandMark />
        <button type="button" className="icon-button admin-sidebar__close" onClick={onClose} aria-label="Fechar menu">
          <X size={20} />
        </button>
      </div>

      <nav className="admin-nav">
        {DEMO_NAV.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-user">
          <span className="admin-user__avatar" aria-hidden="true">
            A
          </span>
          <div className="admin-user__info">
            <span className="admin-user__email">Administrador</span>
            <span className="admin-user__role">Versão de demonstração</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function DemoLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const [lastPathname, setLastPathname] = useState(pathname)

  // Fecha o menu mobile ao navegar para outra página.
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <div className="panel-shell admin-shell">
      <DemoSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="admin-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="admin-body">
        <AdminTopbar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      <span className="demo-badge" aria-hidden="true">
        Versão de demonstração
      </span>
    </div>
  )
}

export default DemoLayout
