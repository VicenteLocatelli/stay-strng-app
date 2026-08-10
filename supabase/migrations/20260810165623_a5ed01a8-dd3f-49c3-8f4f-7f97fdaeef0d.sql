-- ENUM
CREATE TYPE public.app_role AS ENUM ('trainer', 'student');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  goal TEXT,
  weekly_target INTEGER NOT NULL DEFAULT 3,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- TRAINER <-> STUDENT
CREATE TABLE public.trainer_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_students TO authenticated;
GRANT ALL ON public.trainer_students TO service_role;
ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_my_student(_trainer_id UUID, _student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_students
    WHERE trainer_id = _trainer_id AND student_id = _student_id AND active
  );
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_my_student(auth.uid(), id) OR public.is_my_student(id, auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_my_student(auth.uid(), id))
  WITH CHECK (id = auth.uid() OR public.is_my_student(auth.uid(), id));

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_my_student(auth.uid(), user_id));

CREATE POLICY "trainer_students_select" ON public.trainer_students FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "trainer_students_insert" ON public.trainer_students FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid() AND public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "trainer_students_update" ON public.trainer_students FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "trainer_students_delete" ON public.trainer_students FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

-- EXERCISES
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  muscle_group TEXT,
  equipment TEXT,
  video_url TEXT,
  image_url TEXT,
  description TEXT,
  execution TEXT,
  common_mistakes TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_select" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercises_insert" ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "exercises_update" ON public.exercises FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "exercises_delete" ON public.exercises FOR DELETE TO authenticated USING (created_by = auth.uid());

-- TEMPLATES
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT,
  description TEXT,
  estimated_minutes INTEGER,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_templates TO authenticated;
GRANT ALL ON public.workout_templates TO service_role;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select" ON public.workout_templates FOR SELECT TO authenticated
  USING (trainer_id IS NULL OR trainer_id = auth.uid());
CREATE POLICY "templates_insert" ON public.workout_templates FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid() AND public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "templates_update" ON public.workout_templates FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "templates_delete" ON public.workout_templates FOR DELETE TO authenticated USING (trainer_id = auth.uid());

CREATE TABLE public.template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 1,
  sets INTEGER NOT NULL DEFAULT 3,
  rep_range TEXT,
  recommended_load TEXT,
  cadence TEXT,
  rest_seconds INTEGER NOT NULL DEFAULT 90,
  technique TEXT,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_exercises TO authenticated;
GRANT ALL ON public.template_exercises TO service_role;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_exercises_select" ON public.template_exercises FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_templates t WHERE t.id = template_id AND (t.trainer_id IS NULL OR t.trainer_id = auth.uid())));
CREATE POLICY "template_exercises_write" ON public.template_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_templates t WHERE t.id = template_id AND t.trainer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_templates t WHERE t.id = template_id AND t.trainer_id = auth.uid()));

-- STUDENT WORKOUTS
CREATE TABLE public.student_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  objective TEXT,
  description TEXT,
  estimated_minutes INTEGER,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_workouts TO authenticated;
GRANT ALL ON public.student_workouts TO service_role;
ALTER TABLE public.student_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_workouts_select" ON public.student_workouts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
CREATE POLICY "student_workouts_write" ON public.student_workouts FOR ALL TO authenticated
  USING (public.is_my_student(auth.uid(), student_id))
  WITH CHECK (public.is_my_student(auth.uid(), student_id));

CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_workout_id UUID NOT NULL REFERENCES public.student_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL DEFAULT 1,
  sets INTEGER NOT NULL DEFAULT 3,
  rep_range TEXT,
  recommended_load TEXT,
  cadence TEXT,
  rest_seconds INTEGER NOT NULL DEFAULT 90,
  technique TEXT,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_exercises_select" ON public.workout_exercises FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_workouts w WHERE w.id = student_workout_id AND (w.student_id = auth.uid() OR public.is_my_student(auth.uid(), w.student_id))));
CREATE POLICY "workout_exercises_write" ON public.workout_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_workouts w WHERE w.id = student_workout_id AND public.is_my_student(auth.uid(), w.student_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_workouts w WHERE w.id = student_workout_id AND public.is_my_student(auth.uid(), w.student_id)));

-- SESSIONS
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_workout_id UUID REFERENCES public.student_workouts(id) ON DELETE SET NULL,
  workout_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_volume NUMERIC NOT NULL DEFAULT 0,
  total_sets INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  followed_order BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select" ON public.workout_sessions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
