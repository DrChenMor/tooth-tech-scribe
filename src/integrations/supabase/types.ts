export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_actions_log: {
        Row: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          admin_reasoning: string | null
          id: string
          modified_data: Json | null
          original_data: Json | null
          suggestion_id: string | null
          timestamp: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["admin_action_type"]
          admin_id: string
          admin_reasoning?: string | null
          id?: string
          modified_data?: Json | null
          original_data?: Json | null
          suggestion_id?: string | null
          timestamp?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["admin_action_type"]
          admin_id?: string
          admin_reasoning?: string | null
          id?: string
          modified_data?: Json | null
          original_data?: Json | null
          suggestion_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_log_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          execution_id: string | null
          id: string
          message: string
          read_at: string | null
          suggestion_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          execution_id?: string | null
          id?: string
          message: string
          read_at?: string | null
          suggestion_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          execution_id?: string | null
          id?: string
          message?: string
          read_at?: string | null
          suggestion_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_suggestion_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_suggestion_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_suggestion_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_related_suggestion_id_fkey"
            columns: ["related_suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance_metrics: {
        Row: {
          admin_feedback:
            | Database["public"]["Enums"]["admin_feedback_type"]
            | null
          agent_id: string | null
          feedback_notes: string | null
          id: string
          logged_at: string | null
          performance_score: number | null
          suggestion_id: string | null
        }
        Insert: {
          admin_feedback?:
            | Database["public"]["Enums"]["admin_feedback_type"]
            | null
          agent_id?: string | null
          feedback_notes?: string | null
          id?: string
          logged_at?: string | null
          performance_score?: number | null
          suggestion_id?: string | null
        }
        Update: {
          admin_feedback?:
            | Database["public"]["Enums"]["admin_feedback_type"]
            | null
          agent_id?: string | null
          feedback_notes?: string | null
          id?: string
          logged_at?: string | null
          performance_score?: number | null
          suggestion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_performance_metrics_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          agent_id: string | null
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          implementation_notes: string | null
          implemented_at: string | null
          priority: number | null
          reasoning: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_data: Json
          target_id: string | null
          target_type: string
          title: string | null
          type: string | null
        }
        Insert: {
          agent_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          priority?: number | null
          reasoning: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_data: Json
          target_id?: string | null
          target_type: string
          title?: string | null
          type?: string | null
        }
        Update: {
          agent_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          priority?: number | null
          reasoning?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"] | null
          suggestion_data?: Json
          target_id?: string | null
          target_type?: string
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          category: string | null
          category_image_url: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: number
          image_url: string | null
          published_date: string
          reporter_id: string | null
          seo_details: Json | null
          seo_score: number | null
          slug: string
          source_references: Json | null
          status: Database["public"]["Enums"]["article_status"]
          title: string
          views: number
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          category?: string | null
          category_image_url?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: number
          image_url?: string | null
          published_date: string
          reporter_id?: string | null
          seo_details?: Json | null
          seo_score?: number | null
          slug: string
          source_references?: Json | null
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          views?: number
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          category?: string | null
          category_image_url?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: number
          image_url?: string | null
          published_date?: string
          reporter_id?: string | null
          seo_details?: Json | null
          seo_score?: number | null
          slug?: string
          source_references?: Json | null
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "reporters"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          content: string | null
          created_at: string
          discovered_at: string
          id: string
          keywords_used: Json | null
          metadata: Json | null
          priority_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string | null
          source_type: string
          source_url: string
          status: Database["public"]["Enums"]["content_queue_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          discovered_at?: string
          id?: string
          keywords_used?: Json | null
          metadata?: Json | null
          priority_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          source_type: string
          source_url: string
          status?: Database["public"]["Enums"]["content_queue_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          discovered_at?: string
          id?: string
          keywords_used?: Json | null
          metadata?: Json | null
          priority_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          source_type?: string
          source_url?: string
          status?: Database["public"]["Enums"]["content_queue_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          api_endpoint: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_theme: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          theme_data: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          theme_data: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          theme_data?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reporters: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_reviews: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          review_type: string | null
          scheduled_for: string
          suggestion_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          review_type?: string | null
          scheduled_for: string
          suggestion_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          review_type?: string | null
          scheduled_for?: string
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reviews_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          default_author: string
          default_category: string
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_author?: string
          default_category?: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_author?: string
          default_category?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
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
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          result: Json | null
          started_at: string | null
          status: string
          suggestion_id: string
          workflow_rule_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          suggestion_id: string
          workflow_rule_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          suggestion_id?: string
          workflow_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_rule_id_fkey"
            columns: ["workflow_rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          description: string | null
          enabled: boolean | null
          execution_count: number | null
          id: string
          name: string
          priority: number | null
          success_rate: number | null
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          execution_count?: number | null
          id?: string
          name: string
          priority?: number | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          execution_count?: number | null
          id?: string
          name?: string
          priority?: number | null
          success_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      categories_with_images: {
        Row: {
          article_count: number | null
          category: string | null
          category_image_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      admin_action_type: "approve" | "reject" | "edit" | "dismiss"
      admin_feedback_type: "good" | "irrelevant" | "wrong" | "excellent"
      app_role: "admin" | "user"
      article_status: "draft" | "published" | "archived"
      content_queue_status: "pending" | "approved" | "rejected" | "processed"
      suggestion_status: "pending" | "approved" | "rejected" | "implemented"
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
      admin_action_type: ["approve", "reject", "edit", "dismiss"],
      admin_feedback_type: ["good", "irrelevant", "wrong", "excellent"],
      app_role: ["admin", "user"],
      article_status: ["draft", "published", "archived"],
      content_queue_status: ["pending", "approved", "rejected", "processed"],
      suggestion_status: ["pending", "approved", "rejected", "implemented"],
    },
  },
} as const
