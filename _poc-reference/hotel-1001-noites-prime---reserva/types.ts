
// Estrutura para Marcas (Redes)
export interface Brand {
  id: number;
  name: string;
  suite_categories: string[];
  stay_durations: string[];
}

// Estrutura para associar categoria de suíte com imagem
export interface SuiteCategoryImage {
  category: string;
  imageUrls: string[]; // Agora um array para suportar múltiplas imagens
}

// Estrutura para Unidades de Hotel, agora com relacionamento de marca e imagens
export interface HotelUnit {
  id: number;
  name: string;
  brandId: number;
  visible_suite_categories: string[];
  suite_category_images: SuiteCategoryImage[] | null;
}

// Modelo para Itens Extras
export interface ExtraItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  tag?: string;
  active: boolean;
  order: number;
}

export interface FormDataModel {
  nome: string;
  checkInDateTime: string;
  telefone: string;
  email: string;
  cpf: string;
  observacao: string;
  selectedBrand: string; // ID da marca
  selectedUnit: string; // ID da unidade
  selectedCategory: string; // Nome da categoria
  stayDuration: string; // Nome da duração
  selectedExtras: string[]; // IDs dos extras selecionados
}

// Payload para a API (webhook N8N) - AGORA EM SNAKE_CASE
export interface ApiPostPayload {
  suite_id: number;
  data_inicio: string; // Formato ISO
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  integracao_id: string;
  modo: number;
  observacoes: string;
  marca: string; // Nome da marca
  unidade: string; // Nome da unidade
  categoria: string; // Nome da categoria
  permanencia: string; // Nome da duração
  valor: number; // Preço da reserva
  extras_selecionados?: ExtraItem[]; // Lista de objetos extras
}

export type SubmissionStatusType = 'success' | 'error' | null;

export interface SubmissionState {
  message: string;
  type: SubmissionStatusType;
  pix?: {
    qrCodeValue: string;
    copyPasteCode: string;
    txid: string; // The transaction ID for payment verification
  };
}

// Resposta esperada do webhook
export interface N8nApiResponse {
  pixCopiaECola: string;
  pixUrl: string;
  txid: string; // The transaction ID for payment verification
}

// Estrutura para Suítes
export interface Suite {
  id: number; // PK do banco de dados
  api_id: number; // ID para a API externa
  name: string;
  category: string;
  unitIds: number[]; // IDs das unidades onde a suíte está disponível
}

// Estrutura para a tabela de preços, usada pela UI
export interface PricingData {
  [dayRange: string]: {
    [category: string]: {
      [duration: string]: number;
    };
  };
}

// Estrutura para uma linha da tabela de preços no banco de dados
export interface PricingRow {
    id: number;
    brand_id: number;
    day_range: string;
    suite_category: string;
    duration: string;
    price: number;
}


// --- Supabase Database Schema ---

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          id: number
          name: string
          suite_categories: string[]
          stay_durations: string[]
        }
        Insert: {
          id?: number
          name: string
          suite_categories: string[]
          stay_durations: string[]
        }
        Update: {
          id?: number
          name?: string
          suite_categories?: string[]
          stay_durations?: string[]
        }
        Relationships: []
      }
      hotel_units: {
        Row: {
          id: number
          name: string
          brand_id: number
          visible_suite_categories: string[] | null
          suite_category_images: Json | null
        }
        Insert: {
          id?: number
          name: string
          brand_id: number
          visible_suite_categories?: string[] | null
          suite_category_images?: Json | null
        }
        Update: {
          id?: number
          name?: string
          brand_id?: number
          visible_suite_categories?: string[] | null
          suite_category_images?: Json | null
        }
        Relationships: []
      }
      suites: {
        Row: {
          id: number
          api_id: number
          name: string
          category: string
          unit_ids: number[] | null
        }
        Insert: {
          id?: number
          api_id: number
          name: string
          category: string
          unit_ids?: number[] | null
        }
        Update: {
          id?: number
          api_id?: number
          name?: string
          category?: string
          unit_ids?: number[] | null
        }
        Relationships: []
      }
      pricing: {
        Row: {
          id: number
          brand_id: number
          day_range: string
          suite_category: string
          duration: string
          price: number
        }
        Insert: {
          id?: number
          brand_id: number
          day_range: string
          suite_category: string
          duration: string
          price: number
        }
        Update: {
          id?: number
          brand_id?: number
          day_range?: string
          suite_category?: string
          duration?: string
          price?: number
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
