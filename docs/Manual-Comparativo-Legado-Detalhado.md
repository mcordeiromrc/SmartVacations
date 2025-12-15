# Manual do Usuário: Comparativo Legado

## 📘 Índice

1. [Visão Geral](#visão-geral)
2. [O Que É e Para Que Serve](#o-que-é-e-para-que-serve)
3. [Regras de Negócio Aplicadas](#regras-de-negócio-aplicadas)
4. [Como Funciona o Algoritmo](#como-funciona-o-algoritmo)
5. [Cálculos Utilizados](#cálculos-utilizados)
6. [Como Usar o Sistema](#como-usar-o-sistema)
7. [Entendendo os Resultados](#entendendo-os-resultados)
8. [Exemplo Prático Completo](#exemplo-prático-completo)
9. [Comparação com Motor ILP](#comparação-com-motor-ilp)
10. [Perguntas Frequentes](#perguntas-frequentes)

---

## Visão Geral

O **Comparativo Legado** é um sistema de alocação de férias que utiliza um **algoritmo heurístico** (método prático baseado em regras) para distribuir as férias dos colaboradores ao longo do ano.

### Diferencial Principal

Foco em **comparação e análise de economia**. Mostra quanto você economiza vs o "pior cenário possível" (todos tirando férias no pior momento).

---

## O Que É e Para Que Serve

### O Que É?

É um **alocador de férias** que:
- Distribui férias dos colaboradores em janelas de medição
- Calcula impacto financeiro por janela
- Compara com cenário de pior caso
- Mostra economia gerada

### Para Que Serve?

1. **Análise de Economia**: Quanto você economiza vs pior cenário
2. **Comparação**: Benchmark para comparar com outros métodos (ILP)
3. **Planejamento por Janela**: Visualizar impacto mês a mês
4. **Compliance**: Respeitar regra de 10% por cliente

### Quando Usar?

- Análise comparativa de métodos
- Validação de economia gerada
- Planejamento conservador (método testado)
- Projetos com janelas de medição específicas

---

## Regras de Negócio Aplicadas

O sistema respeita **4 regras principais**:

### 1️⃣ Regra de 10% por Cliente e Janela ⭐ (PRINCIPAL)

**O que é:**
- Em cada janela de medição, no máximo 10% dos colaboradores de um cliente podem estar em férias

**Como o sistema aplica:**
```
Para cada cliente:
  Total de colaboradores = X
  Máximo em férias por janela = max(1, X × 0.1)

Exemplo:
  Cliente XPTO: 30 colaboradores
  Máximo por janela: 3 colaboradores
```

**Por que existe:**
- **Proteção contratual**: Não deixar cliente desfalcado
- **Continuidade operacional**: Manter expertise disponível
- **Gestão de risco**: Evitar perda de conhecimento crítico

**Exemplo prático:**
```
Cliente PRODESP-TI: 25 colaboradores
Máximo em férias por janela: 2 colaboradores (10%)

Janela Jan/2025:
✅ 2 colaboradores em férias - OK
❌ 3 colaboradores em férias - BLOQUEADO pelo sistema
```

---

### 2️⃣ Regra de Início em Segundas-Feiras

**O que é:**
- Férias devem sempre começar em uma segunda-feira
- **NUNCA** em segundas que antecedem feriados (1 ou 2 dias antes)

**Como o sistema aplica:**
```
1. Filtra apenas segundas-feiras do ano
2. Remove segundas onde terça é feriado
3. Remove segundas onde quarta é feriado
4. Remove segundas que são feriados
```

**Por que existe:**
- **Súmula 171 TST**: Evitar "emendas" de feriados
- **Otimização de horas**: Maximizar dias úteis
- **Compliance trabalhista**: Evitar questionamentos

**Exemplo:**
```
Feriado: Quarta, 15/Mai/2025 (Corpus Christi)

Segunda, 13/Mai/2025 → ❌ BLOQUEADA (2 dias antes)
Segunda, 20/Mai/2025 → ✅ PERMITIDA
```

---

### 3️⃣ Regra CLT - 30 Dias de Férias

**O que é:**
- Todo colaborador tem direito a 30 dias de férias por ano

**Como o sistema aplica:**
- Aloca exatamente 30 dias por colaborador
- Pode dividir em períodos conforme estratégia

**Por que existe:**
- Obrigação legal (CLT Art. 129)
- Direito adquirido do trabalhador

---

### 4️⃣ Regra de Cálculo de Economia

**O que é:**
- Compara impacto real vs "pior cenário possível"

**Como o sistema aplica:**
```
Pior cenário = Soma de todos os dias × Taxa × 8 horas

Exemplo:
  Colaborador: 30 dias de férias
  Taxa: R$ 150/hora
  Pior caso = 30 × 8 × 150 = R$ 36.000

  Impacto real (com pontes): R$ 28.000
  Economia: R$ 36.000 - R$ 28.000 = R$ 8.000 (22.2%)
```

**Por que existe:**
- Demonstrar valor da otimização
- Justificar planejamento inteligente
- Comparar métodos diferentes

---

## Como Funciona o Algoritmo

### Abordagem: Heurística com Priorização

O sistema usa um **algoritmo guloso** (greedy) que toma decisões locais para chegar a uma boa solução global.

### Fluxo do Algoritmo

```
┌─────────────────────────────────────┐
│ 1. PREPARAÇÃO                       │
│ - Gerar todas as segundas do ano   │
│ - Calcular feriados                │
│ - Contar colaboradores por cliente │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. ORDENAÇÃO                        │
│ - Ordenar colaboradores por:       │
│   • Taxa (maior → menor)           │
│   • Taxa (menor → maior)           │
│   • Mediana (mais próximos)        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. ALOCAÇÃO (para cada colaborador)│
│ - Determinar períodos (estratégia) │
│ - Para cada período:               │
│   • Testar todas as segundas       │
│   • Validar regras                 │
│   • Escolher menor custo           │
│   • Registrar ocupação             │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. CÁLCULO DE ECONOMIA              │
│ - Calcular pior cenário            │
│ - Calcular economia gerada         │
│ - Calcular % de economia           │
└─────────────────────────────────────┘
```

---

### Passo a Passo Detalhado

#### Passo 1: Preparação

**1.1 Gerar Segundas-Feiras**
```python
Para cada dia do ano:
  Se é segunda-feira:
    Se não é feriado:
      Se terça não é feriado:
        Se quarta não é feriado:
          → Adicionar à lista de segundas válidas
```

**1.2 Calcular Feriados**
- Feriados fixos (Natal, Ano Novo, etc.)
- Feriados móveis (Carnaval, Páscoa, Corpus Christi)
- Feriados estaduais (SP, RJ, RS)

**1.3 Contar Colaboradores por Cliente**
```
Cliente A: 30 colaboradores
Cliente B: 15 colaboradores
Cliente C: 5 colaboradores
```

---

#### Passo 2: Ordenação de Colaboradores

O sistema oferece **3 lógicas de ordenação**:

**Opção 1: Taxa Decrescente (rate_desc)**
```
Prioriza colaboradores mais caros primeiro
Exemplo: R$ 200, R$ 180, R$ 150, R$ 120...
```

**Opção 2: Taxa Crescente (rate_asc)**
```
Prioriza colaboradores mais baratos primeiro
Exemplo: R$ 80, R$ 100, R$ 120, R$ 150...
```

**Opção 3: Mediana (smart)** - **PADRÃO**
```
Calcula mediana das taxas
Ordena por proximidade da mediana
Exemplo: Mediana = R$ 140
  → R$ 140, R$ 135, R$ 145, R$ 130, R$ 150...
```

---

#### Passo 3: Alocação de Férias

Para **cada colaborador**, o sistema:

**3.1 Determinar Períodos**

Baseado na estratégia escolhida:
- STANDARD_30: [30 dias]
- SELL_10: [20 dias] + 10 abono
- SPLIT_2_PERIODS: [15, 15 dias]
- SPLIT_3_PERIODS: [14, 8, 8 dias]
- SMART_HYBRID: Automático por taxa

**3.2 Para Cada Período**

```
Para cada segunda-feira válida:
  
  1. Calcular fim = início + duração - 1
  
  2. Para cada janela de medição:
     - Calcular sobreposição com férias
     - Calcular horas úteis na sobreposição
     - Verificar regra de 10% do cliente
     
  3. Se todas as validações OK:
     - Calcular custo total
     - Se custo < melhor_custo_até_agora:
       → Guardar como melhor opção
  
  4. Escolher segunda com menor custo
  5. Registrar ocupação por cliente/janela
```

**3.3 Validações Aplicadas**

✅ É segunda-feira válida?  
✅ Não ultrapassa 10% do cliente na janela?  
✅ Respeita separação de 30 dias entre períodos?  

---

#### Passo 4: Cálculo de Economia

**4.1 Pior Cenário**
```
Pior caso = Soma de todos os dias × 8 horas × Taxa

Exemplo:
  30 dias × 8 horas × R$ 150 = R$ 36.000
```

**4.2 Impacto Real**
```
Impacto real = Horas úteis (com pontes) × Taxa

Exemplo:
  22 dias úteis × 8 horas × R$ 150 = R$ 26.400
```

**4.3 Economia**
```
Economia = Pior caso - Impacto real
Economia % = (Economia / Pior caso) × 100

Exemplo:
  R$ 36.000 - R$ 26.400 = R$ 9.600
  (R$ 9.600 / R$ 36.000) × 100 = 26.7%
```

---

## Cálculos Utilizados

### 1. Cálculo de Dias Úteis com Pontes

**Objetivo:** Calcular quantos dias úteis o colaborador perde.

**Algoritmo:**

```
Para cada dia entre início e fim:
  1. É fim de semana? → Não conta
  2. É feriado? → Não conta
  3. É ponte? → Não conta
  4. Senão → Conta como dia útil

Total dias úteis × 8 horas = Horas úteis
```

**O que é "ponte"?**
- Feriado em **terça** → segunda anterior é ponte
- Feriado em **quinta** → sexta seguinte é ponte

**Exemplo:**

```
Férias: 13/Mai (seg) a 27/Mai (seg) - 15 dias

Calendário:
  13/Mai (seg) ✅
  14/Mai (ter) ✅
  15/Mai (qua) ❌ FERIADO (Corpus Christi)
  16/Mai (qui) ✅
  17/Mai (sex) ✅
  18/Mai (sáb) ❌ Fim de semana
  19/Mai (dom) ❌ Fim de semana
  20/Mai (seg) ✅
  ... continua

Dias corridos: 15
Fins de semana: 4
Feriados: 1
Pontes: 0
Dias úteis: 10 dias
Horas úteis: 80 horas
```

---

### 2. Cálculo de Impacto por Janela

**Objetivo:** Saber quanto cada janela foi impactada.

**Algoritmo:**

```
Para cada janela (ex: 21/Jan a 20/Fev):
  Para cada colaborador:
    Se férias sobrepõem a janela:
      1. Calcular dias de sobreposição
      2. Calcular dias úteis na sobreposição
      3. Horas = dias úteis × 8
      4. Impacto = horas × taxa do colaborador
      5. Somar ao total da janela
```

**Exemplo:**

```
Janela: 21/Jan a 20/Fev (31 dias)
Férias João: 03/Fev a 17/Fev (15 dias)

Sobreposição: 03/Fev a 17/Fev (15 dias)
Dias úteis na sobreposição: 11 dias
Horas: 11 × 8 = 88 horas
Taxa João: R$ 150/hora
Impacto na janela: 88 × R$ 150 = R$ 13.200
```

---

### 3. Cálculo de Economia vs Pior Caso

**Pior Caso:**
```
Assumir que TODOS os dias são úteis (sem considerar pontes)
Pior caso = Total de dias × 8 horas × Taxa
```

**Caso Real:**
```
Considerar pontes, feriados, fins de semana
Caso real = Dias úteis × 8 horas × Taxa
```

**Economia:**
```
Economia = Pior caso - Caso real
Economia % = (Economia / Pior caso) × 100
```

**Exemplo Completo:**

```
Colaborador: Maria Santos
Taxa: R$ 180/hora
Férias: 30 dias

PIOR CASO:
  30 dias × 8 horas × R$ 180 = R$ 43.200

CASO REAL (com pontes):
  22 dias úteis × 8 horas × R$ 180 = R$ 31.680

ECONOMIA:
  R$ 43.200 - R$ 31.680 = R$ 11.520
  (R$ 11.520 / R$ 43.200) × 100 = 26.7%
```

---

## Como Usar o Sistema

### Passo 1: Acessar o Comparativo Legado

1. Abrir SmartVacations
2. Selecionar projeto
3. Clicar em "Comparativo Legado"

---

### Passo 2: Configurar Parâmetros

**2.1 Estratégia de Férias**

| Estratégia | Períodos | Quando Usar |
|------------|----------|-------------|
| **Padrão CLT** | 30 dias | Simplicidade |
| **Venda 10 Dias** | 20 + 10 abono | Colaboradores caros |
| **Fracionado 2** | 15 + 15 | Distribuir impacto |
| **Fracionado 3** | 14 + 8 + 8 | Máxima flexibilidade |
| **Híbrido** | Automático | **Recomendado** |

**2.2 Lógica de Alocação**

| Lógica | Descrição | Quando Usar |
|--------|-----------|-------------|
| **Smart (Mediana)** | Ordena por proximidade da mediana | **Padrão** |
| **Taxa Decrescente** | Mais caros primeiro | Priorizar economia |
| **Taxa Crescente** | Mais baratos primeiro | Distribuir carga |

**2.3 Janelas de Medição**

- **Opção 1:** Usar janelas mensais automáticas (01 a 31)
- **Opção 2:** Definir janelas customizadas (ex: 21 a 20)

---

### Passo 3: Executar Comparativo

1. Clicar em "EXECUTAR COMPARATIVO"
2. Aguardar processamento (1-5 segundos)
3. Visualizar resultados

---

## Entendendo os Resultados

### Tabela Principal

#### Colunas Fixas

| Coluna | O Que Significa | Como É Calculado |
|--------|-----------------|------------------|
| **Colaborador** | Nome do colaborador | Cadastro |
| **Cliente** | Cliente alocado | Cadastro |
| **Datas Início** | Quando começam as férias | Calculado pelo algoritmo |
| **Datas Fim** | Quando terminam as férias | Início + Duração - 1 |
| **Breakdown** | Divisão dos períodos | Ex: "15 + 15" ou "30" |
| **Impacto Total** | Custo total das férias | Horas úteis × Taxa |
| **Horas Úteis** | Total de horas perdidas | Dias úteis × 8 |
| **Pior Caso** | Custo se todos os dias fossem úteis | Total dias × 8 × Taxa |
| **Economia** | Quanto economizou | Pior caso - Impacto real |
| **Economia %** | Percentual economizado | (Economia / Pior caso) × 100 |
| **Tipo** | Estratégia aplicada | Ex: "Padrão 30 dias" |

#### Colunas por Janela

Para cada janela, há **2 colunas**:

**Impacto - [Janela]**
- Quanto essa janela foi impactada
- Soma dos custos de todos que têm férias nessa janela

**Horas - [Janela]**
- Total de horas perdidas nessa janela
- Soma das horas de todos em férias

---

### Métricas Gerais

**1. Impacto Total**
- Soma de todos os impactos de todos os colaboradores
- Quanto o projeto deixa de faturar no ano

**2. Total de Horas**
- Soma de todas as horas úteis perdidas
- Capacidade produtiva perdida

**3. Economia Total**
- Soma de todas as economias individuais
- Quanto foi economizado vs pior cenário

**4. Quantidade de Colaboradores**
- Total de colaboradores processados

---

## Exemplo Prático Completo

### Cenário

**Projeto:** PRODESP  
**Colaboradores:** 50  
**Estratégia:** Híbrido Inteligente  
**Lógica:** Smart (Mediana)  
**Janelas:** Mensais (01 a 31)  

---

### Colaborador Exemplo: Ana Costa

**Dados:**
- Taxa: R$ 140/hora
- Cliente: PRODESP-INFRA
- Total de colaboradores do cliente: 20

**Estratégia Aplicada:**
- Taxa ≤ R$ 180 → Padrão 30 dias

---

### Passo a Passo do Cálculo

**Passo 1: Algoritmo Escolhe Data**

Sistema testa todas as segundas e escolhe:
- **Início:** 10/Fev/2025 (segunda-feira)
- **Fim:** 11/Mar/2025 (terça-feira)
- **Duração:** 30 dias

**Passo 2: Validações**

✅ É segunda-feira? Sim  
✅ Não antecede feriado? Sim  
✅ 10% do cliente OK? Sim (1 pessoa do PRODESP-INFRA, máximo 2)  

**Passo 3: Calcular Horas Úteis**

```
Período: 10/Fev a 11/Mar (30 dias corridos)

Feriados no período:
  - 04/Mar (Carnaval - terça)
  - 03/Mar (Segunda de Carnaval - ponte)

Fins de semana: 8 dias
Feriados: 1 dia (04/Mar)
Pontes: 1 dia (03/Mar)

Dias úteis: 30 - 8 - 1 - 1 = 20 dias
Horas úteis: 20 × 8 = 160 horas
```

**Passo 4: Calcular Custos**

```
Impacto Real:
  160 horas × R$ 140/hora = R$ 22.400

Pior Caso:
  30 dias × 8 horas × R$ 140/hora = R$ 33.600

Economia:
  R$ 33.600 - R$ 22.400 = R$ 11.200
  (R$ 11.200 / R$ 33.600) × 100 = 33.3%
```

**Passo 5: Calcular Impacto por Janela**

**Janela Fev/2025 (01/Fev a 28/Fev):**
- Sobreposição: 10/Fev a 28/Fev (19 dias)
- Dias úteis: 13 dias
- Horas: 104 horas
- Impacto: 104 × R$ 140 = R$ 14.560

**Janela Mar/2025 (01/Mar a 31/Mar):**
- Sobreposição: 01/Mar a 11/Mar (11 dias)
- Dias úteis: 7 dias (descontando Carnaval e ponte)
- Horas: 56 horas
- Impacto: 56 × R$ 140 = R$ 7.840

**Total:** R$ 14.560 + R$ 7.840 = R$ 22.400 ✅

---

### Resultado na Tabela

| Colaborador | Cliente | Início | Fim | Breakdown | Impacto Total | Horas | Pior Caso | Economia | Economia % | Tipo | Impacto Fev | Horas Fev | Impacto Mar | Horas Mar |
|-------------|---------|--------|-----|-----------|---------------|-------|-----------|----------|------------|------|-------------|-----------|-------------|-----------|
| Ana Costa | PRODESP-INFRA | 10/02/2025 | 11/03/2025 | 30 | **R$ 22.400** | 160:00 | R$ 33.600 | R$ 11.200 | **33.3%** | Padrão 30 dias | R$ 14.560 | 104:00 | R$ 7.840 | 56:00 |

---

## Comparação com Motor ILP

### Diferenças Principais

| Aspecto | Comparativo Legado | Motor ILP |
|---------|-------------------|-----------|
| **Algoritmo** | Heurística (guloso) | Programação Linear Inteira |
| **Otimalidade** | ❌ Aproximada (85-95%) | ✅ Garantida (100%) |
| **Velocidade** | ⚡ Rápido (1-5s) | 🟡 Médio (30s-5min) |
| **Foco** | Economia vs pior caso | Menor custo absoluto |
| **Regra 10% Cliente** | ✅ Sim | ✅ Sim |
| **Quando Usar** | Análise comparativa | Otimização máxima |

### Quando Usar Cada Um?

**Use Comparativo Legado quando:**
- Quer análise rápida
- Precisa comparar métodos
- Quer ver economia vs pior caso
- Tem janelas de medição específicas

**Use Motor ILP quando:**
- Quer melhor solução possível
- Economia é crítica
- Pode esperar alguns minutos
- Quer garantia matemática

---

## Perguntas Frequentes

### 1. Por que a economia é calculada vs "pior caso"?

**Resposta:** Para demonstrar o valor do planejamento inteligente. O "pior caso" assume que todos os dias são úteis (sem pontes), o que nunca acontece na prática.

---

### 2. Qual lógica de alocação devo usar?

**Resposta:** 
- **Smart (Mediana)**: Recomendado - Equilibra bem
- **Taxa Decrescente**: Se quer priorizar economia
- **Taxa Crescente**: Se quer distribuir carga uniformemente

---

### 3. O que significa "Breakdown"?

**Resposta:** Como as férias foram divididas:
- "30" = 30 dias contínuos
- "15 + 15" = Dois períodos de 15 dias
- "20 + 10 Abono" = 20 dias + 10 vendidos

---

### 4. Por que alguns colaboradores têm economia maior?

**Resposta:** Depende de quando as férias caem:
- Mais feriados no período = Mais economia
- Mais pontes = Mais economia
- Período sem feriados = Menos economia

---

### 5. Como interpretar "Impacto por Janela"?

**Resposta:** Mostra quanto cada mês foi impactado. Use para:
- Identificar meses críticos
- Planejar contratações temporárias
- Ajustar metas mensais

---

### 6. Posso comparar com o Motor ILP?

**Resposta:** Sim! Execute ambos com os mesmos parâmetros e compare:
- Impacto total (ILP deve ser menor)
- Distribuição ao longo do ano
- Economia gerada

---

## Conclusão

O **Comparativo Legado** é uma ferramenta essencial para:

✅ **Análise de Economia** - Demonstrar valor do planejamento  
✅ **Compliance** - Respeitar regra de 10% por cliente  
✅ **Velocidade** - Resultados em segundos  
✅ **Comparação** - Benchmark para outros métodos  

Use este manual para entender, operar e apresentar os resultados com confiança! 📊

---

**Versão:** 2.0 Detalhado  
**Data:** Dezembro 2025  
**Autor:** SmartVacations Team
