# STAY STRNG — Plataforma de Acompanhamento (Primeira Entrega)

## Objetivo desta entrega
Fundação sólida e 100% funcional (sem dados fictícios): autenticação com papéis, dashboards de aluno e treinador, biblioteca de exercícios, criação e atribuição de treinos, execução do treino com registro de séries, descanso, foto pós-treino, histórico e base de gamificação.

## Identidade visual (obrigatória)
- Dark mode profundo: fundo `#0B0C10`, superfícies e cards `#1A1D24`.
- Texto primário branco puro `#FFFFFF`; hierarquia secundária em cinza metálico `#8C929D`.
- CTA e energia em Laranja Industrial `#FF5500` (botões principais, progresso de treino).
- Gamificação, níveis, badges e PRs em Dourado Tecnológico `#D4AF37`.
- Proibido azul corporativo e verde saúde em qualquer elemento da interface.
- Tipografia condensada e forte para títulos (estilo atlético), sans neutra para textos.
- Sem gradientes exagerados; contraste alto, muito espaço negativo, gráficos limpos.
- Assinatura "DON'T CHASE PERFECTION. STAY STRNG." em login, home do aluno e rodapé.
- Mobile-first para o aluno (barra de navegação inferior, botões grandes); painel do treinador com sidebar responsiva.


## Backend (Lovable Cloud)
Ativar Cloud e criar o esquema relacional com segurança por linha desde o início.

Tabelas desta fase:
- `profiles` (nome, avatar, objetivo, data de início)
- `user_roles` (tabela separada, enum `trainer` / `student`, com função `has_role`)
- `trainer_students` (vínculo treinador ↔ aluno)
- `exercises` (nome, categoria, grupo muscular, equipamento, vídeo, imagem, descrição, execução, erros comuns, ativo)
- `workout_templates` + `template_exercises` (biblioteca do treinador)
- `student_workouts` + `workout_exercises` (cópia personalizada por aluno, com versão, objetivo, duração e status ativo — **sem dia da semana fixo**)
- `weekly_targets` (meta de treinos por semana definida pelo treinador para cada aluno)
- `workout_sessions` (data, início, fim, volume, duração, status)
- `exercise_logs` / `workout_sets` (série, carga, repetições, RPE, observação — nunca sobrescritos)
- `workout_completion_photos` (foto vinculada à sessão, privada)
- Gamificação base: `points_transactions`, `levels`, `achievements`, `student_achievements`, `streaks` (por semana, não por dia)


Regras de acesso:
- Aluno lê/escreve apenas as próprias linhas.
- Treinador acessa apenas alunos vinculados a ele.
- Fotos em bucket privado, acessadas por URL assinada.
- Histórico é somente inserção; alterações de treino criam nova versão.

## Modelo de treinos livres (sem dias fixos)
- O treinador publica um **menu de treinos ativos** para a semana do aluno; não há agendamento por dia.
- O aluno escolhe livremente qual treino executar em qualquer dia, na ordem que quiser, quantas vezes for necessário.
- A meta semanal (ex.: 4 treinos/semana) é definida pelo treinador e usada para progresso, aderência e streak.
- O calendário do aluno é **registro visual do passado**: destaca em laranja os dias com sessões concluídas, sem cobrar dias planejados.

## Gamificação desacoplada do dia
- Streak conta **semanas em que a meta de treinos foi atingida**, não dias consecutivos.
- Pontos por treino concluído, semana completa e PRs; trocar a ordem ou o dia dos treinos nunca penaliza.
- Níveis, XP e PRs exibidos em Dourado Tecnológico.

## Telas do aluno
1. **Login / cadastro / recuperação de senha** com a marca.
2. **Home**: "Olá, [nome]" + "WHAT'S YOUR NEXT WIN?", progresso da semana (ex.: 2/4 treinos), menu dos treinos ativos com botão COMEÇAR TREINO em cada card, streak semanal, STRNG Level com barra de XP, STRNG Points e resumo da semana.
3. **Execução do treino em tela cheia**: modo foco sem navegação, um exercício por vez com mídia, instruções, prescrição (séries × reps, carga, cadência, descanso), registro de cada série (carga, reps, RPE opcional) e cronômetro de descanso grande com iniciar/pausar/pular.
4. **Workout Complete**: resumo (exercícios, séries, volume, tempo), foto pós-treino obrigatória, e atualização de pontos, streak e nível.
5. **Histórico / Calendário**: calendário marcando os dias efetivamente treinados, lista de sessões e evolução por exercício.

## Telas do treinador
1. **Dashboard**: alunos ativos, treinos realizados, aderência média, check-ins pendentes e um bloco de destaque **ALUNOS EM RISCO** — cartões com borda/etiqueta laranja mostrando dias sem treinar, meta semanal não atingida ou check-in pendente, clicáveis direto para o perfil.
2. **Alunos**: lista com busca e filtros, criação/edição de aluno, definição da meta semanal de treinos, perfil do aluno com visão geral, treinos e performance.
3. **Exercícios**: biblioteca com busca e filtros por grupo muscular e equipamento; criar e editar.
4. **Treinos**: criar template com exercícios ordenados (séries, reps, carga, cadência, descanso, técnica, observação), duplicar e publicar no menu ativo do aluno gerando cópia independente.

Sidebar já preparada com os itens futuros (Evolução, Check-ins, Metas, Gamificação, Mensagens) marcados como próximas fases.


## Dados iniciais
Os três treinos de exemplo (Segunda, Quarta, Sexta) e os exercícios citados são criados como templates reais no banco, junto com os níveis (START → UNSTOPPABLE) e badges iniciais — dados reais, não simulados.

## Fora desta entrega (fases seguintes)
Avaliação corporal e gráficos completos, fotos de evolução com comparação, check-ins semanais, metas, mensagens, notificações, Journey, relatório mensal e STRNG Score.

## Notas técnicas
- TanStack Start com rotas separadas: `/`, `/auth`, `/app/*` (aluno) e `/coach/*` (treinador), redirecionamento pós-login conforme o papel.
- Papéis em tabela dedicada com função `security definer` para evitar escalonamento de privilégio.
- Leituras via server functions autenticadas; upload de fotos direto ao storage privado.
- Gráficos com Recharts, adaptados para telas pequenas.
