# STAY STRNG — Plataforma de Acompanhamento (Primeira Entrega)

## Objetivo desta entrega
Fundação sólida e 100% funcional (sem dados fictícios): autenticação com papéis, dashboards de aluno e treinador, biblioteca de exercícios, criação e atribuição de treinos, execução do treino com registro de séries, descanso, foto pós-treino, histórico e base de gamificação.

## Identidade visual
- Tema escuro premium, alto contraste, um único acento vibrante (verde-limão elétrico) sobre grafite/preto.
- Tipografia condensada e forte para títulos (estilo atlético), sans neutra para textos.
- Cards de cantos suaves, sem gradientes exagerados, muito espaço em branco escuro, gráficos limpos.
- Assinatura "DON'T CHASE PERFECTION. STAY STRNG." presente em login, home do aluno e rodapé.
- Mobile-first para o aluno (barra de navegação inferior, botões grandes); painel do treinador com sidebar responsiva.

## Backend (Lovable Cloud)
Ativar Cloud e criar o esquema relacional com segurança por linha desde o início.

Tabelas desta fase:
- `profiles` (nome, avatar, objetivo, data de início)
- `user_roles` (tabela separada, enum `trainer` / `student`, com função `has_role`)
- `trainer_students` (vínculo treinador ↔ aluno)
- `exercises` (nome, categoria, grupo muscular, equipamento, vídeo, imagem, descrição, execução, erros comuns, ativo)
- `workout_templates` + `template_exercises` (biblioteca do treinador)
- `student_workouts` + `workout_exercises` (cópia personalizada por aluno, com versão, dia da semana, objetivo, duração)
- `workout_sessions` (data, início, fim, volume, duração, status)
- `exercise_logs` / `workout_sets` (série, carga, repetições, RPE, observação — nunca sobrescritos)
- `workout_completion_photos` (foto vinculada à sessão, privada)
- Gamificação base: `points_transactions`, `levels`, `achievements`, `student_achievements`, `streaks`

Regras de acesso:
- Aluno lê/escreve apenas as próprias linhas.
- Treinador acessa apenas alunos vinculados a ele.
- Fotos em bucket privado, acessadas por URL assinada.
- Histórico é somente inserção; alterações de treino criam nova versão.

## Telas do aluno
1. **Login / cadastro / recuperação de senha** com a marca.
2. **Home**: "Olá, [nome]" + "WHAT'S YOUR NEXT WIN?", card do treino de hoje com botão COMEÇAR TREINO (ou "Hoje é dia de recuperação" + próximo treino), streak, STRNG Level com barra de XP, STRNG Points, aderência e resumo da semana.
3. **Execução do treino**: um exercício por vez com mídia, instruções, prescrição (séries × reps, carga, cadência, descanso), registro de cada série (carga, reps, RPE opcional) e cronômetro de descanso com iniciar/pausar/pular.
4. **Workout Complete**: resumo (exercícios, séries, volume, tempo), foto pós-treino obrigatória, e atualização de pontos, streak e nível.
5. **Histórico**: sessões anteriores e evolução por exercício.

## Telas do treinador
1. **Dashboard**: alunos ativos, treinos realizados, aderência média, alunos em risco, e lista "Alunos que precisam de atenção".
2. **Alunos**: lista com busca e filtros, criação/edição de aluno, perfil do aluno com visão geral, treinos e performance.
3. **Exercícios**: biblioteca com busca e filtros por grupo muscular e equipamento; criar e editar.
4. **Treinos**: criar template com exercícios ordenados (séries, reps, carga, cadência, descanso, técnica, observação), duplicar e atribuir a um aluno gerando cópia independente.

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
