import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './router'
import { TenantProvider } from '@/contexts/TenantProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TenantProvider>
      <AppRouter />
    </TenantProvider>
  </StrictMode>
)
