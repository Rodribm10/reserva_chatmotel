import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from '@/hooks/useAppConfig'

interface UseCrudOptions {
  orderBy?: string
  ascending?: boolean
}

// Generic row shape: has `id` and `tenant_id`
export function useCrud<T extends { id: string | number; tenant_id?: number }>(
  tableName: string,
  options: UseCrudOptions = {}
) {
  const tenantId = useTenantId()
  const { orderBy = 'created_at', ascending = false } = options

  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from(tableName)
        .select('*')
        .eq('tenant_id', tenantId)
        .order(orderBy, { ascending })
      if (err) throw new Error(err.message)
      setRows((data ?? []) as T[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [tableName, tenantId, orderBy, ascending])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const create = async (payload: any) => {
    if (!tenantId) throw new Error('Tenant não resolvido')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from(tableName)
      .insert([{ ...payload, tenant_id: tenantId }])
    if (err) throw new Error(err.message)
    await refresh()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = async (id: string | number, payload: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from(tableName)
      .update(payload)
      .eq('id', id)
    if (err) throw new Error(err.message)
    await refresh()
  }

  const remove = async (id: string | number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from(tableName).delete().eq('id', id)
    if (err) throw new Error(err.message)
    await refresh()
  }

  return { rows, loading, error, refresh, create, update, remove, tenantId }
}
