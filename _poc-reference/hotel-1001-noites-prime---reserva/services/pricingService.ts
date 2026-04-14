
import { supabase } from '../supabaseClient.ts';
import type { PricingData, PricingRow, Brand, Database } from '../types.ts';

const DAY_RANGES = ["SEGUNDA A QUARTA", "QUINTA A DOMINGO"];

// Transforma uma lista de linhas de preço do DB em um objeto aninhado para a UI
const transformToPricingData = (rows: PricingRow[]): PricingData => {
  const pricingData: PricingData = {};
  for (const row of rows) {
    if (!pricingData[row.day_range]) {
      pricingData[row.day_range] = {};
    }
    if (!pricingData[row.day_range][row.suite_category]) {
      pricingData[row.day_range][row.suite_category] = {};
    }
    pricingData[row.day_range][row.suite_category][row.duration] = row.price;
  }
  return pricingData;
};

export const pricingService = {
  // Busca os dados de preço de uma marca e formata para a UI
  async getPricingData(brandId: number): Promise<PricingData> {
    const { data, error } = await supabase
      .from('pricing')
      .select('*')
      .eq('brand_id', brandId);
      
    if (error) throw new Error(error.message);
    return transformToPricingData((data as PricingRow[]) || []);
  },

  // Salva (upsert) todos os dados de preço de uma marca
  async savePricingData(brandId: number, data: PricingData): Promise<void> {
    const rowsToUpsert: Database['public']['Tables']['pricing']['Insert'][] = [];
    for (const dayRange in data) {
      for (const category in data[dayRange]) {
        for (const duration in data[dayRange][category]) {
          rowsToUpsert.push({
            brand_id: brandId,
            day_range: dayRange,
            suite_category: category,
            duration: duration,
            price: data[dayRange][category][duration]
          });
        }
      }
    }

    if (rowsToUpsert.length > 0) {
      const { error } = await supabase.from('pricing').upsert(rowsToUpsert, { onConflict: 'brand_id,day_range,suite_category,duration' });
      if (error) throw new Error(error.message);
    }
  },

  // Garante que a estrutura de preços exista para uma marca, criando linhas com preço 0 se necessário
  async syncPricingForBrand(brand: Brand): Promise<void> {
    const rowsToCreate: Database['public']['Tables']['pricing']['Insert'][] = [];
    DAY_RANGES.forEach(dayRange => {
        brand.suite_categories.forEach(category => {
            brand.stay_durations.forEach(duration => {
                rowsToCreate.push({
                    brand_id: brand.id,
                    day_range: dayRange,
                    suite_category: category,
                    duration: duration,
                    price: 0 // Default price
                });
            });
        });
    });

    if (rowsToCreate.length > 0) {
      // 'ignoreDuplicates: true' fará com que o upsert não retorne erro se a linha já existir
      const { error } = await supabase.from('pricing').upsert(rowsToCreate, { onConflict: 'brand_id,day_range,suite_category,duration', ignoreDuplicates: true });
      if (error) {
        console.error("Error syncing pricing data:", error);
        throw new Error(error.message);
      }
    }
    
    // Opcional: remover preços de categorias/durações que não existem mais
    // Esta parte pode ser complexa e requer cuidado para não remover dados indevidamente.
    // Por enquanto, apenas adicionamos novas entradas.
  }
};
