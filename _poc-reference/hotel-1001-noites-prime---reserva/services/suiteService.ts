

import { supabase } from '../supabaseClient.ts';
import type { Suite, Database } from '../types.ts';

// Mapeia os dados do Supabase (snake_case) para o tipo Suite (camelCase)
const fromSupabase = (data: any): Suite => ({
  id: data.id,
  api_id: data.api_id,
  name: data.name,
  category: data.category,
  unitIds: data.unit_ids || [],
});

export const suiteService = {
  async getAllSuites(): Promise<Suite[]> {
    const { data, error } = await supabase.from('suites').select('*').order('name');
    if (error) throw new Error(error.message);
    return data.map(fromSupabase);
  },

  async addSuite(newSuite: Omit<Suite, 'id'>): Promise<Suite> {
    const payload: Database['public']['Tables']['suites']['Insert'] = {
      api_id: newSuite.api_id,
      name: newSuite.name,
      category: newSuite.category,
      unit_ids: newSuite.unitIds,
    };
    const { data, error } = await supabase
      .from('suites')
      .insert([payload])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromSupabase(data);
  },

  async updateSuite(updatedSuite: Suite): Promise<Suite> {
    const payload: Database['public']['Tables']['suites']['Update'] = {
      api_id: updatedSuite.api_id,
      name: updatedSuite.name,
      category: updatedSuite.category,
      unit_ids: updatedSuite.unitIds,
    };
    const { data, error } = await supabase
      .from('suites')
      .update(payload)
      .eq('id', updatedSuite.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromSupabase(data);
  },

  async deleteSuite(suiteId: number): Promise<void> {
    const { error } = await supabase.from('suites').delete().eq('id', suiteId);
    if (error) throw new Error(error.message);
  },

  async getRandomSuiteApiIdFromCategory(category: string, unitId: number): Promise<number | null> {
    // ABORDAGEM ROBUSTA: Primeiro, busca todas as suítes da categoria.
    const { data: suitesInCategory, error } = await supabase
      .from('suites')
      .select('api_id, unit_ids')
      .eq('category', category);

    if (error) {
      console.error("Erro ao buscar suítes por categoria:", error);
      throw new Error(error.message);
    }

    if (!suitesInCategory || suitesInCategory.length === 0) {
      console.warn(`Nenhuma suíte encontrada no banco de dados para a categoria '${category}'.`);
      return null;
    }

    // Segundo, filtra as suítes no código para encontrar as disponíveis na unidade.
    // Isso é mais confiável do que usar filtros complexos de array na query.
    const availableSuites = suitesInCategory.filter(suite =>
      suite.unit_ids && suite.unit_ids.includes(unitId)
    );

    if (availableSuites.length === 0) {
      console.warn(`Nenhuma suíte da categoria '${category}' foi encontrada como disponível para a unidade com ID '${unitId}'. Verifique a coluna 'unit_ids' das suítes cadastradas.`);
      return null;
    }

    // Terceiro, seleciona uma suíte aleatória da lista de disponíveis.
    const randomIndex = Math.floor(Math.random() * availableSuites.length);
    return availableSuites[randomIndex].api_id;
  },
};
