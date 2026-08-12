-- 0. Helper de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 1. Perfis: plano, valor e ciclo de feedback
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS plan_price numeric NOT NULL DEFAULT 67,
  ADD COLUMN IF NOT EXISTS feedback_interval_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_feedback_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_feedback_at timestamptz;

-- 2. Exercícios de cardio
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS is_cardio boolean NOT NULL DEFAULT false;

-- 3. Sessões: feedback do aluno + controle de bônus de foto
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS student_feedback text,
  ADD COLUMN IF NOT EXISTS photo_bonus_awarded boolean NOT NULL DEFAULT false;

-- 4. Uma foto por sessão
CREATE UNIQUE INDEX IF NOT EXISTS workout_completion_photos_session_unique
  ON public.workout_completion_photos (session_id);

-- 5. Medidas corporais
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_on date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric,
  body_fat numeric,
  waist_cm numeric,
  hip_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  chest_cm numeric,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated;
GRANT ALL ON public.body_measurements TO service_role;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS measurements_select ON public.body_measurements;
CREATE POLICY measurements_select ON public.body_measurements
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
DROP POLICY IF EXISTS measurements_insert ON public.body_measurements;
CREATE POLICY measurements_insert ON public.body_measurements
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
DROP POLICY IF EXISTS measurements_update ON public.body_measurements;
CREATE POLICY measurements_update ON public.body_measurements
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id))
  WITH CHECK (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
DROP POLICY IF EXISTS measurements_delete ON public.body_measurements;
CREATE POLICY measurements_delete ON public.body_measurements
  FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));

DROP TRIGGER IF EXISTS update_body_measurements_updated_at ON public.body_measurements;
CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Feedbacks do treinador
CREATE TABLE IF NOT EXISTS public.student_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  next_feedback_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_feedbacks TO authenticated;
GRANT ALL ON public.student_feedbacks TO service_role;
ALTER TABLE public.student_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedbacks_select ON public.student_feedbacks;
CREATE POLICY feedbacks_select ON public.student_feedbacks
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR trainer_id = auth.uid());
DROP POLICY IF EXISTS feedbacks_insert ON public.student_feedbacks;
CREATE POLICY feedbacks_insert ON public.student_feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid() AND public.is_my_student(auth.uid(), student_id));
DROP POLICY IF EXISTS feedbacks_update ON public.student_feedbacks;
CREATE POLICY feedbacks_update ON public.student_feedbacks
  FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
DROP POLICY IF EXISTS feedbacks_delete ON public.student_feedbacks;
CREATE POLICY feedbacks_delete ON public.student_feedbacks
  FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

DROP TRIGGER IF EXISTS update_student_feedbacks_updated_at ON public.student_feedbacks;
CREATE TRIGGER update_student_feedbacks_updated_at
  BEFORE UPDATE ON public.student_feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Vínculo automático do novo aluno ao treinador principal
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _tpl RECORD;
  _new_workout UUID;
  _main_trainer UUID;
BEGIN
  _role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'student')::public.app_role;

  INSERT INTO public.profiles (id, full_name, goal)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.raw_user_meta_data ->> 'goal')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'student' THEN
    SELECT ur.user_id INTO _main_trainer
    FROM public.user_roles ur
    WHERE ur.role = 'trainer'
    ORDER BY ur.created_at ASC
    LIMIT 1;

    IF _main_trainer IS NOT NULL THEN
      INSERT INTO public.trainer_students (trainer_id, student_id, active)
      VALUES (_main_trainer, NEW.id, true)
      ON CONFLICT (trainer_id, student_id) DO UPDATE SET active = true;
    END IF;

    FOR _tpl IN SELECT * FROM public.workout_templates WHERE trainer_id IS NULL AND active LOOP
      INSERT INTO public.student_workouts (student_id, source_template_id, name, objective, description, estimated_minutes, notes)
      VALUES (NEW.id, _tpl.id, _tpl.name, _tpl.objective, _tpl.description, _tpl.estimated_minutes, _tpl.notes)
      RETURNING id INTO _new_workout;

      INSERT INTO public.workout_exercises (student_workout_id, exercise_id, position, sets, rep_range, recommended_load, cadence, rest_seconds, technique, notes)
      SELECT _new_workout, te.exercise_id, te.position, te.sets, te.rep_range, te.recommended_load, te.cadence, te.rest_seconds, te.technique, te.notes
      FROM public.template_exercises te WHERE te.template_id = _tpl.id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- 8. Treinador pode editar exercícios da biblioteca compartilhada
DROP POLICY IF EXISTS exercises_update ON public.exercises;
CREATE POLICY exercises_update ON public.exercises
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'trainer'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'trainer'));