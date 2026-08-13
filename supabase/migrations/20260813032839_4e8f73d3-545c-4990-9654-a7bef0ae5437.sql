ALTER TABLE public.exercise_logs
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS intensity text;