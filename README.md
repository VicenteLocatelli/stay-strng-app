# STAY STRNG APP

Crie uma aplicação web responsiva, mobile-first, moderna e premium para a minha consultoria de treinamento físico chamada:

STAY STRNG

O aplicativo será uma plataforma de acompanhamento de alunos de uma consultoria online de musculação e treinamento físico.

A filosofia da marca é:

"DON'T CHASE PERFECTION. STAY STRNG."

A ideia central do produto é permitir que treinador e aluno acompanhem uma jornada completa de evolução:

TREINAR → REGISTRAR → ACOMPANHAR → EVOLUIR → CONQUISTAR

Não quero criar apenas uma ficha de treino digital.

Quero criar uma plataforma completa de acompanhamento individual, onde o aluno tenha seu treino personalizado, registre sua performance, acompanhe medidas e composição corporal, receba metas, conquistas e níveis, e consiga visualizar sua evolução ao longo do tempo.

O treinador deverá possuir um painel gerencial completo para acompanhar todos os alunos, prescrever treinos, analisar evolução, visualizar alertas e se comunicar com os alunos.

==================================================

1. OBJETIVO PRINCIPAL

==================================================

Criar um sistema que permita:

- cadastro e autenticação de usuários;

- diferenciação entre treinador e aluno;

- criação e prescrição de treinos personalizados;

- biblioteca de exercícios;

- vídeos/imagens de demonstração dos exercícios;

- séries, repetições, carga, cadência e descanso;

- registro das cargas e repetições realizadas pelo aluno;

- histórico completo de treinamento;

- gráficos de evolução;

- avaliação corporal;

- peso;

- medidas corporais;

- percentual de gordura;

- fotos de evolução;

- foto obrigatória ao finalizar o treino;

- check-ins semanais;

- metas;

- gamificação;

- pontos;

- níveis;

- badges;

- conquistas;

- streak de treinos;

- jornada do aluno;

- comunicação entre treinador e aluno;

- notificações;

- dashboard gerencial;

- alertas para alunos que precisam de atenção;

- relatórios de evolução.

O sistema deve ser preparado para futuramente suportar vários treinadores e muitos alunos.

==================================================

2. IDENTIDADE VISUAL

==================================================

A aplicação deve seguir a identidade da STAY STRNG.

Estética:

- moderna;

- forte;

- minimalista;

- premium;

- tecnológica;

- esportiva;

- elegante;

- motivadora.

Evitar aparência de aplicativo genérico de academia.

A interface deve ter bastante espaço visual, tipografia forte, cards modernos, gráficos limpos e hierarquia clara.

Utilizar uma identidade visual predominantemente escura, com alto contraste e detalhes de destaque.

O nome STAY STRNG deve aparecer de forma consistente na aplicação.

O slogan da marca:

"DON'T CHASE PERFECTION. STAY STRNG."

Não utilizar excesso de elementos, sombras ou gradientes exagerados.

O design deve parecer uma mistura de:

fitness premium + tecnologia + performance + acompanhamento personalizado.

==================================================

3. RESPONSIVIDADE

==================================================

O aluno utilizará principalmente o aplicativo pelo celular.

Portanto:

- mobile-first;

- botões grandes;

- navegação simples;

- cards fáceis de tocar;

- textos legíveis;

- gráficos adaptados para celular.

O painel do treinador deverá funcionar muito bem em:

- desktop;

- notebook;

- tablet.

No celular, o painel do treinador também deve continuar utilizável.

==================================================

4. TIPOS DE USUÁRIO

==================================================

Criar inicialmente dois roles:

TRAINER

STUDENT

TRAINER:

Pode:

- visualizar seus alunos;

- criar alunos;

- editar alunos;

- criar exercícios;

- criar treinos;

- editar treinos;

- prescrever cargas;

- definir repetições;

- definir cadência;

- definir descanso;

- acompanhar execução;

- visualizar gráficos;

- visualizar avaliações;

