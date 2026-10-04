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
      achievements: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
          threshold: number | null
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
          threshold?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
          threshold?: number | null
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat: number | null
          chest_cm: number | null
          created_at: string
          created_by: string | null
          hip_cm: number | null
          id: string
          measured_on: string
          notes: string | null
          student_id: string
          thigh_cm: number | null
          updated_at: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat?: number | null
          chest_cm?: number | null
          created_at?: string
          created_by?: string | null
          hip_cm?: number | null
          id?: string
          measured_on?: string
          notes?: string | null
          student_id: string
          thigh_cm?: number | null
          updated_at?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat?: number | null
          chest_cm?: number | null
          created_at?: string
          created_by?: string | null
          hip_cm?: number | null
          id?: string
          measured_on?: string
          notes?: string | null
          student_id?: string
          thigh_cm?: number | null
          updated_at?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      diet_feedbacks: {
        Row: {
          coach_seen_at: string | null
          content: string
          created_at: string
          id: string
          plan_id: string | null
          student_id: string
        }
        Insert: {
          coach_seen_at?: string | null
          content: string
          created_at?: string
          id?: string
          plan_id?: string | null
          student_id: string
        }
        Update: {
          coach_seen_at?: string | null
          content?: string
          created_at?: string
          id?: string
          plan_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_feedbacks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meal_items: {
        Row: {
          created_at: string
          custom_name: string | null
          food_id: string | null
          id: string
          meal_id: string
          position: number
          quantity_g: number
          substitutes: string | null
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          food_id?: string | null
          id?: string
          meal_id: string
          position?: number
          quantity_g?: number
          substitutes?: string | null
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          food_id?: string | null
          id?: string
          meal_id?: string
          position?: number
          quantity_g?: number
          substitutes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meals: {
        Row: {
          created_at: string
          id: string
          meal_time: string | null
          name: string
          plan_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_time?: string | null
          name: string
          plan_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_time?: string | null
          name?: string
          plan_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          activity_factor: number
          age: number | null
          body_fat: number | null
          carbs_pct: number
          created_at: string
          deficit_pct: number
          fat_pct: number
          fiber_g: number
          goal: string | null
          height_cm: number | null
          id: string
          kcal_rest: number | null
          kcal_training: number | null
          notes: string | null
          protein_pct: number
          published_at: string | null
          rest_days: number
          sex: string | null
          status: string
          student_id: string
          surplus_pct: number
          tdee_kcal: number | null
          tmb_kcal: number | null
          tmb_method: string
          trainer_id: string
          training_days: number
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_factor?: number
          age?: number | null
          body_fat?: number | null
          carbs_pct?: number
          created_at?: string
          deficit_pct?: number
          fat_pct?: number
          fiber_g?: number
          goal?: string | null
          height_cm?: number | null
          id?: string
          kcal_rest?: number | null
          kcal_training?: number | null
          notes?: string | null
          protein_pct?: number
          published_at?: string | null
          rest_days?: number
          sex?: string | null
          status?: string
          student_id: string
          surplus_pct?: number
          tdee_kcal?: number | null
          tmb_kcal?: number | null
          tmb_method?: string
          trainer_id: string
          training_days?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_factor?: number
          age?: number | null
          body_fat?: number | null
          carbs_pct?: number
          created_at?: string
          deficit_pct?: number
          fat_pct?: number
          fiber_g?: number
          goal?: string | null
          height_cm?: number | null
          id?: string
          kcal_rest?: number | null
          kcal_training?: number | null
          notes?: string | null
          protein_pct?: number
          published_at?: string | null
          rest_days?: number
          sex?: string | null
          status?: string
          student_id?: string
          surplus_pct?: number
          tdee_kcal?: number | null
          tmb_kcal?: number | null
          tmb_method?: string
          trainer_id?: string
          training_days?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      diet_questions: {
        Row: {
          answer: string | null
          coach_seen_at: string | null
          created_at: string
          flagged: boolean
          id: string
          question: string
          student_id: string
        }
        Insert: {
          answer?: string | null
          coach_seen_at?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          question: string
          student_id: string
        }
        Update: {
          answer?: string | null
          coach_seen_at?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          question?: string
          student_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          execution_order: number
          exercise_id: string | null
          exercise_name: string
          id: string
          intensity: string | null
          notes: string | null
          reps: number | null
          rpe: number | null
          session_id: string
          set_number: number
          student_id: string
          weight: number | null
          workout_exercise_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          execution_order?: number
          exercise_id?: string | null
          exercise_name: string
          id?: string
          intensity?: string | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id: string
          set_number?: number
          student_id: string
          weight?: number | null
          workout_exercise_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          execution_order?: number
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          intensity?: string | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          student_id?: string
          weight?: number | null
          workout_exercise_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          active: boolean
          category: string | null
          common_mistakes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          env_gym: boolean
          env_home: boolean
          equipment: string | null
          execution: string | null
          id: string
          image_url: string | null
          is_cardio: boolean
          muscle_group: string | null
          name: string
          notes: string | null
          video_url: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          env_gym?: boolean
          env_home?: boolean
          equipment?: string | null
          execution?: string | null
          id?: string
          image_url?: string | null
          is_cardio?: boolean
          muscle_group?: string | null
          name: string
          notes?: string | null
          video_url?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          env_gym?: boolean
          env_home?: boolean
          equipment?: string | null
          execution?: string | null
          id?: string
          image_url?: string | null
          is_cardio?: boolean
          muscle_group?: string | null
          name?: string
          notes?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      foods: {
        Row: {
          active: boolean
          carbs_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          is_recipe: boolean
          kcal: number
          name: string
          notes: string | null
          portion_g: number
          portion_label: string | null
          protein_animal_g: number
          protein_veg_g: number
          sodium_mg: number
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          is_recipe?: boolean
          kcal?: number
          name: string
          notes?: string | null
          portion_g?: number
          portion_label?: string | null
          protein_animal_g?: number
          protein_veg_g?: number
          sodium_mg?: number
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          is_recipe?: boolean
          kcal?: number
          name?: string
          notes?: string | null
          portion_g?: number
          portion_label?: string | null
          protein_animal_g?: number
          protein_veg_g?: number
          sodium_mg?: number
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          id: string
          level: number
          min_points: number
          name: string
        }
        Insert: {
          id?: string
          level: number
          min_points: number
          name: string
        }
        Update: {
          id?: string
          level?: number
          min_points?: number
          name?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          session_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          session_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          feedback_interval_days: number
          full_name: string
          goal: string | null
          id: string
          last_feedback_at: string | null
          next_feedback_at: string | null
          plan: string
          plan_price: number
          started_at: string
          updated_at: string
          water_goal_ml: number
          weekly_target: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          feedback_interval_days?: number
          full_name?: string
          goal?: string | null
          id: string
          last_feedback_at?: string | null
          next_feedback_at?: string | null
          plan?: string
          plan_price?: number
          started_at?: string
          updated_at?: string
          water_goal_ml?: number
          weekly_target?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          feedback_interval_days?: number
          full_name?: string
          goal?: string | null
          id?: string
          last_feedback_at?: string | null
          next_feedback_at?: string | null
          plan?: string
          plan_price?: number
          started_at?: string
          updated_at?: string
          water_goal_ml?: number
          weekly_target?: number
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pose: string
          storage_path: string
          student_id: string
          taken_on: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pose?: string
          storage_path: string
          student_id: string
          taken_on?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pose?: string
          storage_path?: string
          student_id?: string
          taken_on?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      student_checkins: {
        Row: {
          created_at: string
          diet_adherence: number | null
          energy: number | null
          id: string
          notes: string | null
          sleep_quality: number | null
          soreness: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          diet_adherence?: number | null
          energy?: number | null
          id?: string
          notes?: string | null
          sleep_quality?: number | null
          soreness?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          diet_adherence?: number | null
          energy?: number | null
          id?: string
          notes?: string | null
          sleep_quality?: number | null
          soreness?: number | null
          student_id?: string
        }
        Relationships: []
      }
      student_feedbacks: {
        Row: {
          content: string
          created_at: string
          id: string
          next_feedback_at: string | null
          read_at: string | null
          student_id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          next_feedback_at?: string | null
          read_at?: string | null
          student_id: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          next_feedback_at?: string | null
          read_at?: string | null
          student_id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_workouts: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          name: string
          notes: string | null
          objective: string | null
          source_template_id: string | null
          student_id: string
          trainer_id: string | null
          update_notice_at: string | null
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          objective?: string | null
          source_template_id?: string | null
          student_id: string
          trainer_id?: string | null
          update_notice_at?: string | null
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          objective?: string | null
          source_template_id?: string | null
          student_id?: string
          trainer_id?: string | null
          update_notice_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_workouts_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_exercises: {
        Row: {
          cadence: string | null
          exercise_id: string
          id: string
          notes: string | null
          position: number
          recommended_load: string | null
          rep_range: string | null
          rest_seconds: number
          sets: number
          technique: string | null
          template_id: string
        }
        Insert: {
          cadence?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          recommended_load?: string | null
          rep_range?: string | null
          rest_seconds?: number
          sets?: number
          technique?: string | null
          template_id: string
        }
        Update: {
          cadence?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          recommended_load?: string | null
          rep_range?: string | null
          rest_seconds?: number
          sets?: number
          technique?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_students: {
        Row: {
          active: boolean
          created_at: string
          id: string
          student_id: string
          trainer_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          student_id: string
          trainer_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          student_id?: string
          trainer_id?: string
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
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          log_date: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_completion_photos: {
        Row: {
          created_at: string
          id: string
          session_id: string
          storage_path: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          storage_path: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          storage_path?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_completion_photos_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          cadence: string | null
          exercise_id: string
          id: string
          notes: string | null
          position: number
          recommended_load: string | null
          rep_range: string | null
          rest_seconds: number
          sets: number
          student_workout_id: string
          technique: string | null
        }
        Insert: {
          cadence?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          recommended_load?: string | null
          rep_range?: string | null
          rest_seconds?: number
          sets?: number
          student_workout_id: string
          technique?: string | null
        }
        Update: {
          cadence?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          recommended_load?: string | null
          rep_range?: string | null
          rest_seconds?: number
          sets?: number
          student_workout_id?: string
          technique?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_student_workout_id_fkey"
            columns: ["student_workout_id"]
            isOneToOne: false
            referencedRelation: "student_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          duration_seconds: number
          followed_order: boolean
          id: string
          notes: string | null
          photo_bonus_awarded: boolean
          points_awarded: number
          started_at: string
          status: string
          student_feedback: string | null
          student_id: string
          student_workout_id: string | null
          total_sets: number
          total_volume: number
          workout_name: string
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number
          followed_order?: boolean
          id?: string
          notes?: string | null
          photo_bonus_awarded?: boolean
          points_awarded?: number
          started_at?: string
          status?: string
          student_feedback?: string | null
          student_id: string
          student_workout_id?: string | null
          total_sets?: number
          total_volume?: number
          workout_name: string
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number
          followed_order?: boolean
          id?: string
          notes?: string | null
          photo_bonus_awarded?: boolean
          points_awarded?: number
          started_at?: string
          status?: string
          student_feedback?: string | null
          student_id?: string
          student_workout_id?: string | null
          total_sets?: number
          total_volume?: number
          workout_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_student_workout_id_fkey"
            columns: ["student_workout_id"]
            isOneToOne: false
            referencedRelation: "student_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          name: string
          notes: string | null
          objective: string | null
          trainer_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          objective?: string | null
          trainer_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          objective?: string | null
          trainer_id?: string | null
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
      is_my_student: {
        Args: { _student_id: string; _trainer_id: string }
        Returns: boolean
      }
      link_student_by_email: { Args: { _email: string }; Returns: string }
      main_trainer_email: { Args: never; Returns: string }
      my_student_emails: {
        Args: never
        Returns: {
          email: string
          student_id: string
        }[]
      }
    }
    Enums: {
      app_role: "trainer" | "student"
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
    Enums: {
      app_role: ["trainer", "student"],
    },
  },
} as const
