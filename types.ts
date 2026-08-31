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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      data_points: {
        Row: {
          checked_at: string
          created_at: string
          detail: string | null
          id: string
          is_official: boolean
          label: string
          research_id: string
          section: string
          sort_order: number
          source_title: string | null
          source_url: string | null
          status: string
          subsection: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          checked_at?: string
          created_at?: string
          detail?: string | null
          id?: string
          is_official?: boolean
          label: string
          research_id: string
          section: string
          sort_order?: number
          source_title?: string | null
          source_url?: string | null
          status?: string
          subsection?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          checked_at?: string
          created_at?: string
          detail?: string | null
          id?: string
          is_official?: boolean
          label?: string
          research_id?: string
          section?: string
          sort_order?: number
          source_title?: string | null
          source_url?: string | null
          status?: string
          subsection?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_points_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string
          departments: string[]
          id: string
          kind: string | null
          name: string
          research_id: string
          source_title: string | null
          source_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          departments?: string[]
          id?: string
          kind?: string | null
          name: string
          research_id: string
          source_title?: string | null
          source_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          departments?: string[]
          id?: string
          kind?: string | null
          name?: string
          research_id?: string
          source_title?: string | null
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculties_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          admission_requirements: string | null
          application_deadline: string | null
          application_fee: string | null
          campus: string | null
          created_at: string
          credits: string | null
          department: string | null
          deposit: string | null
          duration: string | null
          english_requirements: string | null
          faculty: string | null
          id: string
          intakes: string | null
          language: string | null
          level: string | null
          name: string
          next_intake: string | null
          other_fees: string | null
          programme_specific_requirements: string | null
          required_documents: string | null
          research_id: string
          scholarships: string | null
          source_title: string | null
          source_url: string | null
          start_date: string | null
          status: string
          study_mode: string | null
          tuition_fee: string | null
          user_id: string
        }
        Insert: {
          admission_requirements?: string | null
          application_deadline?: string | null
          application_fee?: string | null
          campus?: string | null
          created_at?: string
          credits?: string | null
          department?: string | null
          deposit?: string | null
          duration?: string | null
          english_requirements?: string | null
          faculty?: string | null
          id?: string
          intakes?: string | null
          language?: string | null
          level?: string | null
          name: string
          next_intake?: string | null
          other_fees?: string | null
          programme_specific_requirements?: string | null
          required_documents?: string | null
          research_id: string
          scholarships?: string | null
          source_title?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string
          study_mode?: string | null
          tuition_fee?: string | null
          user_id: string
        }
        Update: {
          admission_requirements?: string | null
          application_deadline?: string | null
          application_fee?: string | null
          campus?: string | null
          created_at?: string
          credits?: string | null
          department?: string | null
          deposit?: string | null
          duration?: string | null
          english_requirements?: string | null
          faculty?: string | null
          id?: string
          intakes?: string | null
          language?: string | null
          level?: string | null
          name?: string
          next_intake?: string | null
          other_fees?: string | null
          programme_specific_requirements?: string | null
          required_documents?: string | null
          research_id?: string
          scholarships?: string | null
          source_title?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string
          study_mode?: string | null
          tuition_fee?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_projects: {
        Row: {
          country: string
          created_at: string
          id: string
          intake: string | null
          official_domain: string | null
          progress_note: string | null
          status: string
          student_nationality: string
          study_level: string
          subject: string | null
          university_name: string
          university_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          intake?: string | null
          official_domain?: string | null
          progress_note?: string | null
          status?: string
          student_nationality: string
          study_level: string
          subject?: string | null
          university_name: string
          university_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          intake?: string | null
          official_domain?: string | null
          progress_note?: string | null
          status?: string
          student_nationality?: string
          study_level?: string
          subject?: string | null
          university_name?: string
          university_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      source_pages: {
        Row: {
          category: string | null
          content: string | null
          fetched_at: string
          id: string
          is_official: boolean
          research_id: string
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          fetched_at?: string
          id?: string
          is_official?: boolean
          research_id: string
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          fetched_at?: string
          id?: string
          is_official?: boolean
          research_id?: string
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_pages_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      university_profiles: {
        Row: {
          data: Json
          id: string
          research_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          id?: string
          research_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          id?: string
          research_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_profiles_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: true
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
