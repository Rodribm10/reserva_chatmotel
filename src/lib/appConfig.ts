import { supabase } from './supabase'
import type { Database } from '@/types/database'

export type Tenant = Database['reserva_hotel']['Tables']['tenants']['Row']
export type AppConfig = Database['reserva_hotel']['Tables']['app_config']['Row']

export interface LoadedTenantContext {
  tenant: Tenant
  config: AppConfig
}

export async function loadTenantContext(slug: string): Promise<LoadedTenantContext | null> {
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .maybeSingle()

  if (tenantError) throw new Error(tenantError.message)
  if (!tenant) return null

  const { data: config, error: configError } = await supabase
    .from('app_config')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  if (configError) throw new Error(configError.message)
  if (!config) return null

  return { tenant, config }
}
