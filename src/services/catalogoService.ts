import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Marca = Database['reserva_hotel']['Tables']['marcas']['Row']
type Unidade = Database['reserva_hotel']['Tables']['unidades']['Row']
type Preco = Database['reserva_hotel']['Tables']['precos']['Row']
type Foto = Database['reserva_hotel']['Tables']['fotos_categoria']['Row']
type Extra = Database['reserva_hotel']['Tables']['extras']['Row']

export const catalogoService = {
  async listMarcas(): Promise<Marca[]> {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('ativa', true)
      .order('nome')
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async listUnidades(marcaId: string): Promise<Unidade[]> {
    const { data, error } = await supabase
      .from('unidades')
      .select('*')
      .eq('id_marca', marcaId)
      .eq('ativa', true)
      .order('nome')
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async findPreco(
    marcaId: string,
    categoria: string,
    permanencia: string,
    periodo = 'default'
  ): Promise<Preco | null> {
    const { data, error } = await supabase
      .from('precos')
      .select('*')
      .eq('id_marca', marcaId)
      .eq('categoria', categoria)
      .eq('permanencia', permanencia)
      .eq('periodo_semana', periodo)
      .eq('ativo', true)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async listFotos(unidadeId: string, categoria: string): Promise<Foto[]> {
    const { data, error } = await supabase
      .from('fotos_categoria')
      .select('*')
      .eq('id_unidade', unidadeId)
      .eq('categoria', categoria)
      .eq('ativa', true)
      .order('ordem')
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async listExtras(marcaId: string): Promise<Extra[]> {
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('id_marca', marcaId)
      .eq('ativo', true)
      .order('ordem')
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