CREATE POLICY "sessions_insert" ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "sessions_update" ON public.workout_sessions FOR UPDATE TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  workout_exercise_id UUID REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  execution_order INTEGER NOT NULL DEFAULT 1,
  set_number INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC,
  reps INTEGER,
  rpe INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_select" ON public.exercise_logs FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
CREATE POLICY "logs_insert" ON public.exercise_logs FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE TABLE public.workout_completion_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.workout_completion_photos TO authenticated;
GRANT ALL ON public.workout_completion_photos TO service_role;
ALTER TABLE public.workout_completion_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_select" ON public.workout_completion_photos FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
CREATE POLICY "photos_insert" ON public.workout_completion_photos FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- GAMIFICATION
CREATE TABLE public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL
);
GRANT SELECT ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_select" ON public.levels FOR SELECT TO authenticated USING (true);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  threshold INTEGER
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_select" ON public.achievements FOR SELECT TO authenticated USING (true);

CREATE TABLE public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, achievement_id)
);
GRANT SELECT, INSERT ON public.student_achievements TO authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_achievements_select" ON public.student_achievements FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
CREATE POLICY "student_achievements_insert" ON public.student_achievements FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_select" ON public.points_transactions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_my_student(auth.uid(), student_id));
CREATE POLICY "points_insert" ON public.points_transactions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _tpl RECORD;
  _new_workout UUID;
BEGIN
  _role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'student')::public.app_role;

  INSERT INTO public.profiles (id, full_name, goal)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.raw_user_meta_data ->> 'goal')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'student' THEN
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
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED: LEVELS
INSERT INTO public.levels (level, name, min_points) VALUES
  (1, 'START', 0),
  (2, 'BUILD', 1000),
  (3, 'GRIND', 3000),
  (4, 'STRONG', 6000),
  (5, 'ELITE', 10000),
  (6, 'UNSTOPPABLE', 16000);

-- SEED: ACHIEVEMENTS
INSERT INTO public.achievements (code, name, description, threshold) VALUES
  ('FIRST_STRNG', 'FIRST STRNG', 'Primeiro treino concluído', 1),
  ('SEVEN_STRNG', '7 DAYS STRNG', '7 treinos concluídos', 7),
  ('THIRTY_STRNG', '30 DAYS STRNG', '30 treinos concluídos', 30),
  ('HUNDRED_WORKOUTS', '100 WORKOUTS', '100 treinos concluídos', 100),
  ('PERFECT_ORDER', 'ORDEM PERFEITA', 'Concluiu um treino na ordem exata prescrita', NULL);

