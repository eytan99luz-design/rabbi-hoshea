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
      article_bookmarks: {
        Row: {
          article_id: string
          created_at: string
          id: string
          label: string | null
          page_number: number
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          label?: string | null
          page_number: number
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          label?: string | null
          page_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          article_id: string
          created_at: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          article_id: string
          created_at?: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          article_id?: string
          created_at?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_questions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          created_at: string
          description: string | null
          file_type: string
          file_url: string
          id: string
          summary: string | null
          title: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string
          file_url: string
          id?: string
          summary?: string | null
          title: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          summary?: string | null
          title?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          id: string
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          id: string
          question: string
          user_id: string
          video_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question: string
          user_id: string
          video_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      masechet_follows: {
        Row: {
          created_at: string
          id: string
          masechet: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          masechet: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          masechet?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          video_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position?: number
          video_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          error_message: string | null
          id: string
          new_videos: number
          ran_at: string
          status: string
          total_processed: number
        }
        Insert: {
          error_message?: string | null
          id?: string
          new_videos?: number
          ran_at?: string
          status?: string
          total_processed?: number
        }
        Update: {
          error_message?: string | null
          id?: string
          new_videos?: number
          ran_at?: string
          status?: string
          total_processed?: number
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
      video_tags: {
        Row: {
          id: string
          tag: string
          video_id: string
        }
        Insert: {
          id?: string
          tag: string
          video_id: string
        }
        Update: {
          id?: string
          tag?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          daf: number | null
          id: string
          masechet: string | null
          published_at: string | null
          summary: string | null
          summary_edited: boolean
          summary_en: string | null
          thumbnail_url: string | null
          title: string
          title_en: string | null
          transcript: string | null
          transcript_fetched_at: string | null
          updated_at: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          daf?: number | null
          id?: string
          masechet?: string | null
          published_at?: string | null
          summary?: string | null
          summary_edited?: boolean
          summary_en?: string | null
          thumbnail_url?: string | null
          title: string
          title_en?: string | null
          transcript?: string | null
          transcript_fetched_at?: string | null
          updated_at?: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          daf?: number | null
          id?: string
          masechet?: string | null
          published_at?: string | null
          summary?: string | null
          summary_edited?: boolean
          summary_en?: string | null
          thumbnail_url?: string | null
          title?: string
          title_en?: string | null
          transcript?: string | null
          transcript_fetched_at?: string | null
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          id: string
          progress_seconds: number
          user_id: string
          video_id: string
          watched_at: string
        }
        Insert: {
          id?: string
          progress_seconds?: number
          user_id: string
          video_id: string
          watched_at?: string
        }
        Update: {
          id?: string
          progress_seconds?: number
          user_id?: string
          video_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_masechet_counts: {
        Args: never
        Returns: {
          count: number
          masechet: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
