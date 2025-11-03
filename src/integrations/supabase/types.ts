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
      activity_reports: {
        Row: {
          activity_id: string
          completed_at: string | null
          id: string
          metadata: Json | null
          score: number | null
          time_spent_sec: number
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          time_spent_sec: number
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          time_spent_sec?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_reports_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "study_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          created_at: string | null
          grade: string | null
          id: string
          messages: Json | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          grade?: string | null
          id?: string
          messages?: Json | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          grade?: string | null
          id?: string
          messages?: Json | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hydration_cache: {
        Row: {
          cached_at: string | null
          last_used_at: string | null
          reason: string | null
          starter_activity_id: string | null
          user_id: string
        }
        Insert: {
          cached_at?: string | null
          last_used_at?: string | null
          reason?: string | null
          starter_activity_id?: string | null
          user_id: string
        }
        Update: {
          cached_at?: string | null
          last_used_at?: string | null
          reason?: string | null
          starter_activity_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hydration_cache_starter_activity_id_fkey"
            columns: ["starter_activity_id"]
            isOneToOne: false
            referencedRelation: "study_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_skills: {
        Row: {
          created_at: string | null
          id: string
          last_practiced_at: string | null
          proficiency: number | null
          skill_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          proficiency?: number | null
          skill_code: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          proficiency?: number | null
          skill_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          competencies: Json | null
          created_at: string | null
          grade: string | null
          id: string
          last_active: string | null
          lessons: number | null
          questions: number | null
          streak: number | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competencies?: Json | null
          created_at?: string | null
          grade?: string | null
          id?: string
          last_active?: string | null
          lessons?: number | null
          questions?: number | null
          streak?: number | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competencies?: Json | null
          created_at?: string | null
          grade?: string | null
          id?: string
          last_active?: string | null
          lessons?: number | null
          questions?: number | null
          streak?: number | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_activities: {
        Row: {
          activity_type: string
          content: Json
          created_at: string | null
          description: string | null
          difficulty: number | null
          estimated_time_sec: number | null
          id: string
          locale: string | null
          skill_code: string
          title: string
        }
        Insert: {
          activity_type: string
          content: Json
          created_at?: string | null
          description?: string | null
          difficulty?: number | null
          estimated_time_sec?: number | null
          id?: string
          locale?: string | null
          skill_code: string
          title: string
        }
        Update: {
          activity_type?: string
          content?: Json
          created_at?: string | null
          description?: string | null
          difficulty?: number | null
          estimated_time_sec?: number | null
          id?: string
          locale?: string | null
          skill_code?: string
          title?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      class_proficiency_summary: {
        Row: {
          avg_proficiency: number | null
          learner_count: number | null
          max_proficiency: number | null
          min_proficiency: number | null
          skill_code: string | null
          skill_title: string | null
        }
        Relationships: []
      }
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
      app_role: "student" | "teacher" | "admin"
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
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
