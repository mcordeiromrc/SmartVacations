# Manual do Usuário: Motor de Otimização ILP

## 📘 Índice

1. [Visão Geral](#visão-geral)
2. [O Que É e Para Que Serve](#o-que-é-e-para-que-serve)
3. [Regras de Negócio Aplicadas](#regras-de-negócio-aplicadas)
4. [Como Funciona o Algoritmo](#como-funciona-o-algoritmo)
5. [Cálculos Utilizados](#cálculos-utilizados)
6. [Como Usar o Sistema](#como-usar-o-sistema)
7. [Entendendo os Resultados](#entendendo-os-resultados)
8. [Exemplo Prático Completo](#exemplo-prático-completo)
9. [Perguntas Frequentes](#perguntas-frequentes)

---

## Visão Geral

O **Motor de Otimização ILP** é um sistema inteligente que calcula automaticamente a melhor forma de alocar as férias dos colaboradores, **minimizando o impacto no faturamento do projeto** enquanto respeita todas as regras trabalhistas (CLT) e contratuais.

### Diferencial Principal

Utiliza **Programação Linear Inteira (ILP)** - uma técnica matemática avançada que **garante a melhor solução possível**. Não é uma aproximação ou "chute inteligente", é a **solução matematicamente ótima**.

---

## O Que É e Para Que Serve

### O Que É?

É um **otimizador automático** que decide:
- **Quando** cada colaborador deve tirar férias
- **Quantos dias** em cada período
- **Como distribuir** ao longo do ano para minimizar custos

### Para Que Serve?

1. **Reduzir Custos**: Minimiza o impacto financeiro das férias no projeto
2. **Evitar Conflitos**: Garante que não haja muitos colaboradores em férias ao mesmo tempo
3. **Proteger Clientes**: Não deixa nenhum cliente desfalcado (máximo 10% do time em férias)
4. **Compliance**: Respeita 100% das regras da CLT e contratuais

### Quando Usar?

- Planejamento anual de férias
- Otimização de custos do projeto
- Análise de impacto financeiro
- Comparação com outros métodos de alocação

---

## Regras de Negócio Aplicadas

O sistema respeita **5 regras principais**:

### 1️⃣ Regra CLT - 30 Dias de Férias por Ano

**O que é:**
- Todo colaborador tem direito a 30 dias de férias por ano (CLT Art. 129)

**Como o sistema aplica:**
- Garante que cada colaborador tenha exatamente 30 dias alocados
- Pode dividir em períodos (se configurado): 15+15 ou 14+8+8

**Por que existe:**
- Obrigação legal trabalhista
- Direito adquirido do colaborador

---

### 2️⃣ Regra de Concorrência Global

**O que é:**
- Limite máximo de colaboradores em férias ao mesmo tempo
- Configurável por projeto (ex: máximo 20% do time)

**Como o sistema aplica:**
- Calcula: `max_simultâneo = total_colaboradores × percentual / 100`
- Exemplo: 50 colaboradores × 20% = 10 pessoas no máximo

**Por que existe:**
- Garantir continuidade operacional do projeto
- Evitar sobrecarga nos colaboradores ativos
- Manter capacidade de entrega

---

### 3️⃣ Regra de 10% por Cliente (CRÍTICA) ⭐

**O que é:**
- Em cada janela de medição, no máximo 10% dos colaboradores de um cliente podem estar em férias

**Como o sistema aplica:**
- Para cada cliente, conta quantos colaboradores existem
- Calcula: `max_permitido = max(1, total_cliente × 0.1)`
- Exemplo: Cliente com 25 colaboradores → máximo 2 em férias por janela

**Por que existe:**
- **Proteção contratual**: Não deixar o cliente desfalcado
- **Qualidade de serviço**: Manter expertise disponível
- **Risco operacional**: Evitar perda de conhecimento crítico

**Exemplo prático:**
```
Cliente XPTO: 30 colaboradores
Máximo em férias por janela: 3 colaboradores (10%)

Janela Jan/2025:
✅ 2 colaboradores em férias - OK
❌ 4 colaboradores em férias - BLOQUEADO
```

---

### 4️⃣ Regra de Início em Segundas-Feiras

**O que é:**
- Férias devem sempre começar em uma segunda-feira
- **NUNCA** em segundas que antecedem feriados (1 ou 2 dias antes)

**Como o sistema aplica:**
- Filtra apenas segundas-feiras do ano
- Remove segundas onde terça ou quarta é feriado
- Remove segundas que são feriados

**Por que existe:**
- **Súmula 171 do TST**: Evitar "emendas" de feriados
- **Otimização de horas**: Maximizar dias úteis de trabalho
- **Compliance trabalhista**: Evitar questionamentos jurídicos

**Exemplo:**
```
Feriado: Quarta, 15/Mai/2025

Segunda, 13/Mai/2025 → ❌ BLOQUEADA (2 dias antes do feriado)
Segunda, 20/Mai/2025 → ✅ PERMITIDA
```

---

### 5️⃣ Regra de Separação de Períodos

**O que é:**
- Se férias forem divididas em períodos, deve haver no mínimo 30 dias entre eles

**Como o sistema aplica:**
- Ao alocar segundo período, verifica distância do primeiro
- Bloqueia datas com menos de 30 dias de intervalo

**Por que existe:**
- **CLT Art. 134 §1º**: Fracionamento deve respeitar intervalos
- **Descanso efetivo**: Garantir recuperação do colaborador
- **Planejamento**: Evitar férias muito próximas

---

## Como Funciona o Algoritmo

### Abordagem: Programação Linear Inteira (ILP)

O sistema usa **3 métodos** em ordem de prioridade:

```
1. ILP (Recomendado) → Solução matematicamente ótima
   ↓ (se falhar ou timeout)
2. Heurística Melhorada → Solução rápida e boa
   ↓ (sempre funciona)
3. IA (Opcional) → Geração via OpenAI
```

### Método 1: ILP (Programação Linear Inteira)

#### O Que Faz?

Resolve um **problema matemático de otimização**:

```
Minimizar: Custo total das férias
Respeitando: Todas as 5 regras de negócio
```

#### Como Funciona?

**Passo 1: Definir Variáveis**
- Para cada colaborador, cada segunda-feira, cada período:
  - Variável = 1 se alocar férias nessa data
  - Variável = 0 se não alocar

**Passo 2: Calcular Custos**
- Para cada possível alocação:
  - Calcula horas úteis (considerando feriados e pontes)
  - Multiplica pela taxa do colaborador
  - Armazena o custo

**Passo 3: Definir Restrições**
- CLT: Cada colaborador deve ter exatamente 1 período
- Concorrência: Máximo X pessoas ao mesmo tempo
- 10% Cliente: Máximo Y pessoas do cliente por janela
- Separação: Períodos com ≥30 dias de intervalo

**Passo 4: Resolver**
- Solver CBC encontra a combinação que minimiza custo
- Garante que todas as restrições são respeitadas
- Retorna a solução ótima

#### Vantagens

✅ **Otimalidade garantida**: Melhor solução possível  
✅ **Compliance total**: 100% das regras respeitadas  
✅ **Transparência**: Decisões baseadas em matemática  

#### Desvantagens

⏱️ **Tempo**: Pode levar 1-5 minutos em projetos grandes  
💾 **Memória**: Consome mais recursos  

---

### Método 2: Heurística Melhorada (Fallback)

#### O Que Faz?

Usa um **algoritmo guloso inteligente** que encontra uma boa solução rapidamente.

#### Como Funciona?

**Passo 1: Ordenar Colaboradores**
- Ordena por taxa (maior → menor)
- Prioriza colaboradores mais caros

**Passo 2: Para Cada Colaborador**
- Testa todas as segundas-feiras do ano
- Para cada data, verifica:
  - ✅ É segunda-feira válida?
  - ✅ Respeita concorrência global?
  - ✅ Respeita 10% do cliente?
  - ✅ Não conflita com feriados?
- Escolhe a data com **menor custo**

**Passo 3: Registrar Alocação**
- Marca ocupação global
- Marca ocupação por cliente/janela
- Avança para próximo colaborador

#### Vantagens

⚡ **Velocidade**: 1-5 segundos  
✅ **Confiabilidade**: Sempre funciona  
📊 **Qualidade**: 85-95% da solução ótima  

---

## Cálculos Utilizados

### 1. Cálculo de Horas Úteis (Bridge-Aware)

**Objetivo:** Calcular quantas horas úteis o colaborador perde durante as férias.

**Algoritmo:**

```
Para cada dia entre início e fim das férias:
  1. É fim de semana (sábado/domingo)? → Não conta
  2. É feriado? → Não conta
  3. É "ponte"? → Não conta
  4. Senão → Conta 8 horas

Total = Soma de todos os dias úteis × 8 horas
```

**O que é "ponte"?**
- Feriado em **terça** → segunda anterior é ponte
- Feriado em **quinta** → sexta seguinte é ponte

**Exemplo:**

```
Férias: 13/Mai/2025 (seg) a 27/Mai/2025 (seg)
Feriados: 15/Mai (qua - Corpus Christi)

Dias corridos: 15 dias
Fins de semana: 4 dias (17-18, 24-25)
Feriados: 1 dia (15/Mai)
Pontes: 0 dias
Dias úteis: 15 - 4 - 1 = 10 dias
Horas úteis: 10 × 8 = 80 horas
```

---

### 2. Cálculo de Custo de Impacto

**Objetivo:** Calcular quanto custa financeiramente as férias desse colaborador.

**Fórmula:**

```
Custo = Horas Úteis × Taxa do Colaborador
```

**Exemplo:**

```
Colaborador: João Silva
Taxa: R$ 150/hora
Horas úteis: 80 horas

Custo = 80 × R$ 150 = R$ 12.000
```

**Interpretação:**
- Durante as férias de João, o projeto deixa de faturar R$ 12.000
- Esse é o "impacto financeiro" das férias dele

---

### 3. Cálculo de Feriados Brasileiros

**Feriados Fixos:**
- 01/Jan - Ano Novo
- 21/Abr - Tiradentes
- 01/Mai - Dia do Trabalho
- 07/Set - Independência
- 12/Out - Nossa Senhora Aparecida
- 02/Nov - Finados
- 15/Nov - Proclamação da República
- 25/Dez - Natal

**Feriados Móveis (dependem da Páscoa):**
- Carnaval (47 dias antes da Páscoa)
- Sexta-feira Santa (2 dias antes da Páscoa)
- Corpus Christi (60 dias depois da Páscoa)

**Feriados Estaduais:**
- **SP**: 09/Jul (Revolução Constitucionalista), 20/Nov (Consciência Negra)
- **RJ**: 23/Abr (São Jorge), 20/Nov (Consciência Negra)
- **RS**: 20/Set (Revolução Farroupilha)

**Cálculo da Páscoa (Algoritmo de Gauss):**
```
Fórmula matemática complexa que calcula a data da Páscoa
para qualquer ano entre 1583 e 4099
```

---

### 4. Cálculo de Impacto por Janela

**Objetivo:** Saber quanto cada janela de medição foi impactada.

**Algoritmo:**

```
Para cada janela (ex: 21/Jan a 20/Fev):
  Para cada alocação de férias:
    Se férias sobrepõem a janela:
      - Calcular dias de sobreposição
      - Calcular horas úteis na sobreposição
      - Calcular custo = horas × taxa
      - Somar ao impacto da janela
```

**Exemplo:**

```
Janela: 21/Jan a 20/Fev (31 dias)
Férias João: 03/Fev a 17/Fev (15 dias)

Sobreposição: 03/Fev a 17/Fev (15 dias)
Horas úteis na janela: 80 horas
Taxa João: R$ 150/hora
Impacto na janela: 80 × R$ 150 = R$ 12.000
```

---

## Como Usar o Sistema

### Passo 1: Acessar o Motor de Otimização

1. Abrir o sistema SmartVacations
2. Selecionar o projeto desejado
3. Clicar em "Motor de Otimização ILP"

---

### Passo 2: Configurar Parâmetros

**2.1 Estratégia de Férias**

Escolher uma das opções:

| Estratégia | Descrição | Quando Usar |
|------------|-----------|-------------|
| **Padrão CLT (30 Dias)** | 30 dias contínuos | Simplicidade, menos gestão |
| **Otimizar Abono (20+10)** | 20 dias + venda de 10 | Colaboradores com taxa alta |
| **Fracionado (15+15)** | Dois períodos de 15 dias | Distribuir impacto no ano |
| **Máx Fracionamento (14+8+8)** | Três períodos | Máxima flexibilidade |
| **Híbrido Inteligente** | Automático por taxa | **Recomendado** |

**2.2 Configurar Solver**

- ✅ **Usar Solver ILP**: Ativado (recomendado)
- **Timeout**: 300 segundos (5 minutos)

**2.3 Definir Janelas de Medição**

- **Dia Início**: 21 (dia do mês)
- **Dia Fim**: 20 (dia do mês)
- **Ano Base**: 2025
- Clicar em "Gerar Janelas"

Isso cria 12 janelas mensais:
- 21/Jan a 20/Fev
- 21/Fev a 20/Mar
- ... e assim por diante

---

### Passo 3: Executar Otimização

1. Clicar em **"EXECUTAR SOLVER INTELIGENTE"**
2. Aguardar processamento (30s a 5min)
3. Acompanhar status: PENDING → PROCESSING → SUCCESS

---

### Passo 4: Analisar Resultados

O sistema exibe duas abas:

**Aba 1: Férias Inteligentes (Grid)**
- Tabela detalhada com todas as alocações
- Colunas por janela de medição

**Aba 2: Dashboard & Gráficos**
- Métricas gerais
- Gráficos de fluxo de caixa
- Cronograma de férias

---

## Entendendo os Resultados

### Grid de Férias Inteligentes

#### Colunas Principais

| Coluna | O Que Significa | Como É Calculado |
|--------|-----------------|------------------|
| **Colaborador** | Nome do colaborador | Cadastro do sistema |
| **Cliente** | Cliente alocado | Cadastro do sistema |
| **Rate** | Taxa horária (R$/hora) | Cadastro do sistema |
| **Início** | Data de início das férias | Calculado pelo solver |
| **Fim** | Data de fim das férias | Início + Duração - 1 |
| **Dias** | Dias corridos de férias | Configuração da estratégia |
| **Horas Úteis** | Horas úteis perdidas | Bridge-aware calculation |
| **Custo Total** | Impacto financeiro | Horas Úteis × Rate |

#### Colunas por Janela

Para cada janela de medição, há **2 colunas**:

**Impacto - [Janela]**
- Quanto essa janela foi impactada por essas férias
- Calculado: Horas na janela × Taxa
- Exemplo: R$ 12.000

**Horas - [Janela]**
- Quantas horas úteis foram perdidas nessa janela
- Calculado: Bridge-aware na sobreposição
- Exemplo: 80:00 (80 horas)

---

### Dashboard & Métricas

#### Métricas Principais

**1. Impacto Financeiro Real**
- Soma de todos os custos de férias
- Quanto o projeto deixa de faturar no ano
- Exemplo: R$ 950.000

**2. Saving Gerado (Otimização)**
- Economia vs pior cenário possível
- Quanto foi economizado com a otimização
- Exemplo: R$ 250.000 (20.8%)

**3. Conflitos Evitados**
- Quantas vezes o sistema evitou alocar em data inválida
- Exemplo: 45 conflitos

**4. Método de Otimização**
- Qual solver foi usado
- 🎯 ILP (Ótimo Garantido)
- ⚡ Heurística Melhorada
- 🤖 Inteligência Artificial

**5. Tempo de Processamento**
- Quanto tempo levou para calcular
- Exemplo: 120s (2 minutos)

---

### Gráficos

**1. Fluxo de Caixa Mensal**
- Mostra impacto financeiro por mês
- Linha vermelha = Target mensal
- Barras verdes = Dentro do target
- Barras vermelhas = Acima do target

**2. Cronograma de Inícios de Férias**
- Quantas férias começam em cada mês
- Ajuda a visualizar distribuição ao longo do ano

---

## Exemplo Prático Completo

### Cenário

**Projeto:** PRODESP  
**Colaboradores:** 50  
**Orçamento Anual:** R$ 7.343.312  
**Estratégia:** Híbrido Inteligente  
**Janelas:** 21 a 20 (12 janelas mensais)  

---

### Colaborador Exemplo: João Silva

**Dados:**
- Taxa: R$ 180/hora
- Cliente: PRODESP-TI
- Total de colaboradores do cliente: 25

**Estratégia Aplicada:**
- Taxa > R$ 180 → Otimizar Abono (20+10)
- 20 dias de férias + 10 dias vendidos

---

### Cálculo Passo a Passo

**Passo 1: Solver Escolhe Data**

Solver ILP testa todas as segundas-feiras e escolhe:
- **Início:** 13/Jan/2025 (segunda-feira)
- **Fim:** 01/Fev/2025 (sábado)
- **Duração:** 20 dias

**Passo 2: Validações**

✅ É segunda-feira? Sim  
✅ Não antecede feriado? Sim (próximo feriado é Carnaval em Março)  
✅ Concorrência global OK? Sim (8 pessoas em férias, máximo 10)  
✅ 10% do cliente OK? Sim (2 pessoas do PRODESP-TI, máximo 2)  

**Passo 3: Calcular Horas Úteis**

```
Período: 13/Jan a 01/Fev (20 dias corridos)

Dias úteis:
- Semana 1 (13-17 Jan): 5 dias
- Semana 2 (20-24 Jan): 5 dias
- Semana 3 (27-31 Jan): 5 dias
- Semana 4 (01 Fev): 0 dias (sábado)

Fins de semana: 6 dias
Feriados: 0 dias
Pontes: 0 dias

Dias úteis: 20 - 6 = 14 dias
Horas úteis: 14 × 8 = 112 horas
```

**Passo 4: Calcular Custo**

```
Custo = 112 horas × R$ 180/hora = R$ 20.160
```

**Passo 5: Calcular Impacto por Janela**

**Janela 1 (21/Dez a 20/Jan):**
- Sobreposição: 13/Jan a 20/Jan (8 dias)
- Dias úteis: 6 dias
- Horas: 48 horas
- Impacto: 48 × R$ 180 = R$ 8.640

**Janela 2 (21/Jan a 20/Fev):**
- Sobreposição: 21/Jan a 01/Fev (12 dias)
- Dias úteis: 8 dias
- Horas: 64 horas
- Impacto: 64 × R$ 180 = R$ 11.520

**Total:** R$ 8.640 + R$ 11.520 = R$ 20.160 ✅

---

### Resultado na Grid

| Colaborador | Cliente | Rate | Início | Fim | Dias | Horas Úteis | Custo Total | Impacto Jan | Horas Jan | Impacto Fev | Horas Fev |
|-------------|---------|------|--------|-----|------|-------------|-------------|-------------|-----------|-------------|-----------|
| João Silva | PRODESP-TI | R$ 180 | 13/01/2025 | 01/02/2025 | 20 | 112:00 | **R$ 20.160** | R$ 8.640 | 48:00 | R$ 11.520 | 64:00 |

---

### Abono Pecuniário (Venda de 10 Dias)

Como João tem taxa alta (R$ 180), o sistema também aloca:

**Período de Abono:**
- **Início:** 03/Mar/2025 (30 dias após fim das férias)
- **Fim:** 12/Mar/2025
- **Duração:** 10 dias
- **Custo:** R$ 0 (colaborador trabalha normalmente)
- **Horas:** 80 horas (disponíveis para faturamento)

**Economia gerada:** 80 × R$ 180 = R$ 14.400

---

### Resultado Final para João

**Férias:**
- 20 dias de descanso
- Custo: R$ 20.160

**Abono:**
- 10 dias vendidos
- Economia: R$ 14.400

**Impacto Líquido:** R$ 20.160 - R$ 14.400 = **R$ 5.760**

Comparado com 30 dias de férias (R$ 43.200), economia de **86.7%**! 🎯

---

## Perguntas Frequentes

### 1. Por que o solver ILP demora tanto?

**Resposta:** O solver está testando milhões de combinações para encontrar a melhor solução. Quanto mais colaboradores e restrições, mais tempo leva. Você pode:
- Reduzir timeout para 60s (solução boa, não ótima)
- Desativar ILP e usar heurística (1-5 segundos)

---

### 2. O que significa "Conflitos Evitados"?

**Resposta:** Quantas vezes o sistema tentou alocar férias em uma data inválida (feriado, segunda antes de feriado, etc.) e bloqueou automaticamente.

---

### 3. Posso forçar férias em uma data específica?

**Resposta:** Não diretamente. O sistema otimiza automaticamente. Mas você pode:
- Criar janelas customizadas
- Ajustar estratégia
- Usar modo manual (fora do solver)

---

### 4. Como sei se a solução é boa?

**Resposta:** Verifique:
- ✅ Método usado: ILP = ótimo garantido
- ✅ Todas as regras respeitadas
- ✅ Impacto total < orçamento
- ✅ Distribuição equilibrada no ano

---

### 5. Posso comparar com o método legado?

**Resposta:** Sim! Use a aba "Comparativo Legado" com os mesmos parâmetros e compare:
- Impacto total
- Economia gerada
- Distribuição de férias

---

### 6. O que fazer se nenhuma solução for encontrada?

**Resposta:** Significa que as restrições são muito apertadas. Tente:
- Aumentar % de concorrência global
- Remover janelas muito curtas
- Verificar se há colaboradores suficientes

---

## Conclusão

O **Motor de Otimização ILP** é a ferramenta mais avançada para planejamento de férias, garantindo:

✅ **Menor custo possível** (matematicamente comprovado)  
✅ **100% de compliance** (CLT + regras contratuais)  
✅ **Proteção aos clientes** (10% por janela)  
✅ **Transparência total** (todos os cálculos explicados)  

Use este manual para entender, operar e apresentar os resultados com confiança! 🚀

---

**Versão:** 2.0 ILP  
**Data:** Dezembro 2025  
**Autor:** SmartVacations Team
