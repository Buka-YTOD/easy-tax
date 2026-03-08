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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      asset_declarations: {
        Row: {
          asset_type: string
          cost: number
          created_at: string
          current_value: number
          date_acquired: string | null
          description: string | null
          id: string
          location: string
          scenario_id: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          cost?: number
          created_at?: string
          current_value?: number
          date_acquired?: string | null
          description?: string | null
          id?: string
          location?: string
          scenario_id: string
          user_id: string
        }
        Update: {
          asset_type?: string
          cost?: number
          created_at?: string
          current_value?: number
          date_acquired?: string | null
          description?: string | null
          id?: string
          location?: string
          scenario_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_declarations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits_in_kind: {
        Row: {
          annual_value: number
          category: string
          created_at: string
          description: string | null
          id: string
          scenario_id: string
          user_id: string
        }
        Insert: {
          annual_value?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          scenario_id: string
          user_id: string
        }
        Update: {
          annual_value?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          scenario_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_in_kind_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_allowances: {
        Row: {
          allowance_amount: number
          asset_description: string
          cost: number
          created_at: string
          id: string
          rate_percent: number
          scenario_id: string
          user_id: string
          year_acquired: number | null
        }
        Insert: {
          allowance_amount?: number
          asset_description?: string
          cost?: number
          created_at?: string
          id?: string
          rate_percent?: number
          scenario_id: string
          user_id: string
          year_acquired?: number | null
        }
        Update: {
          allowance_amount?: number
          asset_description?: string
          cost?: number
          created_at?: string
          id?: string
          rate_percent?: number
          scenario_id?: string
          user_id?: string
          year_acquired?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "capital_allowances_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_gains: {
        Row: {
          asset_type: string
          cost_basis: number
          created_at: string
          description: string | null
          fees: number
          id: string
          proceeds: number
          realized_at: string | null
          scenario_id: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          cost_basis?: number
          created_at?: string
          description?: string | null
          fees?: number
          id?: string
          proceeds?: number
          realized_at?: string | null
          scenario_id: string
          user_id: string
        }
        Update: {
          asset_type?: string
          cost_basis?: number
          created_at?: string
          description?: string | null
          fees?: number
          id?: string
          proceeds?: number
          realized_at?: string | null
          scenario_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_gains_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      computations: {
        Row: {
          breakdown_json: Json | null
          computed_at: string
          id: string
          scenario_id: string
          tax_owed: number
          taxable_income: number
          total_income: number
          user_id: string
        }
        Insert: {
          breakdown_json?: Json | null
          computed_at?: string
          id?: string
          scenario_id: string
          tax_owed?: number
          taxable_income?: number
          total_income?: number
          user_id: string
        }
        Update: {
          breakdown_json?: Json | null
          computed_at?: string
          id?: string
          scenario_id?: string
          tax_owed?: number
          taxable_income?: number
          total_income?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "computations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: true
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      deductions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          scenario_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          scenario_id: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          scenario_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deductions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          metadata_json: Json | null
          return_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          metadata_json?: Json | null
          return_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          metadata_json?: Json | null
          return_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "tax_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_forms: {
        Row: {
          form_type: string
          generated_at: string
          id: string
          pdf_url: string | null
          scenario_id: string
          status: string
          summary_json: Json | null
          user_id: string
          webhook_received_at: string | null
          webhook_status: string | null
        }
        Insert: {
          form_type?: string
          generated_at?: string
          id?: string
          pdf_url?: string | null
          scenario_id: string
          status?: string
          summary_json?: Json | null
          user_id: string
          webhook_received_at?: string | null
          webhook_status?: string | null
        }
        Update: {
          form_type?: string
          generated_at?: string
          id?: string
          pdf_url?: string | null
          scenario_id?: string
          status?: string
          summary_json?: Json | null
          user_id?: string
          webhook_received_at?: string | null
          webhook_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_forms_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          frequency: string
          id: string
          metadata_json: Json | null
          scenario_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          metadata_json?: Json | null
          scenario_id: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          metadata_json?: Json | null
          scenario_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_records_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "return_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      return_scenarios: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          return_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          return_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          return_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_scenarios_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "tax_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paystack_customer_code: string | null
          paystack_reference: string | null
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_reference?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_reference?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_flags: {
        Row: {
          created_at: string
          flag_type: string
          id: string
          message: string
          metadata_json: Json | null
          resolved: boolean
          resolved_at: string | null
          return_id: string
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          id?: string
          message: string
          metadata_json?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          return_id: string
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          id?: string
          message?: string
          metadata_json?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          return_id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_flags_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "tax_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          employer_address: string
          employer_name: string
          employer_tin: string
          filing_type: string
          id: string
          is_resident: boolean
          lga: string
          marital_status: string
          num_children: number
          occupation: string
          residential_address: string
          return_id: string
          sex: string
          spouse_name: string
          state_of_residence: string
          tin: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          employer_address?: string
          employer_name?: string
          employer_tin?: string
          filing_type?: string
          id?: string
          is_resident?: boolean
          lga?: string
          marital_status?: string
          num_children?: number
          occupation?: string
          residential_address?: string
          return_id: string
          sex?: string
          spouse_name?: string
          state_of_residence?: string
          tin?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          employer_address?: string
          employer_name?: string
          employer_tin?: string
          filing_type?: string
          id?: string
          is_resident?: boolean
          lga?: string
          marital_status?: string
          num_children?: number
          occupation?: string
          residential_address?: string
          return_id?: string
          sex?: string
          spouse_name?: string
          state_of_residence?: string
          tin?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_profiles_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: true
            referencedRelation: "tax_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_returns: {
        Row: {
          created_at: string
          id: string
          status: string
          tax_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          tax_year: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          tax_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