- visualizar fotos;

- criar metas;

- criar conquistas;

- enviar mensagens;

- visualizar check-ins;

- adicionar observações;

- visualizar alertas;

- acompanhar aderência.

STUDENT:

Pode:

- visualizar apenas seus próprios dados;

- visualizar seu treino;

- executar treino;

- registrar séries;

- registrar carga;

- registrar repetições;

- registrar RPE;

- finalizar treino;

- enviar foto pós-treino;

- visualizar histórico;

- visualizar evolução;

- cadastrar medidas;

- cadastrar peso;

- cadastrar composição corporal;

- enviar fotos de avaliação;

- responder check-ins;

- visualizar metas;

- visualizar badges;

- visualizar pontos;

- visualizar nível;

- visualizar streak;

- visualizar Journey;

- conversar com o treinador.

IMPORTANTE:

Um aluno jamais pode visualizar os dados de outro aluno.

Um treinador só pode visualizar alunos vinculados à sua conta.

Implementar controle de acesso adequado.

==================================================

5. AUTENTICAÇÃO

==================================================

Criar:

- login;

- cadastro;

- logout;

- recuperação de senha;

- sessão persistente;

- controle de acesso por role.

Após login:

TRAINER → Dashboard do treinador

STUDENT → Dashboard do aluno

==================================================

6. DASHBOARD DO ALUNO

==================================================

Criar uma Home moderna.

Mostrar:

Olá, [nome].

"STAY STRNG."

CARD PRINCIPAL:

Treino de hoje

Nome do treino

Exemplo:

GLÚTEO + QUADRÍCEPS

Botão:

COMEÇAR TREINO

Também mostrar:

🔥 Streak atual

🏆 STRNG Level

⭐ STRNG Points

🎯 Meta atual

📈 Aderência

Se não houver treino programado:

"Hoje é dia de recuperação."

Mostrar próximo treino.

Mostrar também:

Última conquista

Último PR

Resumo da semana

Exemplo:

3/3 treinos concluídos

100% aderência

==================================================

7. SISTEMA DE TREINOS

==================================================

O treinador deve conseguir criar treinos personalizados.

Estrutura:

TREINO

- nome;

- objetivo;

- descrição;

- dia da semana;

- duração estimada;

- observações;

- lista de exercícios.

Cada exercício possui:

- exercício;

- ordem;

- séries;

- repetições;

- carga recomendada;

- faixa de repetições;

- cadência;

- descanso;

- técnica;

- observação;

- vídeo;

- imagem;

- músculo principal.

Exemplo:

ELEVAÇÃO PÉLVICA

2 × 8–10

Carga:

80 kg

Cadência:

2-1-2

Descanso:

2–3 min

Instrução:

"Suba o quadril contraindo os glúteos e pause 1 segundo no topo. Evite hiperestender a lombar."

==================================================

8. BIBLIOTECA DE EXERCÍCIOS

==================================================

Criar uma biblioteca de exercícios.

Cada exercício deverá possuir:

- nome;

- categoria;

- grupo muscular;

- equipamento;

- vídeo;

- imagem;

- descrição;

- execução;

- erros comuns;

- observações;

- status ativo/inativo.

O treinador deverá poder:

- criar exercício;

- editar exercício;

- pesquisar exercício;

- filtrar por grupo muscular;

- filtrar por equipamento.

Também permitir futuramente adicionar vídeos próprios.

==================================================

9. EXECUÇÃO DO TREINO

==================================================

Ao clicar em:

COMEÇAR TREINO

mostrar o primeiro exercício.

Exibir:

Nome

Vídeo/imagem

Instrução

Séries

Repetições

Carga recomendada

Cadência

Descanso

Botão:

INICIAR SÉRIE

Depois da série:

CARGA UTILIZADA

REPETIÇÕES REALIZADAS

Opcional:

RPE

O aluno deve conseguir registrar cada série individualmente.

Exemplo:

Série 1:

80 kg

10 reps

