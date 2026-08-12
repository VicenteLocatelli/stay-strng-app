CREATE OR REPLACE FUNCTION public.my_student_emails()
RETURNS TABLE (student_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ts.student_id, u.email::text
  FROM public.trainer_students ts
  JOIN auth.users u ON u.id = ts.student_id
  WHERE ts.trainer_id = auth.uid() AND ts.active;
$$;

REVOKE ALL ON FUNCTION public.my_student_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_student_emails() TO authenticated;