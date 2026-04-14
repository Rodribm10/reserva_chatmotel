export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  reserva_hotel: {
    Tables: {
      contas_pagamento: {
        Row: {
          ativa: boolean | null
          chave_pix: string
          client_id: string
          client_secret: string
          conta_corrente: string
          created_at: string | null
          id: string
          nome_identificacao: string
          path_crt: string | null
          path_key: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          chave_pix: string
          client_id: string
          client_secret: string
          conta_corrente: string
          created_at?: string | null
          id?: string
          nome_identificacao: string
          path_crt?: string | null
          path_key?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          chave_pix?: string
          client_id?: string
          client_secret?: string
          conta_corrente?: string
          created_at?: string | null
          id?: string
          nome_identificacao?: string
          path_crt?: string | null
          path_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      extras: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          id_marca: string
          imagem_url: string | null
          ordem: number
          preco: number
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          id_marca: string
          imagem_url?: string | null
          ordem?: number
          preco: number
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          id_marca?: string
          imagem_url?: string | null
          ordem?: number
          preco?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extras_id_marca_fkey"
            columns: ["id_marca"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_categoria: {
        Row: {
          alt: string | null
          ativa: boolean
          categoria: string
          created_at: string
          id: string
          id_unidade: string
          ordem: number
          updated_at: string
          url_foto: string
        }
        Insert: {
          alt?: string | null
          ativa?: boolean
          categoria: string
          created_at?: string
          id?: string
          id_unidade: string
          ordem?: number
          updated_at?: string
          url_foto: string
        }
        Update: {
          alt?: string | null
          ativa?: boolean
          categoria?: string
          created_at?: string
          id?: string
          id_unidade?: string
          ordem?: number
          updated_at?: string
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_categoria_id_unidade_fkey"
            columns: ["id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          ativa: boolean | null
          categorias: string[]
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          permanencias: string[]
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          categorias?: string[]
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          permanencias?: string[]
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          categorias?: string[]
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          permanencias?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      precos: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          id_marca: string
          periodo_semana: string
          permanencia: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_marca: string
          periodo_semana?: string
          permanencia: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_marca?: string
          periodo_semana?: string
          permanencia?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "precos_id_marca_fkey"
            columns: ["id_marca"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_extras: {
        Row: {
          created_at: string
          id_extra: string
          id_reserva: string
          preco: number
        }
        Insert: {
          created_at?: string
          id_extra: string
          id_reserva: string
          preco: number
        }
        Update: {
          created_at?: string
          id_extra?: string
          id_reserva?: string
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "reserva_extras_id_extra_fkey"
            columns: ["id_extra"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_extras_id_reserva_fkey"
            columns: ["id_reserva"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_extras_id_reserva_fkey"
            columns: ["id_reserva"]
            isOneToOne: false
            referencedRelation: "vw_reservas_completa"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          chatwoot_contact_id: number | null
          chatwoot_conversation_id: number | null
          chatwoot_pix_charge_id: number | null
          chave_pix_utilizada: string | null
          cpf_cliente: string | null
          created_at: string | null
          data_checkin: string
          data_checkout: string | null
          data_vencimento_pix: string | null
          desconto: number | null
          email_cliente: string | null
          id: string
          id_suite: string
          id_unidade: string
          nome_cliente: string
          numero_pessoas: number | null
          observacoes: string | null
          qr_code_pix: string | null
          status: string
          telefone_cliente: string | null
          tipo_permanencia: string
          txid_pix: string | null
          updated_at: string | null
          valor_reserva: number
          valor_total: number
        }
        Insert: {
          chatwoot_contact_id?: number | null
          chatwoot_conversation_id?: number | null
          chatwoot_pix_charge_id?: number | null
          chave_pix_utilizada?: string | null
          cpf_cliente?: string | null
          created_at?: string | null
          data_checkin: string
          data_checkout?: string | null
          data_vencimento_pix?: string | null
          desconto?: number | null
          email_cliente?: string | null
          id?: string
          id_suite: string
          id_unidade: string
          nome_cliente: string
          numero_pessoas?: number | null
          observacoes?: string | null
          qr_code_pix?: string | null
          status?: string
          telefone_cliente?: string | null
          tipo_permanencia: string
          txid_pix?: string | null
          updated_at?: string | null
          valor_reserva: number
          valor_total: number
        }
        Update: {
          chatwoot_contact_id?: number | null
          chatwoot_conversation_id?: number | null
          chatwoot_pix_charge_id?: number | null
          chave_pix_utilizada?: string | null
          cpf_cliente?: string | null
          created_at?: string | null
          data_checkin?: string
          data_checkout?: string | null
          data_vencimento_pix?: string | null
          desconto?: number | null
          email_cliente?: string | null
          id?: string
          id_suite?: string
          id_unidade?: string
          nome_cliente?: string
          numero_pessoas?: number | null
          observacoes?: string | null
          qr_code_pix?: string | null
          status?: string
          telefone_cliente?: string | null
          tipo_permanencia?: string
          txid_pix?: string | null
          updated_at?: string | null
          valor_reserva?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservas_id_suite_fkey"
            columns: ["id_suite"]
            isOneToOne: false
            referencedRelation: "suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_id_unidade_fkey"
            columns: ["id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      suites: {
        Row: {
          ativa: boolean | null
          capacidade_pessoas: number | null
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          id_api: string | null
          nome: string
          numero: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          capacidade_pessoas?: number | null
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_api?: string | null
          nome: string
          numero?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          capacidade_pessoas?: number | null
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_api?: string | null
          nome?: string
          numero?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suites_unidades: {
        Row: {
          created_at: string | null
          id_suite: string
          id_unidade: string
          prioridade: number | null
        }
        Insert: {
          created_at?: string | null
          id_suite: string
          id_unidade: string
          prioridade?: number | null
        }
        Update: {
          created_at?: string | null
          id_suite?: string
          id_unidade?: string
          prioridade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "suites_unidades_id_suite_fkey"
            columns: ["id_suite"]
            isOneToOne: false
            referencedRelation: "suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suites_unidades_id_unidade_fkey"
            columns: ["id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          ativa: boolean | null
          categorias_visiveis: string[] | null
          chatwoot_unit_id: number | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          id_conta_pagamento: string
          id_marca: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          categorias_visiveis?: string[] | null
          chatwoot_unit_id?: number | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          id_conta_pagamento: string
          id_marca: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          categorias_visiveis?: string[] | null
          chatwoot_unit_id?: number | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          id_conta_pagamento?: string
          id_marca?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_id_conta_pagamento_fkey"
            columns: ["id_conta_pagamento"]
            isOneToOne: false
            referencedRelation: "contas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_id_marca_fkey"
            columns: ["id_marca"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_precos_completa: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string | null
          id: string | null
          id_marca: string | null
          marca_nome: string | null
          periodo_semana: string | null
          permanencia: string | null
          updated_at: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precos_id_marca_fkey"
            columns: ["id_marca"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_reservas_completa: {
        Row: {
          chave_pix_utilizada: string | null
          conta_pagamento_nome: string | null
          cpf_cliente: string | null
          created_at: string | null
          data_checkin: string | null
          data_checkout: string | null
          data_vencimento_pix: string | null
          desconto: number | null
          email_cliente: string | null
          id: string | null
          id_suite: string | null
          id_unidade: string | null
          marca_nome: string | null
          nome_cliente: string | null
          numero_pessoas: number | null
          observacoes: string | null
          qr_code_pix: string | null
          status: string | null
          suite_categoria: string | null
          suite_nome: string | null
          telefone_cliente: string | null
          tipo_permanencia: string | null
          txid_pix: string | null
          unidade_nome: string | null
          updated_at: string | null
          valor_reserva: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_id_suite_fkey"
            columns: ["id_suite"]
            isOneToOne: false
            referencedRelation: "suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_id_unidade_fkey"
            columns: ["id_unidade"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      buscar_preco: {
        Args: {
          p_categoria: string
          p_id_marca: string
          p_periodo?: string
          p_permanencia: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  reserva_hotel: {
    Enums: {},
  },
} as const
