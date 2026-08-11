# STAY STRNG — Evolução da plataforma (v2)

Atualização completa de landing, autenticação, painel do treinador e experiência do aluno.

## 1. Landing e autenticação

- Nova seção "Escolha seu plano" antes do CTA, com preço promocional em destaque e valor original riscado:
  - **BASE** R$ 67 (de R$ 97): app completo, treinos personalizados, biblioteca, gamificação, registro de cargas.
  - **PERFORMANCE** R$ 127 (de R$ 197) — selo "Mais Popular / Lançamento": tudo do Base + treinos avançados, métricas e gráficos, bônus de disciplina, feedback periódico.
  - **ELITE** R$ 247 (de R$ 397): tudo do Performance + consultoria individualizada, fotos de evolução e metas, prioridade no atendimento.
- `/auth`: remove a escolha de perfil — todo cadastro nasce como **aluno**. O treinador é apenas o administrador principal.
- "Esqueci minha senha": envio de e-mail de recuperação + nova página `/reset-password` para definir a nova senha.
- Ícone de olho para mostrar/ocultar senha em todos os campos de senha.

## 2. Vínculo automático de alunos

Todo novo aluno é vinculado automaticamente ao treinador principal no momento do cadastro (sem cadastro manual um a um). O treinador principal é identificado pelo seu e-mail — **preciso que você me informe o e-mail da sua conta de treinador** para configurar isso.

## 3. Painel do treinador

- Cards ampliados: faturamento estimado (soma dos planos dos alunos ativos), total de alunos, adesão média (%), evolução geral e treinos na semana.
- Bloco de destaque/gamificação: **Aluno da Semana** e **Aluno do Mês**, por pontos + frequência.
- Alertas visuais quando alunos batem a meta semanal, ao lado do bloco de alunos em risco.

## 4. Aba Alunos

- Barra de busca rápida por nome ou e-mail.
- Cada aluno tem plano (Base/Performance/Elite) e intervalo de feedback (7, 15 ou 30 dias).
- Listas separadas: **Feedback pendente** e **Feedback futuro**. Ao registrar o feedback, o aluno recebe ícone de check e migra para "futuro"; volta a pendente quando chega a data do próximo atendimento.

## 5. Perfil do aluno (visão do coach)

- Visão consolidada: objetivo, plano, pontuação total, treinos ativos, últimas sessões.
- Gráficos de evolução temporal de medidas corporais (peso, cintura, braço, coxa, quadril, % gordura) com comparativo entre meses. Registro feito tanto pelo aluno quanto pelo coach.
- Edição da prescrição direto no perfil: séries, repetições, cadência, carga recomendada e descanso por exercício; adicionar/remover exercícios e reordenar.
- Criar treino personalizado do zero para aquele aluno.
- Registro de feedback (texto) com data, alimentando o ciclo de feedback.

## 6. Aba Exercícios

- Busca por nome e filtro por grupo muscular (Peito, Costas, Abdômen, Bíceps, Tríceps, Quadríceps, Posterior, Panturrilha, Ombros, Cardio…).
- Formulário para cadastrar/editar exercícios, incluindo URL de imagem e de vídeo de demonstração e marcação do tipo (força ou cardio).

## 7. Aba Treinos

- Criar modelos do zero, editar, duplicar e atribuir a alunos.
- Editor de exercícios do modelo com séries, reps, cadência, descanso e carga recomendada.

## 8. Experiência do aluno

- Home mais enxuta e motivacional: nível, pontos, streak e treinos ativos em destaque.
- Ao abrir um treino: carga recomendada (kg e/ou descrição leve/moderada/pesada) e reps recomendadas visíveis por exercício.
- Alternância **Modo Foco ↔ Lista**: ver o treino inteiro de uma vez, com imagem/vídeo de demonstração de cada exercício.
- Exercícios de **cardio**: apenas registro de tempo (sem kg, reps e RPE).
- Ao finalizar: campo opcional de feedback rápido (dores/desconfortos) visível para o treinador.
- Foto pós-treino: apenas um envio por sessão; bônus de +50 concedido uma única vez.

## Detalhes técnicos

Migrações no banco:
- `profiles`: `plan` (base/performance/elite), `plan_price`, `feedback_interval_days`, `email` não é duplicado — busca por e-mail via função segura.
- Nova tabela `body_measurements` (aluno + coach vinculado podem inserir/editar/ler).
- Nova tabela `student_feedbacks` (coach escreve, aluno e coach leem) com `next_feedback_at`.
- `exercises`: `image_url`/`video_url` já existem; adicionar `is_cardio`.
- `workout_sessions`: `student_feedback` (texto) e `photo_bonus_awarded` para impedir bônus repetido; política de foto única por sessão.
- `trainer_students`: vínculo automático no gatilho `handle_new_user` usando o treinador principal (por e-mail).
- Permissões: coach só acessa dados dos seus alunos (`is_my_student`), aluno só os próprios; GRANTs em todas as tabelas novas.

Frontend: novas telas/rotas de reset de senha, editor de prescrição, editor de modelos, formulário de exercícios e gráficos (Recharts) de medidas; ajustes no modo de execução para cardio, lista e feedback final.