Série 2:

80 kg

9 reps

Série 3:

75 kg

10 reps

Salvar tudo no histórico.

Após concluir o exercício:

PRÓXIMO EXERCÍCIO

==================================================

10. HISTÓRICO DE PERFORMANCE

==================================================

Nunca apagar registros antigos.

Cada sessão deve armazenar:

- data;

- horário;

- exercício;

- carga;

- repetições;

- séries;

- RPE;

- observações.

Exemplo:

01/08

Leg Press

120 kg × 10

08/08

Leg Press

130 kg × 10

15/08

Leg Press

140 kg × 10

Mostrar histórico.

==================================================

11. PROGRESSÃO

==================================================

O treinador pode definir uma carga recomendada.

Não inventar cargas automaticamente.

Permitir que o treinador configure regras de progressão.

Exemplo:

"Se completar todas as séries no topo da faixa de repetições com boa execução, aumentar 2,5–5% na próxima sessão."

O sistema pode mostrar:

Última sessão:

130 kg × 10

Carga prescrita:

135 kg

Mas a decisão final permanece com o treinador.

==================================================

12. DESCANSO

==================================================

Após cada série, mostrar contador de descanso.

Exemplo:

DESCANSO

02:00

Permitir:

- iniciar;

- pausar;

- pular.

O tempo deve ser definido individualmente para cada exercício.

==================================================

13. CADÊNCIA

==================================================

Mostrar a cadência prescrita de maneira simples.

Exemplo:

2–1–2

Explicação:

2 segundos descida

1 segundo pausa

2 segundos subida

O treinador pode definir a cadência por exercício.

==================================================

14. FINALIZAÇÃO DO TREINO

==================================================

Ao concluir todos os exercícios:

mostrar tela:

WORKOUT COMPLETE

"Treino concluído."

Resumo:

Exercícios:

8

Séries:

22

Volume:

X kg

Tempo:

XX min

Depois solicitar:

FOTO PÓS-TREINO

Texto:

"Registre sua foto para concluir seu treino."

O aluno deverá tirar ou selecionar uma foto.

Depois:

TREINO CONCLUÍDO ✅

Atualizar:

- streak;

- STRNG Points;

- nível;

- metas;

- badges;

- aderência;

- Journey.

A foto ficará vinculada à sessão.

==================================================

15. FOTOS DE TREINO

==================================================

A foto de conclusão do treino deve ficar separada das fotos de avaliação corporal.

Dados:

- aluno;

- treino;

- sessão;

- data;

- horário;

- imagem.

Fotos privadas.

==================================================

16. AVALIAÇÃO CORPORAL

==================================================

Criar módulo:

EVOLUTION

O aluno poderá registrar:

PESO

- data;

- peso;

- observações.

MEDIDAS:

- pescoço;

- ombros;

- tórax;

- cintura;

- abdômen;

- quadril;

- braço direito;

- braço esquerdo;

- antebraço;

- coxa direita;

- coxa esquerda;

- panturrilha direita;

- panturrilha esquerda.

Permitir que o treinador escolha quais medidas acompanhar.

==================================================

17. COMPOSIÇÃO CORPORAL

==================================================

Permitir registrar:

- percentual de gordura;

- método;

- data;

- peso;

- massa gorda;

- massa muscular;

- observações.

Métodos:

- adipometria;

- bioimpedância;

- outro.

Sempre salvar o método junto com o resultado.

Não comparar automaticamente resultados obtidos por métodos diferentes como se fossem equivalentes.

==================================================

18. FOTOS DE EVOLUÇÃO

==================================================

Criar avaliação fotográfica.

Permitir:

- frente;

- costas;

- lateral direita;

- lateral esquerda.

Cada avaliação possui:

- data;

- fotos;

- observações.

Criar comparação:

ANTES × ATUAL

Preferencialmente com:

- slider;

- lado a lado.

As fotos são privadas.

==================================================

19. GRÁFICOS

==================================================

Criar gráficos de:

