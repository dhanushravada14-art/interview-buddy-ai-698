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
      activities: {
        Row: {
          created_at: string
          details: Json
          id: string
          kind: string
          ref_id: string | null
          score: number
          subtopic: string
          title: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          kind: string
          ref_id?: string | null
          score?: number
          subtopic?: string
          title?: string
          topic?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          ref_id?: string | null
          score?: number
          subtopic?: string
          title?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      coding_submissions: {
        Row: {
          code: string
          created_at: string
          id: string
          language: string
          passed: number
          problem_slug: string
          review: Json | null
          status: string
          topic: string
          total: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          language: string
          passed?: number
          problem_slug: string
          review?: Json | null
          status?: string
          topic?: string
          total?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          language?: string
          passed?: number
          problem_slug?: string
          review?: Json | null
          status?: string
          topic?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          active: boolean
          aptitude_topics: Json
          category: string
          coding_topics: Json
          created_at: string
          description: string
          difficulty: string
          hr_focus: Json
          id: string
          name: string
          rounds: Json
          slug: string
          technical_topics: Json
          tips: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          aptitude_topics?: Json
          category?: string
          coding_topics?: Json
          created_at?: string
          description?: string
          difficulty?: string
          hr_focus?: Json
          id?: string
          name: string
          rounds?: Json
          slug: string
          technical_topics?: Json
          tips?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          aptitude_topics?: Json
          category?: string
          coding_topics?: Json
          created_at?: string
          description?: string
          difficulty?: string
          hr_focus?: Json
          id?: string
          name?: string
          rounds?: Json
          slug?: string
          technical_topics?: Json
          tips?: Json
          updated_at?: string
        }
        Relationships: []
      }
      doubt_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "doubt_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          answers: Json
          completed: boolean
          completed_at: string | null
          created_at: string
          dimensions: Json | null
          feedback: string | null
          id: string
          mock_id: string | null
          per_question: Json
          questions: Json
          round: number
          round_name: string
          score: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          dimensions?: Json | null
          feedback?: string | null
          id?: string
          mock_id?: string | null
          per_question?: Json
          questions?: Json
          round: number
          round_name: string
          score?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          dimensions?: Json | null
          feedback?: string | null
          id?: string
          mock_id?: string | null
          per_question?: Json
          questions?: Json
          round?: number
          round_name?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: string
          branch: string
          certifications: string
          cgpa: string
          college: string
          created_at: string
          degree: string
          full_name: string
          graduation_year: string
          id: string
          internships: string
          projects: string
          resume_filename: string
          resume_parsed: Json | null
          resume_text: string
          skill_levels: Json
          skills: string[]
          target_companies: string[]
          target_role: string
          updated_at: string
        }
        Insert: {
          achievements?: string
          branch?: string
          certifications?: string
          cgpa?: string
          college?: string
          created_at?: string
          degree?: string
          full_name?: string
          graduation_year?: string
          id: string
          internships?: string
          projects?: string
          resume_filename?: string
          resume_parsed?: Json | null
          resume_text?: string
          skill_levels?: Json
          skills?: string[]
          target_companies?: string[]
          target_role?: string
          updated_at?: string
        }
        Update: {
          achievements?: string
          branch?: string
          certifications?: string
          cgpa?: string
          college?: string
          created_at?: string
          degree?: string
          full_name?: string
          graduation_year?: string
          id?: string
          internships?: string
          projects?: string
          resume_filename?: string
          resume_parsed?: Json | null
          resume_text?: string
          skill_levels?: Json
          skills?: string[]
          target_companies?: string[]
          target_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_interviews: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          feedback: Json | null
          id: string
          project_name: string
          score: number | null
          transcript: Json
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          project_name?: string
          score?: number | null
          transcript?: Json
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          project_name?: string
          score?: number | null
          transcript?: Json
          user_id?: string
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          created_at: string
          days: number
          id: string
          plan: Json
          readiness: number
          recommended: Json
          strengths: Json
          summary: string
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          created_at?: string
          days?: number
          id?: string
          plan?: Json
          readiness?: number
          recommended?: Json
          strengths?: Json
          summary?: string
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          plan?: Json
          readiness?: number
          recommended?: Json
          strengths?: Json
          summary?: string
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
