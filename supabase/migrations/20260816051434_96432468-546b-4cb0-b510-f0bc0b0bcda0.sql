ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS env_gym boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS env_home boolean NOT NULL DEFAULT false;