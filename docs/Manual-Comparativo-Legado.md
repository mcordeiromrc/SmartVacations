# Manual do Comparativo Legado

## Visão Geral
- O módulo "Comparativo: Legado" replica com fidelidade os cálculos do modelo legado (Excel/Python).
- Objetivo: explicar claramente cada regra, fórmula e coluna exibida nas abas do comparativo legado.

## Guia Didático (para quem não programa)
- O que o sistema faz: escolhe, para cada pessoa, a melhor data de início das férias dentro do ano, evitando problemas com feriados e dias de ponte, e calcula quanto isso impacta financeiramente.
- Como ele decide a melhor data: sempre procura começar na segunda-feira e evita começar perto de feriados. Entre todas as segundas válidas, ele escolhe a que gera o menor custo para o projeto.
- O que são janelas: são períodos (geralmente meses) que você define para enxergar as horas e o custo das férias dentro de cada intervalo. Isso facilita prever impacto mês a mês.
- De onde vêm os números: o sistema conta quantos dias úteis existem dentro das férias (tirando fins de semana, feriados e pontes), transforma em horas (cada dia = 8h) e multiplica pelo valor/hora da pessoa.

## Regras de Negócio (explicadas de forma simples)
- Começar na segunda-feira: as férias devem começar numa segunda. Isso uniformiza e reduz ruídos no calendário.
- Não começar 1 ou 2 dias antes de feriado: se a segunda cai exatamente antes de um feriado (na terça ou quarta), essa segunda é descartada para evitar emendas e baixa produtividade.
- Feriados: o sistema conhece os feriados do ano (nacionais e alguns estaduais) e os considera como não úteis.
- Pontes (emendas): quando o feriado cai na terça, a segunda vira ponte; quando cai na quinta, a sexta vira ponte. Esses dias não contam como úteis.
- Limite por cliente em cada janela: para não parar um cliente inteiro, apenas até 10% das pessoas daquele cliente podem estar em férias ao mesmo tempo dentro daquela janela.
- Respeito entre períodos: após um período de férias, o próximo só pode começar pelo menos 30 dias depois.
- Ano de referência: períodos que estouram muito o ano seguinte são desconsiderados, para manter planejamento realista.
- Ordem de processamento: você pode escolher processar quem tem valor/hora maior primeiro, menor primeiro ou próximo da média — afeta a distribuição final.

## Como o sistema calcula (passo a passo)
1) Você define as janelas (por exemplo, cada mês do ano).
2) Para cada pessoa e para cada período da estratégia escolhida (ex.: 30 dias; ou 15+15; ou 20 dias + 10 de abono):
   - O sistema lista todas as segundas do ano.
   - Remove as segundas que violam regras (feriado, 1–2 dias antes de feriado, limite de pessoas por cliente na janela, proximidade de período anterior).
   - Para cada segunda válida, calcula o custo: conta apenas os dias úteis dentro do período, transforma em horas (×8) e multiplica pelo valor/hora da pessoa.
   - Escolhe a segunda com menor custo e agenda aquele período.
3) Soma os custos e horas de todos os períodos daquela pessoa.
4) Gera também, para cada janela, o quanto das férias caiu dentro dela (horas e custo). Isso alimenta as colunas por janela da tabela.
5) Calcula o “pior cenário” (se todos os dias contassem como úteis): serve para comparar com o total real e mostrar a economia.

## Aba “Férias Inteligentes” (colunas explicadas)
- Nome: nome do colaborador.
- Cliente: cliente ao qual o colaborador atende.
- Rate: valor/hora do colaborador. É o multiplicador usado nos custos.
- Início das Férias: as datas, em formato dia/mês/ano, onde cada período começa. Sempre segundas válidas.
- Fim das Férias: as datas onde cada período termina.
- Dias de Férias Calculados: mostra a composição do período de férias (ex.: “30”; “15 + 15”; “20 + 10 Abono”).
- Horas Úteis nas Férias: total de horas que realmente impactam o projeto (dias úteis × 8, tirando finais de semana, feriados e pontes).
- Impacto (R$): custo total das férias do colaborador (horas úteis × rate).
- Impacto - [Janela]: quanto do custo caiu dentro daquela janela específica (ex.: “Impacto - 01/01 a 31/01”).
- Horas - [Janela]: quantas horas úteis daquele período de férias caíram dentro daquela janela.

