import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import ReservationPage from '@/pages/ReservationPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AparenciaTab } from '@/pages/admin/AparenciaTab'

const router = createBrowserRouter([
  { path: '/', element: <ReservationPage /> },
  { path: '/admin/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="aparencia" replace /> },
      { path: 'aparencia', element: <AparenciaTab /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