- peso;

- percentual de gordura;

- cintura;

- quadril;

- braço;

- coxa;

- panturrilha;

- carga;

- repetições;

- volume;

- aderência;

- frequência.

Exemplo:

Peso:

98 kg → 91 kg

Cintura:

102 cm → 94 cm

Leg Press:

120 kg × 10 → 140 kg × 10

O aluno poderá selecionar o período:

- 30 dias;

- 90 dias;

- 6 meses;

- 1 ano;

- todo período.

==================================================

20. DASHBOARD DO TREINADOR

==================================================

Criar sidebar com:

Dashboard

Alunos

Treinos

Exercícios

Evolução

Check-ins

Metas

Gamificação

Mensagens

Configurações

Dashboard mostrar:

ALUNOS ATIVOS

TREINOS REALIZADOS

ADERÊNCIA MÉDIA

ALUNOS EM RISCO

CHECK-INS PENDENTES

Também mostrar lista:

ALUNOS QUE PRECISAM DE ATENÇÃO

Exemplos:

"João — 8 dias sem treino"

"Maria — check-in pendente"

"Carlos — aderência 61%"

"Clique para visualizar"

==================================================

21. PERFIL DO ALUNO — TREINADOR

==================================================

Ao clicar em um aluno:

Mostrar:

Nome

Foto

Objetivo

Data de início

STRNG Level

STRNG Points

Streak

Aderência

Abas:

Overview

Treinos

Performance

Medidas

Composição

Fotos

Check-ins

Metas

Conquistas

Journey

Mensagens

Notas

==================================================

22. CHECK-IN SEMANAL

==================================================

Criar check-in simples.

Perguntas:

Como está sua energia?

1–5

Como está seu sono?

1–5

Como está seu estresse?

1–5

Como está sua motivação?

1–5

Como está sua alimentação/rotina?

1–5

Sentiu alguma dificuldade?

Campo de texto.

Existe algo que gostaria que eu ajustasse?

Campo de texto.

O treinador visualiza histórico.

==================================================

23. ADERÊNCIA

==================================================

Comparar:

TREINOS PLANEJADOS

vs.

TREINOS CONCLUÍDOS

Exemplo:

36 planejados

34 concluídos

94% aderência

Mostrar gráfico.

==================================================

24. RPE

==================================================

Permitir registro de RPE.

Escala:

1 = muito fácil

10 = esforço máximo

Pode ser registrado:

- por exercício;

- ou no final do treino.

Permitir configuração pelo treinador.

==================================================

25. GAMIFICAÇÃO

==================================================

Criar sistema:

STRNG POINTS

O aluno ganha pontos por:

- concluir treino;

- completar semana;

- fazer check-in;

- completar avaliação;

- cumprir meta;

- conquistar PR;

- manter consistência;

- tempo de consultoria.

O treinador deve conseguir configurar os valores.

Exemplo:

Treino concluído:

+100 pontos

Check-in:

+50

Meta:

+300

PR:

+200

==================================================

26. STRNG LEVEL

==================================================

Criar níveis.

Sugestão:

LEVEL 1 — START

LEVEL 2 — BUILD

LEVEL 3 — GRIND

LEVEL 4 — STRONG

LEVEL 5 — ELITE

LEVEL 6 — UNSTOPPABLE

Os pontos necessários para subir de nível devem ser configuráveis.

Mostrar:

STRNG LEVEL

barra de progresso

"1.250 / 2.000 XP"

==================================================

27. STREAK

==================================================

Criar:

🔥 CURRENT STREAK

🔥 BEST STREAK

O streak deve respeitar a frequência programada.

Se o aluno treina 3 vezes por semana, ele não precisa treinar todos os dias para manter streak.

Não incentivar excesso de treinamento.

==================================================

28. BADGES

==================================================

Criar badges.

Exemplos:

FIRST STRNG

Primeiro treino

7 DAYS STRNG

7 sessões consecutivas

30 DAYS STRNG