-- SEED: EXERCISES
INSERT INTO public.exercises (name, category, muscle_group, equipment, description, execution, common_mistakes) VALUES
 ('Cadeira abdutora 45°','Isolado','Glúteo','Máquina','Abdução de quadril na máquina inclinada.','Quadril fixo no banco e movimento controlado. Na válida, chegue perto da falha mantendo controle, sem tranco.','Usar tranco e balançar o tronco.'),
 ('Elevação pélvica','Composto','Glúteo','Barra','Hip thrust com barra.','Suba o quadril contraindo glúteos e pause 1s no topo.','Hiperestender a lombar.'),
 ('Afundo búlgaro','Composto','Glúteo','Halteres','Agachamento unilateral com pé elevado atrás.','Tronco levemente inclinado à frente para priorizar glúteo. Desça com controle.','Perder o equilíbrio e encurtar a amplitude.'),
 ('Leg Press 45°','Composto','Quadríceps','Máquina','Empurrar a plataforma inclinada.','Pés firmes, joelhos alinhados com os pés. Desça sem tirar a lombar do encosto.','Travar os joelhos no topo.'),
 ('Agachamento sumô','Composto','Glúteo','Halteres','Agachamento com base ampla.','Peito aberto, coluna neutra e joelhos na linha dos pés.','Joelhos caindo para dentro.'),
 ('Cadeira extensora','Isolado','Quadríceps','Máquina','Extensão de joelhos na máquina.','Ajuste para o joelho ficar alinhado com o eixo da máquina. Controle a descida.','Chutar a carga.'),
 ('Abdutora na polia','Isolado','Glúteo','Polia','Abdução de quadril em pé na polia.','Tronco parado, movimento vindo do quadril, sem girar o corpo.','Compensar com a lombar.'),
 ('Panturrilha joelho estendido','Isolado','Panturrilha','Máquina','Flexão plantar com joelho estendido.','Suba ao máximo, pause 1s no topo e desça até alongar.','Travar o joelho agressivamente.'),
 ('Esteira inclinada leve','Cardio','Cardio','Esteira','Caminhada inclinada em ritmo leve.','Ritmo em que dá para conversar, 10 a 15 minutos.','Correr além do ritmo prescrito.'),
 ('Remada máquina pegada fechada','Composto','Costas','Máquina','Remada horizontal na máquina.','Puxe com os cotovelos rentes ao corpo e controle a volta.','Usar impulso de tronco.'),
 ('Remada serrote','Composto','Costas','Halteres','Remada unilateral com halter.','Coluna neutra, puxe o halter em direção ao quadril.','Rodar o tronco excessivamente.'),
 ('Pulldown pegada neutra','Composto','Costas','Polia','Puxada alta com pegada neutra.','Puxe até a altura do peito, controlando a subida.','Jogar o tronco para trás.'),
 ('Supino inclinado com halteres','Composto','Peito','Halteres','Supino em banco inclinado.','Desça controlado até alongar o peitoral e suba sem travar os cotovelos.','Abrir demais os cotovelos.'),
 ('Elevação lateral','Isolado','Ombros','Halteres','Abdução de ombro com halteres.','Suba até a linha dos ombros com leve flexão de cotovelo.','Usar impulso de tronco.'),
 ('Face pull','Isolado','Ombros','Polia','Puxada na altura do rosto.','Puxe a corda em direção ao rosto abrindo os cotovelos.','Usar carga excessiva.'),
 ('Rosca martelo','Isolado','Bíceps','Halteres','Rosca com pegada neutra.','Cotovelos fixos ao lado do corpo, subida controlada.','Balançar o corpo.'),
 ('Tríceps corda','Isolado','Tríceps','Polia','Extensão de tríceps na polia com corda.','Cotovelos fixos, estenda até o final abrindo a corda.','Afastar os cotovelos do corpo.'),
 ('Prancha frontal','Isolado','Core','Peso corporal','Isometria de core.','Corpo alinhado, abdômen e glúteo contraídos por 60s.','Elevar ou afundar o quadril.'),
 ('Abdominal','Isolado','Core','Peso corporal','Flexão de tronco.','Movimento controlado, sem puxar o pescoço.','Puxar a nuca com as mãos.'),
 ('Corrida moderada','Cardio','Cardio','Esteira','Corrida contínua em ritmo moderado.','20 a 30 minutos sem tiros.','Fazer tiros quando não prescrito.'),
 ('Búlgaro contralateral','Composto','Glúteo','Halteres','Búlgaro com carga no lado oposto.','Carga no lado contrário à perna de apoio, tronco levemente inclinado.','Perder o alinhamento do joelho.'),
 ('Stiff com barra','Composto','Posterior de coxa','Barra','Levantamento romeno.','Quadril para trás, coluna neutra, desça até alongar o posterior.','Arredondar a lombar.'),
 ('Glúteo na polia','Isolado','Glúteo','Polia','Extensão de quadril na polia.','Empurre o pé para trás contraindo o glúteo, sem arquear a lombar.','Compensar com a lombar.'),
 ('Cadeira flexora','Isolado','Posterior de coxa','Máquina','Flexão de joelhos na máquina.','Controle a volta, sem tirar o quadril do banco.','Soltar a carga na volta.'),
 ('Cadeira adutora','Isolado','Adutores','Máquina','Adução de quadril na máquina.','Amplitude confortável e movimento controlado.','Usar amplitude excessiva com tranco.');

-- SEED: GLOBAL TEMPLATES
DO $seed$
DECLARE
  _t1 UUID; _t2 UUID; _t3 UUID;
  _ex JSONB;
  _item JSONB;
  _pos INTEGER;
BEGIN
  INSERT INTO public.workout_templates (trainer_id, name, objective, description, estimated_minutes, notes)
  VALUES (NULL, 'GLÚTEO + QUADRÍCEPS', 'Hipertrofia de membros inferiores', 'Treino de exemplo STAY STRNG focado em glúteo e quadríceps.', 70, 'Treino de demonstração.') RETURNING id INTO _t1;
  INSERT INTO public.workout_templates (trainer_id, name, objective, description, estimated_minutes, notes)
  VALUES (NULL, 'SUPERIORES + ABDÔMEN', 'Hipertrofia de membros superiores', 'Treino de exemplo STAY STRNG focado em superiores e core.', 75, 'Treino de demonstração.') RETURNING id INTO _t2;
  INSERT INTO public.workout_templates (trainer_id, name, objective, description, estimated_minutes, notes)
  VALUES (NULL, 'GLÚTEO + POSTERIOR DE COXA', 'Hipertrofia de cadeia posterior', 'Treino de exemplo STAY STRNG focado em glúteo e posterior.', 70, 'Treino de demonstração.') RETURNING id INTO _t3;

  _ex := '[
    {"t":1,"n":"Cadeira abdutora 45°","s":3,"r":"2 aquecimentos + 1 válida até falha","c":"2-0-2","rest":90},
    {"t":1,"n":"Elevação pélvica","s":2,"r":"8-10","c":"2-1-2","rest":150},
    {"t":1,"n":"Afundo búlgaro","s":2,"r":"10 cada perna","c":"2-0-2","rest":60},
    {"t":1,"n":"Leg Press 45°","s":3,"r":"10-12","c":"2-0-2","rest":150},
    {"t":1,"n":"Agachamento sumô","s":2,"r":"8-10","c":"2-0-2","rest":150},
    {"t":1,"n":"Cadeira extensora","s":2,"r":"12-15","c":"2-1-2","rest":90},
    {"t":1,"n":"Abdutora na polia","s":2,"r":"12-15 cada lado","c":"2-0-2","rest":90},
    {"t":1,"n":"Panturrilha joelho estendido","s":4,"r":"12-15","c":"2-1-2","rest":90},
    {"t":1,"n":"Esteira inclinada leve","s":1,"r":"10-15 min","c":"-","rest":0},
    {"t":2,"n":"Remada máquina pegada fechada","s":3,"r":"8-10","c":"2-0-2","rest":120},
    {"t":2,"n":"Remada serrote","s":2,"r":"10-12 cada lado","c":"2-0-2","rest":120},
    {"t":2,"n":"Pulldown pegada neutra","s":2,"r":"10-12","c":"2-0-2","rest":150},
    {"t":2,"n":"Supino inclinado com halteres","s":2,"r":"10-12","c":"2-0-2","rest":150},
    {"t":2,"n":"Elevação lateral","s":3,"r":"12-15","c":"2-0-2","rest":120},
    {"t":2,"n":"Face pull","s":2,"r":"10-12","c":"2-1-2","rest":120},
    {"t":2,"n":"Rosca martelo","s":2,"r":"12-15","c":"2-0-2","rest":90},
    {"t":2,"n":"Tríceps corda","s":2,"r":"12-15","c":"2-0-2","rest":90},
    {"t":2,"n":"Prancha frontal","s":3,"r":"60s","c":"-","rest":60},
    {"t":2,"n":"Abdominal","s":3,"r":"15","c":"2-0-2","rest":60},
    {"t":2,"n":"Corrida moderada","s":1,"r":"20-30 min","c":"-","rest":0},
    {"t":3,"n":"Cadeira abdutora 45°","s":3,"r":"2 aquecimentos + 1 válida até falha","c":"2-0-2","rest":90},
    {"t":3,"n":"Elevação pélvica","s":2,"r":"8-10","c":"2-1-2","rest":150},
    {"t":3,"n":"Búlgaro contralateral","s":3,"r":"10 cada perna","c":"2-0-2","rest":90},
    {"t":3,"n":"Stiff com barra","s":2,"r":"8-10","c":"3-0-2","rest":150},
    {"t":3,"n":"Glúteo na polia","s":3,"r":"10 cada perna","c":"2-1-2","rest":90},
    {"t":3,"n":"Cadeira flexora","s":3,"r":"10-12 + drop set na última","c":"2-0-2","rest":120},
    {"t":3,"n":"Cadeira adutora","s":2,"r":"15-20","c":"2-0-2","rest":120},
    {"t":3,"n":"Panturrilha joelho estendido","s":4,"r":"12-15","c":"2-1-2","rest":90},
    {"t":3,"n":"Esteira inclinada leve","s":1,"r":"10-15 min","c":"-","rest":0}
  ]'::jsonb;

  _pos := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(_ex) LOOP
    _pos := _pos + 1;
    INSERT INTO public.template_exercises (template_id, exercise_id, position, sets, rep_range, cadence, rest_seconds)
    SELECT
      CASE (_item->>'t')::int WHEN 1 THEN _t1 WHEN 2 THEN _t2 ELSE _t3 END,
      e.id, _pos, (_item->>'s')::int, _item->>'r', _item->>'c', (_item->>'rest')::int
    FROM public.exercises e WHERE e.name = _item->>'n' LIMIT 1;
  END LOOP;
END
$seed$;