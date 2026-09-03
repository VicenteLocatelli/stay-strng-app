
ALTER TABLE public.foods ALTER COLUMN trainer_id DROP NOT NULL;

DROP POLICY "Coach gerencia seus alimentos" ON public.foods;
DROP POLICY "Aluno lê alimentos do seu coach" ON public.foods;

-- Base global (trainer_id nulo) é visível a todos; alimentos do coach visíveis a ele e aos alunos dele
CREATE POLICY "Leitura de alimentos" ON public.foods
  FOR SELECT TO authenticated
  USING (trainer_id IS NULL OR trainer_id = auth.uid() OR public.is_my_student(trainer_id, auth.uid()));
CREATE POLICY "Coach gerencia seus alimentos" ON public.foods
  FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());
