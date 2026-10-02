ALTER TABLE public.diet_feedbacks ADD COLUMN IF NOT EXISTS coach_seen_at timestamptz;
GRANT UPDATE ON public.diet_feedbacks TO authenticated;
CREATE POLICY "Coach marca feedback de dieta como visto" ON public.diet_feedbacks
  FOR UPDATE TO authenticated
  USING (public.is_my_student(auth.uid(), student_id))
  WITH CHECK (public.is_my_student(auth.uid(), student_id));