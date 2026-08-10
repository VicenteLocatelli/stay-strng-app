CREATE POLICY "workout_photos_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "workout_photos_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'workout-photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_my_student(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );