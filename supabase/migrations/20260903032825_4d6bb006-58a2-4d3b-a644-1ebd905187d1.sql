
-- =========================
-- DIETA (inspirada na Plan-Diet)
-- =========================

CREATE TABLE public.foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_recipe BOOLEAN NOT NULL DEFAULT false,
  portion_label TEXT, -- ex.: "100 g", "1 unidade (50 g)"
  portion_g NUMERIC NOT NULL DEFAULT 100, -- gramas de referência dos macros
  kcal NUMERIC NOT NULL DEFAULT 0,
  protein_animal_g NUMERIC NOT NULL DEFAULT 0,
  protein_veg_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fiber_g NUMERIC NOT NULL DEFAULT 0,
  sodium_mg NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach gerencia seus alimentos" ON public.foods
  FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "Aluno lê alimentos do seu coach" ON public.foods
  FOR SELECT TO authenticated
  USING (public.is_my_student(trainer_id, auth.uid()));
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | published
  goal TEXT, -- hipertrofia | emagrecimento | manutencao | livre
  -- dados de cálculo
  weight_kg NUMERIC,
  body_fat NUMERIC,
  height_cm NUMERIC,
  age INTEGER,
  sex TEXT, -- M | F
  tmb_method TEXT NOT NULL DEFAULT 'mifflin', -- mifflin | harris | katch | tinsley
  activity_factor NUMERIC NOT NULL DEFAULT 1.5,
  training_days INTEGER NOT NULL DEFAULT 4,
  rest_days INTEGER NOT NULL DEFAULT 3,
  surplus_pct NUMERIC NOT NULL DEFAULT 10,  -- % excedente nos dias de treino
  deficit_pct NUMERIC NOT NULL DEFAULT -20, -- % déficit nos dias de descanso
  -- resultados calculados (snapshot)
  tmb_kcal NUMERIC,
  tdee_kcal NUMERIC,
  kcal_training NUMERIC,
  kcal_rest NUMERIC,
  -- distribuição de macros (% do total)
  protein_pct NUMERIC NOT NULL DEFAULT 30,
  fat_pct NUMERIC NOT NULL DEFAULT 25,
  carbs_pct NUMERIC NOT NULL DEFAULT 45,
  fiber_g NUMERIC NOT NULL DEFAULT 30,
  notes TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plans TO authenticated;
GRANT ALL ON public.diet_plans TO service_role;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach gerencia planos dos seus alunos" ON public.diet_plans
  FOR ALL TO authenticated
  USING (public.is_my_student(auth.uid(), student_id))
  WITH CHECK (public.is_my_student(auth.uid(), student_id));
CREATE POLICY "Aluno lê seu plano publicado" ON public.diet_plans
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND status = 'published');
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.diet_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_time TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_meals TO authenticated;
GRANT ALL ON public.diet_meals TO service_role;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach gerencia refeições dos planos dos seus alunos" ON public.diet_meals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diet_plans p WHERE p.id = plan_id AND public.is_my_student(auth.uid(), p.student_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.diet_plans p WHERE p.id = plan_id AND public.is_my_student(auth.uid(), p.student_id)));
CREATE POLICY "Aluno lê refeições do seu plano publicado" ON public.diet_meals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diet_plans p WHERE p.id = plan_id AND p.student_id = auth.uid() AND p.status = 'published'));

CREATE TABLE public.diet_meal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.diet_meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  custom_name TEXT, -- quando não vem da tabela foods
  quantity_g NUMERIC NOT NULL DEFAULT 100,
  substitutes TEXT, -- ex.: "arroz ou batata-doce"
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_meal_items TO authenticated;
GRANT ALL ON public.diet_meal_items TO service_role;
ALTER TABLE public.diet_meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach gerencia itens das refeições" ON public.diet_meal_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_meals m JOIN public.diet_plans p ON p.id = m.plan_id
    WHERE m.id = meal_id AND public.is_my_student(auth.uid(), p.student_id)))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.diet_meals m JOIN public.diet_plans p ON p.id = m.plan_id
    WHERE m.id = meal_id AND public.is_my_student(auth.uid(), p.student_id)));
CREATE POLICY "Aluno lê itens do seu plano publicado" ON public.diet_meal_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.diet_meals m JOIN public.diet_plans p ON p.id = m.plan_id
    WHERE m.id = meal_id AND p.student_id = auth.uid() AND p.status = 'published'));

CREATE TABLE public.diet_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.diet_plans(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.diet_feedbacks TO authenticated;
GRANT ALL ON public.diet_feedbacks TO service_role;
ALTER TABLE public.diet_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno envia e lê seus feedbacks de dieta" ON public.diet_feedbacks
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Coach lê feedbacks de dieta dos seus alunos" ON public.diet_feedbacks
  FOR SELECT TO authenticated
  USING (public.is_my_student(auth.uid(), student_id));

-- =========================
-- Suporte a notificações/avisos
-- =========================

-- Feedback do coach lido pelo aluno (notificação na Home)
ALTER TABLE public.student_feedbacks ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Banner "treino atualizado pelo coach"
ALTER TABLE public.student_workouts ADD COLUMN IF NOT EXISTS update_notice_at TIMESTAMP WITH TIME ZONE;