## Aba “Comparação” (colunas explicadas)
- Colaborador: nome da pessoa.
- Prog. Férias: rótulo da configuração aplicada (ex.: “Padrão 30 dias”, “Divisão em 2 períodos”).
- Rate: valor/hora da pessoa.
- Pior Cenário: custo máximo, se todo o período contado fosse útil (rate × 8 × total de dias). É uma referência.
- Modelo Real: custo real calculado considerando o calendário (finais de semana, feriados e pontes). Normalmente menor que o pior cenário.
- Diferença: economia obtida (pior cenário − modelo real). Mostra o ganho do planejamento cuidadoso.
- Economia %: a economia em percentual em relação ao pior cenário.

## Onde cada parte acontece (arquivos)
- Backend (cálculo legado): `backend/app/services/legacy_engine.py`.
- Frontend (tabelas e gráficos do comparativo legado): `components/LegacyComparisonPage.tsx`.
- Contratos (estrutura dos dados de entrada/saída): `backend/app/schemas.py`.

## Glossário simples
- Dia útil: dia de semana que não é feriado nem ponte.
- Ponte: dia “emendado” ao feriado (segunda antes da terça; sexta depois da quinta).
- Janela: período de análise (tipicamente um mês), usado para enxergar horas e custos naquele intervalo.
- Rate: valor/hora do colaborador.
- Impacto: custo causado pelas férias, calculado em horas úteis × rate.

## Fluxo de Trabalho
- Configuração de Janelas: o usuário define janelas de medição mensais (início/fim) para fatiar custos por período.
- Execução: o backend calcula, para cada colaborador, a melhor segunda-feira de início de férias por período, sob regras de compliance, feriados e pontes.
- Resultados: são exibidas as abas "Férias Inteligentes" (detalhada) e "Comparação" (pior cenário vs. real) na página do comparativo legado.

## Regras de Negócio
- Segundas-feiras: o início é buscado somente nas segundas do ano (`backend/app/services/legacy_engine.py:5–9`).
- Não iniciar 1–2 dias antes de feriado: datas de início que antecedem feriado em 1 ou 2 dias são bloqueadas (`backend/app/services/legacy_engine.py:39–47`).
- Feriados: gerados por datas fixas e pela Páscoa (`backend/app/services/legacy_engine.py:49–66`, `_easter` em `backend/app/services/legacy_engine.py:58–73`).
- Pontes: segunda anterior a feriado na terça e sexta posterior a feriado na quinta não são úteis (`backend/app/services/legacy_engine.py:10–26`).
- Janelas: meses do ano são utilizados como janelas de medição (`backend/app/services/legacy_engine.py:28–37`).
- Concorrência por janela/cliente: limite de 10% por cliente em cada janela (`backend/app/services/legacy_engine.py:148–151`).
- Espaçamento entre períodos: 30 dias após cada período (`backend/app/services/legacy_engine.py:165`).
- Períodos que extrapolam `req.year + 1` são descartados (`backend/app/services/legacy_engine.py:136–137`).
- Ordenação de colaboradores: lógica `smart`, `rate_desc` ou `rate_asc` (`backend/app/services/legacy_engine.py:86–94`).
- Estratégias/presets: definição de períodos e abono (`backend/app/services/legacy_engine.py:107–120`).

