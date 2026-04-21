import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import ReservationPage from '@/pages/ReservationPage'
import RoletaPage from '@/pages/RoletaPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AparenciaTab } from '@/pages/admin/AparenciaTab'
import { MarcasTab } from '@/pages/admin/MarcasTab'
import { UnidadesTab } from '@/pages/admin/UnidadesTab'
import { CategoriasTab } from '@/pages/admin/CategoriasTab'
import { PrecosTab } from '@/pages/admin/PrecosTab'
import { FotosTab } from '@/pages/admin/FotosTab'
import { ExtrasTab } from '@/pages/admin/ExtrasTab'
import { ReservasTab } from '@/pages/admin/ReservasTab'
import { RoletaPrizesTab } from '@/pages/admin/RoletaPrizesTab'

const router = createBrowserRouter([
  { path: '/', element: <ReservationPage /> },
  { path: '/roleta/:token', element: <RoletaPage /> },
  { path: '/admin/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="aparencia" replace /> },
      { path: 'aparencia', element: <AparenciaTab /> },
      { path: 'marcas', element: <MarcasTab /> },
      { path: 'unidades', element: <UnidadesTab /> },
      { path: 'categorias', element: <CategoriasTab /> },
      { path: 'precos', element: <PrecosTab /> },
      { path: 'fotos', element: <FotosTab /> },
      { path: 'extras', element: <ExtrasTab /> },
      { path: 'reservas', element: <ReservasTab /> },
      { path: 'roleta', element: <RoletaPrizesTab /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
