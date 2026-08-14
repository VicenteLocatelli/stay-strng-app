# App do aluno — nova Home e navegação BLDNG

Reorganização visual da área do aluno, com novos blocos de acesso rápido e uma aba dedicada à evolução. Toda a lógica de execução de treino (séries, timer, bônus de ordem perfeita, foto pós-treino) permanece intacta.

## 1. Navegação inferior

Quatro abas: **Home · Treino · Dieta · BLDNG**.

- **Home**: visão motivacional + acessos rápidos (tela atual reformulada).
- **Treino**: lista completa dos treinos ativos e histórico de sessões.
- **Dieta**: tela placeholder premium — "Em breve · liberado pelo Coach".
- **BLDNG**: evolução do aluno (substitui a aba Perfil; dados de conta ficam no topo da própria aba).

## 2. Home do aluno

Ordem da tela:

1. Saudação + **"WHAT'S YOUR NEXT WIN?"** em destaque (mantido).
2. **Card de meta semanal premium**: 0/4 em número grande, anel/barra de progresso, nível, pontos e streak, com borda em degradê laranja/dourado.
3. **Grid de acesso rápido (2 colunas)**:
   - *Próximo treino* — nome do próximo treino da fila, nº de exercícios e botão de iniciar.
   - *Dieta* — bloqueado, "Em breve / liberado pelo Coach".
   - *Cardio* — abre o treino ativo que contém exercícios de cardio; se não houver, mostra aviso de que o coach ainda não prescreveu.
   - *BLDNG* — atalho para evolução.
4. **Bloco de Água**: barra de progresso em litros, botões − / + de 250 ml, meta editável pelo aluno (2–5 L) e **recomendação automática** calculada pelo peso atual mais recente do aluno. Registro diário, salvo no banco.
5. **Grid de treinos ativos**: cards visuais (2 colunas) com nome, objetivo, nº de exercícios, duração estimada e quantas vezes já foi feito na semana.

## 3. Aba BLDNG (evolução)

- Peso e medidas corporais: formulário de registro + gráficos de evolução temporal (peso, cintura, braço, coxa, quadril, % gordura).
- Gráficos de carga: evolução de carga/volume por exercício ao longo do tempo, a partir dos registros de série.
- Fotos de evolução: envio de fotos de atualização (frente/lado/costas), visíveis para o treinador.
- Questionário de feedback: formulário periódico (sono, dores, energia, dieta, observações) enviado ao treinador.
- Dados de conta (nome, objetivo, sair) no rodapé da aba.

## 4. Identidade visual

Dark mode #0B0C10, cards #1A1D24, laranja #FF5500 para ações e dourado #D4AF37 para gamificação. Sem azul e sem verde. Tudo via tokens do design system existente.

## Detalhes técnicos

Banco (novas tabelas com RLS + GRANTs; aluno gerencia os próprios registros, treinador vinculado apenas lê):
- `water_logs` (student_id, log_date, amount_ml) — único por aluno/dia.
- `profiles.water_goal_ml` — meta diária editável.
- `progress_photos` (student_id, storage_path, pose, taken_on) + bucket privado `progress-photos` com políticas de leitura para o aluno e o treinador vinculado.
- `student_checkins` (student_id, sono, energia, dores, adesão à dieta, notas, created_at) para o questionário.

Frontend:
- Novas rotas `src/routes/_authenticated/app.diet.tsx` e `app.bldng.tsx`; `app.profile.tsx` migra para BLDNG; `app.history.tsx` passa a ser o conteúdo da aba Treino junto da lista de treinos.
- Componentes novos: `WeeklyGoalCard`, `QuickActionCard`, `WaterTracker`, `WorkoutGrid`, `LoadProgressChart` (Recharts, já em uso no painel do coach).
- `app.tsx`: barra inferior com 4 itens e ícones (Home, Dumbbell, Apple/Utensils, TrendingUp).
- Correção de um erro de hidratação atual na página de autenticação (conteúdo renderizado no servidor diferente do cliente).
