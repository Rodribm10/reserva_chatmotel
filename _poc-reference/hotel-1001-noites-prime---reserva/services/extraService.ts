
import { ExtraItem } from '../types.ts';

const STORAGE_KEY = 'extrasCatalog';

export const extraService = {
  getExtras(): ExtraItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Erro ao carregar extras:", e);
      return [];
    }
  },

  saveExtras(extras: ExtraItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
    } catch (e) {
      console.error("Erro ao salvar extras:", e);
    }
  },

  addExtra(extra: Omit<ExtraItem, 'id'>): ExtraItem {
    const extras = this.getExtras();
    const newExtra: ExtraItem = {
      ...extra,
      id: crypto.randomUUID(), // Gera um ID único
    };
    const updatedExtras = [...extras, newExtra];
    this.saveExtras(updatedExtras);
    return newExtra;
  },

  updateExtra(updatedExtra: ExtraItem): ExtraItem {
    const extras = this.getExtras();
    const index = extras.findIndex(e => e.id === updatedExtra.id);
    if (index !== -1) {
      extras[index] = updatedExtra;
      this.saveExtras(extras);
      return updatedExtra;
    }
    throw new Error("Extra não encontrado");
  },

  deleteExtra(id: string): void {
    const extras = this.getExtras();
    const updatedExtras = extras.filter(e => e.id !== id);
    this.saveExtras(updatedExtras);
  },
  
  toggleStatus(id: string): ExtraItem | null {
      const extras = this.getExtras();
      const index = extras.findIndex(e => e.id === id);
      if (index !== -1) {
          extras[index].active = !extras[index].active;
          this.saveExtras(extras);
          return extras[index];
      }
      return null;
  }
};