30 sessões

FIRST PR

Primeiro recorde pessoal

100 WORKOUTS

100 treinos

90 DAYS STRNG

90 dias

ONE YEAR STRNG

1 ano

Também permitir badges personalizados.

==================================================

29. METAS

==================================================

Criar:

MINHAS METAS

Tipos:

- performance;

- consistência;

- composição corporal;

- condicionamento;

- estética;

- personalizado.

Exemplo:

META

Leg Press

140 kg × 10

Atual:

130 kg × 10

Progresso:

92%

O treinador pode criar e editar metas.

==================================================

30. JOURNEY

==================================================

Criar timeline da jornada.

Exemplo:

01/08

Primeiro treino

08/08

7 treinos

20/08

Primeiro PR

01/09

Primeira avaliação

30/09

30 treinos

Mostrar marcos importantes.

Também permitir inserir fotos.

==================================================

31. STRNG SCORE

==================================================

Criar futuramente um indicador:

STRNG SCORE

0–100

Composição:

- aderência;

- consistência;

- performance;

- check-ins;

- metas;

- avaliações.

Não utilizar como nota de valor pessoal.

Mostrar componentes.

==================================================

32. COMUNICAÇÃO

==================================================

Criar mensagens entre treinador e aluno.

Interface semelhante a chat simples.

Treinador pode enviar:

"Excelente evolução essa semana."

Aluno pode responder.

Criar notificações.

==================================================

33. NOTIFICAÇÕES

==================================================

Criar notificações para:

- novo treino;

- novo exercício;

- mensagem;

- check-in;

- avaliação;

- meta;

- badge;

- nível;

- treino pendente.

==================================================

34. RELATÓRIO MENSAL

==================================================

Criar futuramente relatório:

SEU MÊS — STAY STRNG

12 treinos

92% aderência

+10 kg Leg Press

-3 cm cintura

8 dias streak

2 badges

STRNG LEVEL UP

Mensagem do treinador.

==================================================

35. BANCO DE DADOS

==================================================

Criar arquitetura relacional.

Tabelas/entidades sugeridas:

users

profiles

trainers

students

exercises

workout_templates

workout_versions

student_workouts

workout_exercises

workout_sets

workout_sessions

exercise_logs

checkins

body_measurements

body_composition

progress_photos

workout_completion_photos

goals

goal_progress

achievements

student_achievements

levels

points_transactions

streaks

trainer_notes

messages

notifications

Criar relacionamentos corretamente.

Nunca sobrescrever histórico de performance.

Usar timestamps.

Usar IDs únicos.

==================================================

36. SEGURANÇA

==================================================

Implementar controle de acesso.

Aluno só vê seus dados.

Treinador só vê alunos vinculados.

Dados sensíveis devem possuir proteção adequada.

Fotos são privadas.

Não permitir acesso direto indevido a arquivos.

Considerar princípios da LGPD.

Não utilizar informações de saúde para diagnósticos automáticos.

O sistema é uma ferramenta de acompanhamento, não substitui avaliação médica ou outros profissionais de saúde.

==================================================

37. EXEMPLO DE TREINO

==================================================

Utilizar este treino como exemplo inicial para testar o sistema:

SEGUNDA — GLÚTEO + QUADRÍCEPS

Cadeira abdutora 45°

2 aquecimentos + 1 válida até falha

Descanso: 1–2 min

Execução:

Quadril fixo no banco e movimento controlado.

Na válida: chegue perto da falha mantendo controle, sem tranco.

Elevação pélvica

2×8–10

Descanso: 2–3 min

Execução:

Suba o quadril contraindo glúteos, pause 1s no topo.

Não hiperestenda a lombar.

Afundo búlgaro

2×10 cada perna

Descanso: 1 min cada lado

Execução:

Tronco levemente inclinado à frente para priorizar glúteo.

Desça com controle. Use apoio se precisar manter equilíbrio.

Leg Press 45°

3×10–12

