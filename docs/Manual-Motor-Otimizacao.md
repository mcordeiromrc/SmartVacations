# Manual do Motor de Otimização

## Visão Geral
- O Motor de Otimização escolhe, para cada colaborador, as melhores datas de férias ao longo do ano, minimizando o custo para o projeto e respeitando regras trabalhistas e de negócio.
- A interface apresenta os resultados em duas abas: "Férias Inteligentes" (detalhes por colaborador) e "Dashboard & Gráficos" (indicadores e visualizações).

## Guia Didático (para quem não programa)
- O que o sistema faz: busca datas de início que evitam feriados e dias de ponte, limita a quantidade de pessoas simultaneamente em férias, e calcula o impacto financeiro das férias.
- Como decide: compara todas as datas válidas (normalmente segundas-feiras) e escolhe a que gera menor custo, levando em conta o calendário real.
- De onde vêm os números: conta só dias úteis (sem fim de semana, feriados, pontes), transforma em horas (cada dia = 8h) e multiplica pelo valor/hora (rate) de cada colaborador.
- Janelas de medição: períodos (geralmente meses) configurados para enxergar horas/impacto das férias dentro de cada intervalo.

## Regras de Negócio (explicadas de forma simples)
- Início preferido: as férias começam em um dia da semana preferido. Por padrão, segunda-feira; pode ser configurado por projeto.
- Não iniciar 1 ou 2 dias antes de feriado: datas que antecedem feriados em 1–2 dias são descartadas para evitar emendas e baixa produtividade.
- Feriados por região: o motor considera feriados nacionais e estaduais, variando conforme a região/cidade do colaborador.
- Pontes (emendas): segunda antes de feriado na terça e sexta depois de feriado na quinta não contam como úteis.
- Concorrência diária máxima: limita quantos colaboradores podem estar de férias no mesmo dia, conforme porcentagem definida no projeto.
- Janelas: usadas para detalhar impacto/horas por período (ex.: meses), conforme configuração de “Gerar Janelas”.
- Espaçamento entre períodos: após um período, o próximo só inicia depois de um intervalo mínimo (30 dias), garantindo planejamento saudável.
- Estratégias de férias: podem ser período único (30), fracionado (15+15, 14+8+8), ou com abono (20+10). Há um modo "Híbrido Inteligente" que escolhe automaticamente.
- Economia (Saving): quando há abono (venda de 10 dias), essa parte não gera custo de férias, contabilizando uma economia.
- IA opcional: pode sugerir alocações; ainda assim, o motor recalcula horas/custos para aderir às regras.

## Como o sistema calcula (passo a passo)
1) Você configura as janelas (ex.: cada mês do ano) e escolhe a estratégia.
2) Para cada colaborador e cada período da estratégia:
   - Lista datas de início válidas (respeitando dia preferido, feriados e pontes).
   - Checa a concorrência diária para não ultrapassar o limite simultâneo.
   - Calcula o custo de cada opção: dias úteis × 8 × rate.
   - Escolhe a opção de menor custo e agenda o período.
3) Soma custos e horas por colaborador e registra o detalhamento por janela.
4) Calcula indicadores de economia (quando há abono) e de conflitos evitados (datas inválidas descartadas).
5) Agrega o impacto por mês para compor o fluxo de caixa mensal.

## Aba “Férias Inteligentes” (colunas explicadas)
- Colaborador: nome do colaborador.
- Cliente: cliente atendido pelo colaborador.
- Rate: valor/hora do colaborador; é o multiplicador usado nos custos.
- Início: data de início do período de férias escolhido.
- Fim: data de término do período.
- Dias: duração em dias corridos do período (ex.: 30, 15, 20).
- Horas Úteis: total de horas realmente trabalháveis (dias úteis × 8), desconsiderando fim de semana, feriados e pontes.
- Custo Total: impacto financeiro do período (horas úteis × rate).
- Impacto - [Janela]: quanto do custo caiu dentro daquela janela (ex.: “Impacto - 01/01 a 31/01”).
- Horas - [Janela]: quantas horas úteis do período caíram dentro daquela janela.

## Aba “Dashboard & Gráficos”
- Impacto Financeiro Real: soma dos custos de todos os períodos agendados para todos os colaboradores.
- Saving Gerado (Otimização): economia acumulada quando existe abono (venda de 10 dias), pois esses dias não geram custo de férias.
- Conflitos Evitados: quantidade de datas descartadas por violarem regras (ex.: início 1–2 dias antes de feriado).
- Fluxo de Caixa Mensal (gráfico): barras por mês mostrando o total de custo alocado; há uma linha de referência com a meta mensal do projeto.
- Cronograma de Inícios de Férias (gráfico): barras por mês com a quantidade de inícios; ajuda a visualizar concentração de férias.

## Onde cada parte acontece (arquivos)
- Backend (cálculo e regras): `backend/app/services/optimization_engine.py`.
- Frontend (tabelas, cards e gráficos): `components/OptimizationPage.tsx`.
- Contratos (estrutura de dados): `backend/app/schemas.py` e `types.ts`.

## Glossário simples
- Dia útil: dia de semana que não é feriado nem ponte.
- Ponte: dia "emendado" ao feriado (segunda antes de terça; sexta depois de quinta).
- Janela: período (tipicamente um mês) para enxergar horas e custos naquele intervalo.
- Rate: valor/hora do colaborador.
- Impacto: custo das férias calculado como horas úteis × rate.
- Abono: venda de 10 dias (não gera custo de férias, resulta em economia).
