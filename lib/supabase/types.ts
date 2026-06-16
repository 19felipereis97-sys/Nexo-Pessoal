export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          role: string | null
          timezone: string | null
          locale: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: string | null
          timezone?: string | null
          locale?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: string | null
          timezone?: string | null
          locale?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          accent_color: string
          dashboard_density: string
          enable_tooltips: boolean
          enable_animations: boolean
          enable_quick_create: boolean
          date_format: string
          time_format: string
          week_starts_on: string
          default_home_page: string
          default_calendar_view: string
          calendar_start_hour: number
          calendar_end_hour: number
          calendar_default_duration: number
          calendar_show_weekends: boolean
          default_task_view: string
          task_default_priority: string
          task_show_completed: boolean
          project_stale_days: number
          doc_default_category: string | null
          doc_show_archived: boolean
          assistant_enabled: boolean
          assistant_daily_summary: boolean
          assistant_weekly_review: boolean
          assistant_tone: string
          assistant_suggest_reschedule: boolean
          assistant_generate_tasks: boolean
          assistant_require_confirm: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          accent_color?: string
          dashboard_density?: string
          enable_tooltips?: boolean
          enable_animations?: boolean
          enable_quick_create?: boolean
          date_format?: string
          time_format?: string
          week_starts_on?: string
          default_home_page?: string
          default_calendar_view?: string
          calendar_start_hour?: number
          calendar_end_hour?: number
          calendar_default_duration?: number
          calendar_show_weekends?: boolean
          default_task_view?: string
          task_default_priority?: string
          task_show_completed?: boolean
          project_stale_days?: number
          doc_default_category?: string | null
          doc_show_archived?: boolean
          assistant_enabled?: boolean
          assistant_daily_summary?: boolean
          assistant_weekly_review?: boolean
          assistant_tone?: string
          assistant_suggest_reschedule?: boolean
          assistant_generate_tasks?: boolean
          assistant_require_confirm?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          theme?: string
          accent_color?: string
          dashboard_density?: string
          enable_tooltips?: boolean
          enable_animations?: boolean
          enable_quick_create?: boolean
          date_format?: string
          time_format?: string
          week_starts_on?: string
          default_home_page?: string
          default_calendar_view?: string
          calendar_start_hour?: number
          calendar_end_hour?: number
          calendar_default_duration?: number
          calendar_show_weekends?: boolean
          default_task_view?: string
          task_default_priority?: string
          task_show_completed?: boolean
          project_stale_days?: number
          doc_default_category?: string | null
          doc_show_archived?: boolean
          assistant_enabled?: boolean
          assistant_daily_summary?: boolean
          assistant_weekly_review?: boolean
          assistant_tone?: string
          assistant_suggest_reschedule?: boolean
          assistant_generate_tasks?: boolean
          assistant_require_confirm?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          notify_task_due: boolean
          notify_task_overdue: boolean
          notify_meeting_reminder: boolean
          notify_project_stalled: boolean
          notify_routine_pending: boolean
          notify_daily_summary: boolean
          notify_weekly_review: boolean
          daily_summary_time: string | null
          weekly_review_day: string | null
          weekly_review_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notify_task_due?: boolean
          notify_task_overdue?: boolean
          notify_meeting_reminder?: boolean
          notify_project_stalled?: boolean
          notify_routine_pending?: boolean
          notify_daily_summary?: boolean
          notify_weekly_review?: boolean
          daily_summary_time?: string | null
          weekly_review_day?: string | null
          weekly_review_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          notify_task_due?: boolean
          notify_task_overdue?: boolean
          notify_meeting_reminder?: boolean
          notify_project_stalled?: boolean
          notify_routine_pending?: boolean
          notify_daily_summary?: boolean
          notify_weekly_review?: boolean
          daily_summary_time?: string | null
          weekly_review_day?: string | null
          weekly_review_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          id: string
          user_id: string
          two_factor_enabled: boolean
          session_timeout_minutes: number
          login_alerts_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          two_factor_enabled?: boolean
          session_timeout_minutes?: number
          login_alerts_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          two_factor_enabled?: boolean
          session_timeout_minutes?: number
          login_alerts_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          id: string
          user_id: string
          provider: string
          status: string
          metadata: Record<string, unknown> | null
          connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          status?: string
          metadata?: Record<string, unknown> | null
          connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          metadata?: Record<string, unknown> | null
          connected_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          meeting_id: string | null
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          due_time: string | null
          completed_at: string | null
          execution_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          meeting_id?: string | null
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          due_time?: string | null
          completed_at?: string | null
          execution_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string | null
          meeting_id?: string | null
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          due_time?: string | null
          completed_at?: string | null
          execution_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: string
          priority: string
          start_date: string | null
          due_date: string | null
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: string
          priority?: string
          start_date?: string | null
          due_date?: string | null
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: string
          priority?: string
          start_date?: string | null
          due_date?: string | null
          progress?: number
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_at: string
          end_at: string
          type: string
          location: string | null
          project_id: string | null
          meeting_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_at: string
          end_at: string
          type?: string
          location?: string | null
          project_id?: string | null
          meeting_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          start_at?: string
          end_at?: string
          type?: string
          location?: string | null
          project_id?: string | null
          meeting_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'calendar_events_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'calendar_events_meeting_id_fkey'
            columns: ['meeting_id']
            isOneToOne: false
            referencedRelation: 'meetings'
            referencedColumns: ['id']
          },
        ]
      }
      meetings: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          description: string | null
          scheduled_at: string
          duration_minutes: number
          location: string | null
          status: string
          agenda: string | null
          minutes: string | null
          participants: string[]
          next_steps: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          description?: string | null
          scheduled_at: string
          duration_minutes?: number
          location?: string | null
          status?: string
          agenda?: string | null
          minutes?: string | null
          participants?: string[]
          next_steps?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string | null
          title?: string
          description?: string | null
          scheduled_at?: string
          duration_minutes?: number
          location?: string | null
          status?: string
          agenda?: string | null
          minutes?: string | null
          participants?: string[]
          next_steps?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'meetings_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          task_id: string | null
          meeting_id: string | null
          title: string
          content: string
          type: string
          pinned: boolean
          archived: boolean
          converted_task_id: string | null
          converted_decision_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          task_id?: string | null
          meeting_id?: string | null
          title: string
          content?: string
          type?: string
          pinned?: boolean
          archived?: boolean
          converted_task_id?: string | null
          converted_decision_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string | null
          task_id?: string | null
          meeting_id?: string | null
          title?: string
          content?: string
          type?: string
          pinned?: boolean
          archived?: boolean
          converted_task_id?: string | null
          converted_decision_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notes_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          action: string
          metadata?: Json | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      project_decisions: {
        Row: {
          id: string
          user_id: string
          project_id: string
          meeting_id: string | null
          title: string
          description: string | null
          decided_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          meeting_id?: string | null
          title: string
          description?: string | null
          decided_at?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          decided_at?: string
        }
        Relationships: []
      }
      daily_notes: {
        Row: { id: string; user_id: string; note_date: string; content: string; converted_task_id: string | null; created_at: string }
        Insert: { id?: string; user_id: string; note_date?: string; content: string; converted_task_id?: string | null; created_at?: string }
        Update: { content?: string; converted_task_id?: string | null }
        Relationships: []
      }
      daily_reviews: {
        Row: { id: string; user_id: string; review_date: string; summary: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; review_date?: string; summary: string; created_at?: string; updated_at?: string }
        Update: { summary?: string; updated_at?: string }
        Relationships: []
      }
      focus_sessions: {
        Row: { id: string; user_id: string; task_id: string | null; started_at: string; ended_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; task_id?: string | null; started_at?: string; ended_at?: string | null; created_at?: string }
        Update: { ended_at?: string | null }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          severity: string
          entity_type: string
          entity_id: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          severity: string
          entity_type: string
          entity_id: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          message?: string
          type?: string
          severity?: string
          entity_type?: string
          entity_id?: string
          read_at?: string | null
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          summary: string | null
          wins: string | null
          pending_items: string | null
          next_focus: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          summary?: string | null
          wins?: string | null
          pending_items?: string | null
          next_focus?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          week_end?: string
          summary?: string | null
          wins?: string | null
          pending_items?: string | null
          next_focus?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          frequency: string
          days_of_week: string[] | null
          target_time: string | null
          area: string | null
          project_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          frequency?: string
          days_of_week?: string[] | null
          target_time?: string | null
          area?: string | null
          project_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          frequency?: string
          days_of_week?: string[] | null
          target_time?: string | null
          area?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      routine_checklist_items: {
        Row: {
          id: string
          routine_id: string
          user_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          user_id: string
          title: string
          position?: number
          created_at?: string
        }
        Update: {
          title?: string
          position?: number
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          id: string
          routine_id: string
          user_id: string
          completed_at: string
          reference_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          user_id: string
          completed_at?: string
          reference_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          notes?: string | null
        }
        Relationships: []
      }
      report_reviews: {
        Row: {
          id: string
          user_id: string
          type: string
          period_start: string
          period_end: string
          title: string
          summary: string | null
          completed_tasks: number
          pending_tasks: number
          overdue_tasks: number
          completed_routines: number
          total_routines: number
          meetings_count: number
          notes_count: number
          documents_count: number
          active_projects: number
          stalled_projects: number
          wins: string | null
          pending_items: string | null
          next_focus: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          period_start: string
          period_end: string
          title: string
          summary?: string | null
          completed_tasks?: number
          pending_tasks?: number
          overdue_tasks?: number
          completed_routines?: number
          total_routines?: number
          meetings_count?: number
          notes_count?: number
          documents_count?: number
          active_projects?: number
          stalled_projects?: number
          wins?: string | null
          pending_items?: string | null
          next_focus?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          summary?: string | null
          wins?: string | null
          pending_items?: string | null
          next_focus?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          task_id: string | null
          meeting_id: string | null
          note_id: string | null
          title: string
          description: string | null
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          category: string | null
          tags: string[] | null
          status: string
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          task_id?: string | null
          meeting_id?: string | null
          note_id?: string | null
          title: string
          description?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          category?: string | null
          tags?: string[] | null
          status?: string
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string | null
          task_id?: string | null
          meeting_id?: string | null
          note_id?: string | null
          title?: string
          description?: string | null
          file_type?: string | null
          file_size?: number | null
          category?: string | null
          tags?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          mode: string
          question: string
          answer: string
          context: Json | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mode?: string
          question: string
          answer: string
          context?: Json | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          feedback?: string | null
        }
        Relationships: []
      }
      ai_commands: {
        Row: {
          id: string
          user_id: string
          source: string
          raw_text: string
          intent: string
          status: string
          payload: Json
          result_entity_type: string | null
          result_entity_id: string | null
          error: string | null
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source?: string
          raw_text: string
          intent: string
          status?: string
          payload?: Json
          result_entity_type?: string | null
          result_entity_id?: string | null
          error?: string | null
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          source?: string
          raw_text?: string
          intent?: string
          status?: string
          payload?: Json
          result_entity_type?: string | null
          result_entity_id?: string | null
          error?: string | null
          executed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
export type Meeting = Database['public']['Tables']['meetings']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type ProjectDecision = Database['public']['Tables']['project_decisions']['Row']
export type DailyNote = Database['public']['Tables']['daily_notes']['Row']
export type DailyReview = Database['public']['Tables']['daily_reviews']['Row']
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row']
export type Routine = Database['public']['Tables']['routines']['Row']
export type RoutineChecklistItem = Database['public']['Tables']['routine_checklist_items']['Row']
export type RoutineLog = Database['public']['Tables']['routine_logs']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type ReportReview = Database['public']['Tables']['report_reviews']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type NotificationSettings = Database['public']['Tables']['notification_settings']['Row']
export type SecuritySettings = Database['public']['Tables']['security_settings']['Row']
export type IntegrationSetting = Database['public']['Tables']['integration_settings']['Row']
export type AIInteractionRow = Database['public']['Tables']['ai_interactions']['Row']
export type AICommandRow = Database['public']['Tables']['ai_commands']['Row']