Descanso: 2–3 min

Execução:

Pés firmes, joelhos alinhados com os pés.

Desça sem tirar a lombar do encosto e não trave os joelhos no topo.

Agachamento sumô

2×8–10

Descanso: 2–3 min

Execução:

Peito aberto, coluna neutra e joelhos na linha dos pés.

Suba empurrando o chão sem deixar os joelhos caírem para dentro.

Cadeira extensora

2×12–15

Descanso: 1–2 min

Execução:

Ajuste para o joelho ficar alinhado com o eixo da máquina.

Controle a descida e evite chutar a carga.

Abdutora na polia

2×12–15

Descanso: 1–2 min cada lado

Execução:

Tronco parado, segure em um apoio.

O movimento vem do quadril, sem girar o corpo.

Amplitude boa sem compensar com a lombar.

Panturrilha joelho estendido

4×12–15

Descanso: 1–2 min

Execução:

Suba ao máximo, pause 1s no topo e desça até alongar.

Joelho estendido, mas sem travar agressivamente.

Cardio:

Esteira inclinada leve

10–15 min

Ritmo:

"Dá pra conversar."

QUARTA — SUPERIORES + ABDÔMEN

Remada máquina pegada fechada

3×8–10

Descanso: 2 min

Remada serrote

2×10–12

Descanso: 2 min cada lado

Pulldown pegada neutra

2×10–12

Descanso: 2–3 min

Supino inclinado com halteres

2×10–12

Descanso: 2–3 min

Elevação lateral

3×12–15

Descanso: 2 min

Face pull

2×10–12

Descanso: 2 min

Rosca martelo

2×12–15

Descanso: 1–2 min

Tríceps corda

2×12–15

Descanso: 1–2 min

Prancha frontal

3×60s

Descanso: 1 min

Abdominal

3×15

Descanso: 1 min

Cardio:

Corrida moderada ou simulador de escada leve

20–30 min

Sem tiros.

SEXTA — GLÚTEO + POSTERIOR DE COXA

Cadeira abdutora 45°

2 aquecimentos + 1 válida até falha

Descanso: 1–2 min

Elevação pélvica

2×8–10

Descanso: 2–3 min

Búlgaro contralateral

3×10 cada perna

Descanso: 1–2 min cada lado

Stiff com barra

2×8–10

Descanso: 2–3 min

Glúteo na polia

3×10 cada perna

Descanso: 1–2 min cada lado

Cadeira flexora

3×10–12 + drop set na última

Descanso: 2 min

Drop set:

reduzir 20% da carga e continuar sem perder técnica.

Cadeira adutora

2×15–20

Descanso: 2 min

Panturrilha joelho estendido

4×12–15

Descanso: 1–2 min

Cardio:

Esteira inclinada leve

10–15 min

Ritmo:

"Dá pra conversar."

Esse treino é apenas um exemplo de demonstração do sistema e não deve ser tratado como prescrição universal.

==================================================

38. EXPERIÊNCIA DO ALUNO

==================================================

Quero que o aluno sinta que possui um COACH DIGITAL.

A experiência deve ser:

simples;

motivadora;

personalizada;

visual;

progressiva.

Ao abrir o aplicativo:

"WHAT'S YOUR NEXT WIN?"

Mostrar a próxima ação:

"Treino de hoje"

Depois:

"Complete seu treino."

Depois:

"Registre sua evolução."

Depois:

"Desbloqueie sua conquista."

A experiência deve reforçar a ideia de progresso.

==================================================

39. EXPERIÊNCIA DO TREINADOR

==================================================

O treinador precisa conseguir administrar sua carteira rapidamente.

Priorizar:

- poucos cliques;

- filtros;

- pesquisa;

- templates;

- duplicar treino;

- copiar treino;

- editar treino;

- visualizar histórico;

- alertas.

Por exemplo:

Selecionar aluno

→ Criar treino

→ Escolher template

→ Personalizar

→ Prescrever

→ Publicar.

