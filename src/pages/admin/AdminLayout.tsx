import { NavLink, Outlet } from 'react-router-dom'
import { AuthGate } from '@/components/admin/AuthGate'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const TABS = [{ to: 'aparencia', label: 'Aparência' }]

export function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-champagne/20 bg-midnight/60 backdrop-blur px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl text-champagne">Painel Administrativo</h1>
          <div className="flex items-center gap-3 text-sm text-slate">
            <span>{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </header>
        <nav className="border-b border-champagne/10 bg-obsidian/60 px-6 py-3 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-sans transition ${
                  isActive
                    ? 'bg-champagne text-obsidian font-semibold'
                    : 'text-ivory hover:bg-champagne/10'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 p-6 md:p-10">
          <Outlet />
        </div>
      </div>
    </AuthGate>
  )
}
