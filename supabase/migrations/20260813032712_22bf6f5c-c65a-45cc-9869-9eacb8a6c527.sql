CREATE OR REPLACE FUNCTION public.main_trainer_email()
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT 'vicente.locatelli@gmail.com'::text $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
      OR (_role = 'trainer' AND EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = _user_id AND lower(u.email) = public.main_trainer_email()));
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  _role public.app_role;
  _tpl RECORD;
  _new_workout UUID;
  _main_trainer UUID;
BEGIN
  IF lower(NEW.email) = public.main_trainer_email() THEN
    _role := 'trainer';
  ELSE
    _role := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, goal)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), NEW.raw_user_meta_data ->> 'goal')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'trainer' THEN
    -- vincula todos os alunos existentes ao treinador principal
    INSERT INTO public.trainer_students (trainer_id, student_id, active)
    SELECT NEW.id, ur.user_id, true FROM public.user_roles ur WHERE ur.role = 'student'
    ON CONFLICT (trainer_id, student_id) DO UPDATE SET active = true;
    RETURN NEW;
  END IF;

  SELECT u.id INTO _main_trainer FROM auth.users u
  WHERE lower(u.email) = public.main_trainer_email() LIMIT 1;

  IF _main_trainer IS NULL THEN
    SELECT ur.user_id INTO _main_trainer FROM public.user_roles ur
    WHERE ur.role = 'trainer' ORDER BY ur.created_at ASC LIMIT 1;
  END IF;

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

  RETURN NEW;
END;
$function$;

-- Backfill: conta do treinador principal, se já existir
DO $$
DECLARE _t uuid;
BEGIN
  SELECT id INTO _t FROM auth.users WHERE lower(email) = public.main_trainer_email() LIMIT 1;
  IF _t IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name) VALUES (_t, 'Vicente Locatelli') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (_t, 'trainer') ON CONFLICT (user_id, role) DO NOTHING;
    DELETE FROM public.user_roles WHERE user_id = _t AND role = 'student';
    INSERT INTO public.trainer_students (trainer_id, student_id, active)
    SELECT _t, ur.user_id, true FROM public.user_roles ur WHERE ur.role = 'student'
    ON CONFLICT (trainer_id, student_id) DO UPDATE SET active = true;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.main_trainer_email() FROM PUBLIC, anon, authenticated;