## Cálculos (Backend Legado)
- Dias úteis: `_business_days_with_pontes` (`backend/app/services/legacy_engine.py:10–26`).
- Horas úteis: `dias_úteis × 8`.
- Impacto financeiro por candidato: soma das horas úteis nas sobreposições com cada janela × `rate` (`backend/app/services/legacy_engine.py:140–156`).
- Seleção do melhor início: varre segundas válidas, respeita concorrência por janela/cliente e escolhe menor custo (`backend/app/services/legacy_engine.py:127–159`).
- Detalhamento por janela: horas e impacto dentro da interseção com cada janela (`backend/app/services/legacy_engine.py:177–194`).
- Pior Cenário: `rate × 8 × (soma períodos + abono)` (`backend/app/services/legacy_engine.py:195–198`).
- Economia: `savings = max(worst_case_impact − total_impact, 0)` e `savings_percent = savings / worst_case_impact` (`backend/app/services/legacy_engine.py:197–213`).
- Totais: `total_impact` e `total_business_hours` somados ao final (`backend/app/services/legacy_engine.py:215–224`).

## Abas e Colunas

### Férias Inteligentes (Legado)
- Arquivo: `components/LegacyComparisonPage.tsx:566–617`.
- Colunas:
  - `Nome`: colaborador.
  - `Cliente`: tomador de serviço.
  - `Rate`: valor/hora; formatado em moeda `formatCurrency`.
  - `Início das Férias`: lista de datas calculadas por período.
  - `Fim das Férias`: lista de datas calculadas.
  - `Dias de Férias Calculados`: expressão de períodos (ex.: `15 + 15` ou `20 + 10 Abono`).
  - `Horas Úteis nas Férias`: total de horas úteis no(s) período(s); soma de dias úteis × 8.
  - `Impacto (R$)`: `total_business_hours × rate`.
  - `Impacto - {w.label}`: impacto financeiro dentro da janela `w` (`window_impacts[w.id]`).
  - `Horas - {w.label}`: horas úteis dentro da janela `w` (`window_hours[w.id]`).

### Comparação (Legado)
- Arquivo: `components/LegacyComparisonPage.tsx:621–644`.
- Colunas:
  - `Colaborador`: nome.
  - `Prog. Férias`: rótulo da estratégia/preset aplicado (`vacation_type_label`).
  - `Rate`: valor/hora.
  - `Pior Cenário`: `worst_case_impact = rate × 8 × (soma períodos + abono)`.
  - `Modelo Real`: `total_impact` calculado nas férias otimizadas.
  - `Diferença`: `savings = max(worst_case_impact − total_impact, 0)`.
  - `Economia %`: `savings_percent = savings / worst_case_impact`.

###

## Estratégias de Férias (Legado)
- Presets e manual (`components/LegacyComparisonPage.tsx:48–56`).
  - `STD_30`: 30 dias.
  - `ABONO_20_10`: 20 dias férias + 10 abono.
  - `SPLIT_15_15`, `SPLIT_20_10`, `SPLIT_14_6_10`, `SPLIT_14_7_9`.

##

## Glossário
- `Rate`: valor hora do colaborador.
- `Dias úteis`: dias de semana sem feriado/pontes.
- `Pontes`: véspera/pos-feriado (terça/quinta) marcadas como não úteis.
- `Janela`: período de medição (ex.: mês civil ou intervalo customizado).
- `Impacto`: horas úteis × rate.
- `Abono`: venda de 10 dias (não gera custo de férias no algoritmo).

## Limitações e Premissas
- O motor não agenda início em fins de semana.
- O cálculo é determinístico com base nas janelas e regras atuais; mudanças de feriados regionais afetam resultados.
- Em `SMART_HYBRID`, o limiar de `rate > 180` é simples e pode ser ajustado conforme política.

## Referências de Código (Legado)
- Backend: `backend/app/services/legacy_engine.py` — janelas, feriados, pontes, validação de início e cálculo de impactos.
- Roteador: `backend/app/routers/legacy.py:1–13` (endpoint `/legacy/compare`).
- Schemas: `backend/app/schemas.py:35–60` (request/response do comparativo legado).
- Frontend: `components/LegacyComparisonPage.tsx` — abas, tabelas, exportações e gráficos.
