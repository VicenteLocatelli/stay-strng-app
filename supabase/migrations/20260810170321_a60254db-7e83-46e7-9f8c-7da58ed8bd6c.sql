CREATE OR REPLACE FUNCTION public.link_student_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'trainer') THEN
    RAISE EXCEPTION 'Apenas treinadores podem vincular alunos';
  END IF;

  SELECT id INTO _student FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _student IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado com este e-mail';
  END IF;
  IF NOT public.has_role(_student, 'student') THEN
    RAISE EXCEPTION 'Este usuário não é um aluno';
  END IF;

  INSERT INTO public.trainer_students (trainer_id, student_id, active)
  VALUES (auth.uid(), _student, true)
  ON CONFLICT (trainer_id, student_id) DO UPDATE SET active = true;

  RETURN _student;
END;
$$;

REVOKE ALL ON FUNCTION public.link_student_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_student_by_email(text) TO authenticated;