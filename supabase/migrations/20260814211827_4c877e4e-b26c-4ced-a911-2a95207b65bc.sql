ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_goal_ml INTEGER NOT NULL DEFAULT 3000;

CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno gerencia sua agua" ON public.water_logs FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Treinador ve agua do aluno" ON public.water_logs FOR SELECT TO authenticated
  USING (public.is_my_student(auth.uid(), student_id));
CREATE TRIGGER update_water_logs_updated_at BEFORE UPDATE ON public.water_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  pose TEXT NOT NULL DEFAULT 'front',
  taken_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_photos TO authenticated;
GRANT ALL ON public.progress_photos TO service_role;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno gerencia suas fotos" ON public.progress_photos FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Treinador ve fotos do aluno" ON public.progress_photos FOR SELECT TO authenticated
  USING (public.is_my_student(auth.uid(), student_id));

CREATE TABLE IF NOT EXISTS public.student_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  sleep_quality INTEGER,
  energy INTEGER,
  soreness INTEGER,
  diet_adherence INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_checkins TO authenticated;
GRANT ALL ON public.student_checkins TO service_role;
ALTER TABLE public.student_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno gerencia seus checkins" ON public.student_checkins FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Treinador ve checkins do aluno" ON public.student_checkins FOR SELECT TO authenticated
  USING (public.is_my_student(auth.uid(), student_id));

CREATE POLICY "Aluno gerencia suas fotos de evolucao" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Treinador ve fotos de evolucao dos alunos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos' AND public.is_my_student(auth.uid(), ((storage.foldername(name))[1])::uuid));