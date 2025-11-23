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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      administradores: {
        Row: {
          ativo: boolean
          celular: string
          created_at: string
          email: string
          id: string
          is_base_admin: boolean
          nome: string
          senha: string | null
          sobrenome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          celular: string
          created_at?: string
          email: string
          id?: string
          is_base_admin?: boolean
          nome: string
          senha?: string | null
          sobrenome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          celular?: string
          created_at?: string
          email?: string
          id?: string
          is_base_admin?: boolean
          nome?: string
          senha?: string | null
          sobrenome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          ativo: boolean
          celular: string
          celular_responsavel: string
          created_at: string
          data_nascimento: string
          email: string
          endereco: string | null
          id: string
          nome: string
          nome_responsavel: string
          sobrenome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          celular: string
          celular_responsavel: string
          created_at?: string
          data_nascimento: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          nome_responsavel: string
          sobrenome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          celular?: string
          celular_responsavel?: string
          created_at?: string
          data_nascimento?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          nome_responsavel?: string
          sobrenome?: string
          updated_at?: string
        }
        Relationships: []
      }
      aulas: {
        Row: {
          aluno1_id: string
          aluno2_id: string | null
          created_at: string
          data: string
          horario: string
          id: string
          observacoes: string | null
          pagamento_confirmado: boolean
          professor_id: string
          sala: string | null
          status: string
          updated_at: string
          valor_aula: number | null
          valor_professor: number | null
        }
        Insert: {
          aluno1_id: string
          aluno2_id?: string | null
          created_at?: string
          data: string
          horario: string
          id?: string
          observacoes?: string | null
          pagamento_confirmado?: boolean
          professor_id: string
          sala?: string | null
          status?: string
          updated_at?: string
          valor_aula?: number | null
          valor_professor?: number | null
        }
        Update: {
          aluno1_id?: string
          aluno2_id?: string | null
          created_at?: string
          data?: string
          horario?: string
          id?: string
          observacoes?: string | null
          pagamento_confirmado?: boolean
          professor_id?: string
          sala?: string | null
          status?: string
          updated_at?: string
          valor_aula?: number | null
          valor_professor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_aluno1_id_fkey"
            columns: ["aluno1_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_aluno2_id_fkey"
            columns: ["aluno2_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          ativo: boolean
          celular: string
          cpf: string
          created_at: string
          data_nascimento: string
          email: string
          endereco: string | null
          id: string
          nome: string
          sobrenome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          celular: string
          cpf: string
          created_at?: string
          data_nascimento: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          sobrenome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          celular?: string
          cpf?: string
          created_at?: string
          data_nascimento?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          sobrenome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "super_admin"
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
  public: {
    Enums: {
      app_role: ["admin", "super_admin"],
    },
  },
} as const