Também permitir duplicar um treino existente.

==================================================

40. SISTEMA DE TEMPLATES

==================================================

Criar templates de treino.

O treinador pode criar:

"Glúteo + Quadríceps"

"Superiores"

"Full Body"

etc.

Depois atribuir o template a um aluno.

Ao atribuir, criar uma cópia personalizada para aquele aluno.

Alterações futuras no aluno não devem alterar automaticamente o template original.

==================================================

41. HISTÓRICO DE VERSÕES

==================================================

Quando um treino for alterado:

não apagar o treino antigo.

Criar nova versão.

Exemplo:

TREINO A

Versão 1:

01/08–15/08

Versão 2:

16/08–30/08

Versão 3:

31/08–atual

Permitir visualizar versões anteriores.

==================================================

42. PESQUISA E FILTROS

==================================================

Treinador:

Pesquisar alunos por nome.

Filtrar:

- ativos;

- inativos;

- baixa aderência;

- sem treino;

- check-in pendente;

- nível;

- objetivo.

Exercícios:

Pesquisar por nome.

Filtrar por:

- grupo muscular;

- equipamento;

- categoria.

==================================================

43. PRINCÍPIOS IMPORTANTES

==================================================

Não criar apenas telas estáticas.

Todas as funcionalidades principais devem estar conectadas ao banco de dados.

Não utilizar dados mockados como se fossem dados reais.

Não perder dados históricos.

Não permitir acesso entre usuários.

Priorizar arquitetura limpa e escalável.

Priorizar experiência mobile.

Priorizar segurança.

Priorizar simplicidade.

==================================================

44. DESENVOLVIMENTO INCREMENTAL

==================================================

Não tente construir absolutamente tudo de uma vez se isso comprometer a qualidade.

Construa a aplicação em fases.

FASE 1:

- autenticação;

- usuários;

- roles;

- banco;

- dashboard;

- alunos.

FASE 2:

- exercícios;

- templates;

- treinos;

- prescrição.

FASE 3:

- execução;

- registros;

- histórico;

- descanso;

- conclusão;

- foto pós-treino.

FASE 4:

- evolução;

- gráficos;

- medidas;

- peso;

- composição corporal;

- fotos.

FASE 5:

- gamificação;

- pontos;

- níveis;

- badges;

- streak;

- metas.

FASE 6:

- check-ins;

- alertas;

- mensagens;

- notificações.

FASE 7:

- Journey;

- relatórios;

- STRNG Score.

Após cada fase, testar as funcionalidades antes de continuar.

==================================================

45. PRIMEIRA ENTREGA

==================================================

Para a primeira versão, crie uma base funcional do aplicativo com:

- autenticação;

- roles TRAINER e STUDENT;

- dashboard do aluno;

- dashboard do treinador;

- cadastro de alunos;

- biblioteca de exercícios;

- criação de treino;

- atribuição de treino ao aluno;

- execução do treino;

- registro de séries;

- registro de carga;

- registro de repetições;

- descanso;

- conclusão do treino;

- foto pós-treino;

- histórico de treino;

- estrutura inicial para gamificação.

Não implemente funcionalidades complexas de forma superficial apenas para dizer que estão prontas.

É melhor criar uma fundação sólida e funcional e evoluir depois.

==================================================

46. RESULTADO ESPERADO

==================================================

Quero que o produto final pareça uma plataforma profissional de consultoria fitness, e não uma planilha transformada em aplicativo.

O aluno deve sentir:

"Esse aplicativo foi feito para acompanhar a MINHA evolução."

O treinador deve sentir:

"Consigo administrar meus alunos e tomar decisões melhores com os dados."

A STAY STRNG deve ser percebida como:

uma consultoria baseada em treinamento personalizado, acompanhamento, consistência, dados e evolução.

Frase central do produto:

DON'T CHASE PERFECTION.

STAY STRNG.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stay-strng-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/218543f4-a076-4c43-b276-151c44b7d2c4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
