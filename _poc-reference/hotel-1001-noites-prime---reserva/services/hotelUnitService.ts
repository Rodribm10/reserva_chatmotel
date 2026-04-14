

import { supabase } from '../supabaseClient.ts';
import type { HotelUnit, Database, Json } from '../types.ts';

// Mapeia os dados do Supabase (snake_case) para o tipo HotelUnit (camelCase)
const fromSupabase = (data: any): HotelUnit => ({
  id: data.id,
  name: data.name,
  brandId: data.brand_id,
  visible_suite_categories: data.visible_suite_categories || [],
  suite_category_images: data.suite_category_images || [],
});

export const hotelUnitService = {
  async getAllUnits(): Promise<HotelUnit[]> {
    const { data, error } = await supabase.from('hotel_units').select('*').order('name');
    if (error) throw new Error(error.message);
    return data.map(fromSupabase);
  },
  
  async getUnitsByBrand(brandId: number): Promise<HotelUnit[]> {
    const { data, error } = await supabase.from('hotel_units').select('*').eq('brand_id', brandId).order('name');
    if (error) throw new Error(error.message);
    return data.map(fromSupabase);
  },

  async addUnit(newUnit: Omit<HotelUnit, 'id'>): Promise<HotelUnit> {
    const payload: Database['public']['Tables']['hotel_units']['Insert'] = {
        name: newUnit.name,
        brand_id: newUnit.brandId,
        visible_suite_categories: newUnit.visible_suite_categories,
        // FIX: Cast to 'unknown' first to satisfy TypeScript's strict type checking for the Json type.
        suite_category_images: newUnit.suite_category_images as unknown as Json,
    };
    const { data, error } = await supabase
      .from('hotel_units')
      .insert([payload])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromSupabase(data);
  },

  async updateUnit(updatedUnit: HotelUnit): Promise<HotelUnit> {
    const payload: Database['public']['Tables']['hotel_units']['Update'] = {
        name: updatedUnit.name,
        brand_id: updatedUnit.brandId,
        visible_suite_categories: updatedUnit.visible_suite_categories,
        // FIX: Cast to 'unknown' first to satisfy TypeScript's strict type checking for the Json type.
        suite_category_images: updatedUnit.suite_category_images as unknown as Json,
    };
    const { data, error } = await supabase
      .from('hotel_units')
      .update(payload)
      .eq('id', updatedUnit.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromSupabase(data);
  },

  async deleteUnit(unitId: number): Promise<void> {
    const { error } = await supabase.from('hotel_units').delete().eq('id', unitId);
    if (error) throw new Error(error.message);
  },
};
