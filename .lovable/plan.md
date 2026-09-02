# STAY STRNG — Edição de exercícios, gráficos, dieta e experiência do aluno

## 1. Editar exercícios (painel do coach)

Cada card da lista de exercícios ganha botão **Editar**, que abre o mesmo formulário do cadastro já preenchido: nome, grupo muscular, equipamento, URL da imagem, URL do vídeo, cardio, ambiente (Academia / Em casa), execução e erros comuns. Salvar grava as alterações e atualiza a lista na hora. Também fica disponível arquivar (desativar) o exercício.

## 2. Gráficos de evolução em linha, sincronizados

- Medidas corporais (peso, cintura, quadril, braço, coxa, peito, % gordura) e cargas por exercício passam a ser gráficos de **linha**.
- Aluno (aba BLDNG) e coach (perfil do aluno) usam exatamente a mesma fonte de dados e o mesmo componente, então mostram sempre o mesmo.
- Acima do gráfico: filtros para ver **uma métrica isolada** ou **todas juntas**, mais legenda clicável para ligar/desligar cada linha.
- Filtro de período (3 / 6 / 12 meses / tudo) e tooltip com data e valor.

## 3. Dieta completa + feedbacks

**No painel do coach (aba Dieta do aluno):**
- Calculadora: TMB por **Mifflin-St Jeor, Harris-Benedict revisado, Katch-McArdle e Tinsley** (o coach escolhe o método), fator de atividade, ajuste de objetivo (déficit/manutenção/superávit) e **gasto energético diário** resultante.
- Distribuição de macros (proteína/carboidrato/gordura) por gramas, g/kg e % das calorias, com validação contra o total.
- Montagem do plano por refeições (café, lanche, almoço, pré, pós, jantar, ceia — nomes livres), com horário, itens e quantidades; cada refeição soma calorias e macros e o plano mostra o total do dia contra a meta.
- **Cadastro manual de alimentos e receitas** pelo coach (kcal, proteína, carboidrato, gordura por 100 g ou por porção), reutilizáveis em qualquer aluno.
- Publicar/despublicar o plano para o aluno; substituições por item (ex.: "arroz ou batata-doce").

**No app do aluno (aba Dieta):**
- Substitui o "Em breve" pelo plano publicado: meta calórica, macros do dia e refeições com itens, quantidades e horários. Se não houver plano, mantém o estado vazio atual.
- Campo de **feedback sobre a dieta** enviado ao coach.

**Feedbacks periódicos:**
- O coach define a periodicidade (semanal, quinzenal, mensal) e escreve o feedback; o aluno recebe **notificação visual imediata na Home** (badge/card destacado) com o texto, que some depois de lido. Fila de pendentes por data no painel do coach (o ciclo existente é reaproveitado).

## 4. Experiência do aluno

- **Modo Lista ↔ Modo Foco**: seletor na tela de execução, com a preferência salva no dispositivo — abre sempre no último modo usado.
- **Troca de treino pelo coach**: banner de aviso na Home ("Seu treino foi atualizado pelo coach") destacando o que mudou; o treino novo já passa a valer imediatamente, e o aviso some ao ser lido.
- **Gamificação mais desafiadora**: pontos por ação reduzidos (treino 100 → 60, ordem perfeita 75 → 40, foto 50 → 25, meta semanal 200 → 120) e limiares de nível aumentados (0 / 1.500 / 5.000 / 12.000 / 25.000 / 45.000 / 75.000). Pontos já acumulados são preservados.
- **Badges de consistência**: conquistas por sequência e volume (ex.: primeiro treino, 7 / 30 / 100 treinos, 4 / 12 / 24 semanas batendo a meta, 10 fotos enviadas, 10 ordens perfeitas), com vitrine na aba BLDNG e animação ao desbloquear.

## Detalhes técnicos

Banco (migrações):
- `foods` (alimentos/receitas do coach: nome, unidade base, kcal e macros), `diet_plans` (aluno, método TMB, fator de atividade, objetivo, kcal-alvo, macros, status publicado), `diet_meals` e `diet_meal_items`, `diet_feedbacks` (aluno → coach).
- `student_feedbacks` ganha marcação de leitura pelo aluno; nova coluna/flag de "treino atualizado" em `student_workouts` para o banner.
- Novas linhas em `achievements` para as badges de consistência; ajuste dos `min_points` em `levels`.
- Todas as tabelas com GRANTs e RLS: aluno lê o próprio plano publicado e escreve feedback; coach escreve para os seus alunos (`is_my_student`).

Frontend:
- Novo `src/components/charts/metric-line-chart.tsx` compartilhado entre BLDNG e perfil do coach (Recharts, séries toggláveis).
- Novo `src/lib/diet.ts` com as fórmulas de TMB, fatores de atividade e cálculo de macros.
- Nova aba de dieta no perfil do aluno (coach) e reescrita de `app.diet.tsx`.
- `POINTS` e `FALLBACK_LEVELS` em `src/lib/strng.ts` atualizados; helper de badges e persistência do modo de exibição em `localStorage`.
