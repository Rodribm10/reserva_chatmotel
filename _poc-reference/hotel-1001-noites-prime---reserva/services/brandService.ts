import { supabase } from '../supabaseClient.ts';
import type { Brand, Database, Json } from '../types.ts';
import { pricingService } from './pricingService.ts';

const fromSupabase = (data: any): Brand => ({
  id: data.id,
  name: data.name,
  suite_categories: data.suite_categories || [],
  stay_durations: data.stay_durations || [],
});

export const brandService = {
  async getAllBrands(): Promise<Brand[]> {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) throw new Error(error.message);
    return data.map(fromSupabase);
  },

  async addBrand(newBrand: Omit<Brand, 'id'>): Promise<Brand> {
    const payload: Database['public']['Tables']['brands']['Insert'] = {
      name: newBrand.name,
      suite_categories: newBrand.suite_categories,
      stay_durations: newBrand.stay_durations,
    };
    const { data, error } = await supabase
      .from('brands')
      .insert([payload])
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    const createdBrand = fromSupabase(data);
    // Cria a estrutura de preços para a nova marca
    await pricingService.syncPricingForBrand(createdBrand);
    return createdBrand;
  },

  async updateBrand(updatedBrand: Brand): Promise<Brand> {
    const payload: Database['public']['Tables']['brands']['Update'] = {
      name: updatedBrand.name,
      suite_categories: updatedBrand.suite_categories,
      stay_durations: updatedBrand.stay_durations,
    };
    const { data, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', updatedBrand.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    const brand = fromSupabase(data);
    // Sincroniza a estrutura de preços caso categorias/durações tenham mudado
    await pricingService.syncPricingForBrand(brand);
    return brand;
  },

  async deleteBrand(brandId: number): Promise<void> {
    // A deleção em cascata no DB removerá unidades e preços associados
    const { error } = await supabase.from('brands').delete().eq('id', brandId);
    if (error) throw new Error(error.message);
  },
};