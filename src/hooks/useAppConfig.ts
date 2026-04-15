import { useTenant } from '@/contexts/TenantProvider'

export function useAppConfig() {
  const { context } = useTenant()
  return context?.config ?? null
}

export function useTenantId() {
  const { context } = useTenant()
  return context?.tenant.id ?? null
}
