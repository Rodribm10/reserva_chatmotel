import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import ReservationPage from '@/pages/ReservationPage'
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

const router = createBrowserRouter([
  { path: '/', element: <ReservationPage /> },
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
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
