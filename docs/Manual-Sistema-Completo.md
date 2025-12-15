# Manual do Sistema SmartVacations Enterprise

## 📚 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Funcionalidades do Sistema](#funcionalidades-do-sistema)
4. [Guia de Navegação](#guia-de-navegação)
5. [Módulos Principais](#módulos-principais)
6. [Dados e Cadastros](#dados-e-cadastros)
7. [Como Começar](#como-começar)
8. [Glossário](#glossário)

---

## Visão Geral do Sistema

### O Que É o SmartVacations?

O **SmartVacations Enterprise** é um sistema completo de **gestão e otimização de férias** para empresas que prestam serviços por projeto. Ele ajuda a planejar as férias dos colaboradores de forma inteligente, **minimizando o impacto no faturamento** enquanto respeita todas as regras trabalhistas (CLT) e contratuais.

### Para Quem É?

- **Gestores de Projeto**: Planejar férias sem comprometer entregas
- **RH**: Garantir compliance trabalhista
- **Financeiro**: Minimizar impacto no faturamento
- **Diretoria**: Tomar decisões baseadas em dados

### Principais Benefícios

✅ **Economia de 15-25%** no impacto de férias  
✅ **100% de Compliance** com CLT e regras contratuais  
✅ **Proteção aos Clientes** (máximo 10% em férias)  
✅ **Decisões Inteligentes** baseadas em algoritmos matemáticos  
✅ **Transparência Total** de todos os cálculos  

---

## Arquitetura e Tecnologias

### Arquitetura do Sistema

```
┌─────────────────────────────────────────┐
│         FRONTEND (React + Vite)         │
│  - Interface do Usuário                 │
│  - Visualizações e Gráficos             │
│  - Configurações                        │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
                 ↓
┌─────────────────────────────────────────┐
│      BACKEND (FastAPI + Python)         │
│  - APIs REST                            │
│  - Lógica de Negócio                    │
│  - Motores de Otimização                │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ↓                     ↓
┌──────────┐         ┌──────────────┐
│  PuLP    │         │   OpenAI     │
│  Solver  │         │   (Opcional) │
└──────────┘         └──────────────┘
```

---

### Stack Tecnológico

#### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 19.2.0 | Framework UI |
| **TypeScript** | 5.8.2 | Tipagem estática |
| **Vite** | 6.2.0 | Build tool rápido |
| **Lucide React** | 0.555.0 | Ícones modernos |
| **Recharts** | 3.5.1 | Gráficos e visualizações |

**Por que essas tecnologias?**
- **React**: Componentes reutilizáveis e performance
- **TypeScript**: Reduz bugs com tipagem
- **Vite**: Build extremamente rápido
- **Recharts**: Gráficos interativos e responsivos

---

#### Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **FastAPI** | 0.109.0 | Framework web moderno |
| **Python** | 3.10+ | Linguagem principal |
| **Pydantic** | 2.7.4 | Validação de dados |
| **PuLP** | 2.8.0 | Solver de otimização ILP |
| **Pandas** | 2.2.0 | Manipulação de dados |
| **LangChain** | 0.3.12 | Integração com IA |
| **OpenAI** | 1.55.3 | Modelos de linguagem |
| **Uvicorn** | 0.27.0 | Servidor ASGI |

**Por que essas tecnologias?**
- **FastAPI**: APIs rápidas com documentação automática
- **PuLP**: Solver matemático para otimização ótima
- **Pydantic**: Validação robusta de dados
- **LangChain**: Integração fácil com modelos de IA

---

### Estrutura de Diretórios

```
SmartVacations-Enterprise/
├── backend/                    # Backend Python
│   ├── app/
│   │   ├── main.py            # Entrada da API
│   │   ├── schemas.py         # Modelos de dados
│   │   ├── routers/           # Endpoints da API
│   │   │   ├── optimization.py
│   │   │   └── legacy.py
│   │   └── services/          # Lógica de negócio
│   │       ├── optimization_engine.py  # Motor ILP
│   │       └── legacy_engine.py        # Motor Legado
│   └── requirements.txt       # Dependências Python
│
├── components/                # Componentes React
│   ├── Layout.tsx            # Layout principal
│   ├── OptimizationPage.tsx  # Motor de Otimização
│   ├── LegacyComparisonPage.tsx
│   ├── EmployeeList.tsx
│   ├── ClientList.tsx
│   └── ProjectList.tsx
│
├── services/                 # Serviços frontend
│   └── holidayApi.ts        # API de feriados
│
├── docs/                     # Documentação
│   ├── Manual-Motor-Otimizacao-ILP.md
│   └── Manual-Comparativo-Legado-Detalhado.md
│
├── types.ts                  # Tipos TypeScript
├── App.tsx                   # Componente principal
└── package.json             # Dependências Node
```

---

## Funcionalidades do Sistema

### 1. Gestão de Projetos

**O que faz:**
- Cadastro de projetos com orçamento e prazos
- Configuração de regras por projeto
- Acompanhamento de status

**Informações gerenciadas:**
- Nome e descrição do projeto
- Orçamento anual
- Moeda (BRL, ARS, CLP, etc.)
- Datas de início e fim
- Regras de concorrência (% máximo em férias)
- Dia preferencial de início (segunda-feira)

---

### 2. Gestão de Clientes

**O que faz:**
- Cadastro de clientes tomadores de serviço
- Vinculação de clientes a projetos
- Controle de colaboradores por cliente

**Informações gerenciadas:**
- Nome do cliente (ex: CDHU, Detran)
- Pessoa de contato
- Email
- Projetos contratados
- Status (Ativo/Inativo)

**Por que é importante:**
- Controlar regra de 10% (não deixar cliente desfalcado)
- Rastrear impacto por cliente
- Gestão de relacionamento

---

### 3. Gestão de Colaboradores

**O que faz:**
- Cadastro de colaboradores
- Vinculação a clientes e projetos
- Definição de taxa horária

**Informações gerenciadas:**
- Nome do colaborador
- Data de admissão
- Taxa horária (R$/hora)
- Cliente alocado
- Projeto
- Localização (para feriados regionais)

---

### 4. Motor de Otimização ILP

**O que faz:**
- Calcula a **melhor alocação possível** de férias
- Usa Programação Linear Inteira (matemática)
- Garante solução ótima

**Características:**
- ✅ Solução matematicamente ótima
- ✅ Respeita todas as regras
- ✅ Minimiza impacto no faturamento
- ⏱️ Tempo: 30s a 5 minutos

**Quando usar:**
- Planejamento anual de férias
- Quando economia é crítica
- Quando pode aguardar alguns minutos

---

### 5. Comparativo Legado

**O que faz:**
- Aloca férias usando método heurístico
- Calcula economia vs pior cenário
- Análise por janelas de medição

**Características:**
- ⚡ Rápido (1-5 segundos)
- ✅ Respeita regra de 10% por cliente
- 📊 Foco em comparação e economia
- 🎯 Solução boa (85-95% do ótimo)

**Quando usar:**
- Análise rápida
- Comparação com ILP
- Demonstração de economia

---

### 6. Configuração de Regras CLT

**O que faz:**
- Define regras trabalhistas aplicadas
- Configuração de fracionamento
- Abono pecuniário (venda de dias)

**Regras configuráveis:**
- Dias de férias padrão (30)
- Permitir fracionamento (2 ou 3 períodos)
- Período principal mínimo (14 dias)
- Limite de venda de dias (10)

---

### 7. Calendário de Feriados

**O que faz:**
- Visualização de feriados nacionais
- Feriados estaduais (SP, RJ, RS)
- Identificação de pontes

**Feriados gerenciados:**
- Fixos (Natal, Ano Novo, etc.)
- Móveis (Carnaval, Páscoa, Corpus Christi)
- Estaduais por região

---

### 8. Configuração de IA

**O que faz:**
- Integração com OpenAI
- Geração de alocações via IA
- Customização de prompts

**Configurações:**
- Provedor (OpenAI)
- Modelo (GPT-4o-mini)
- API Key
- Prompt customizado

---

## Guia de Navegação

### Menu Principal

O sistema possui **8 seções principais** acessíveis pelo menu lateral:

```
┌─────────────────────────┐
│  📊 Dashboard           │  ← Visão geral do projeto
├─────────────────────────┤
│  👥 Colaboradores       │  ← Gestão de pessoas
├─────────────────────────┤
│  🏢 Clientes            │  ← Gestão de clientes
├─────────────────────────┤
│  📁 Projetos            │  ← Gestão de projetos
├─────────────────────────┤
│  ⚙️ Regras CLT          │  ← Configurações trabalhistas
├─────────────────────────┤
│  📅 Feriados            │  ← Calendário de feriados
├─────────────────────────┤
│  🎯 Motor Otimização    │  ← Otimização ILP
├─────────────────────────┤
│  📈 Comparativo Legado  │  ← Método heurístico
├─────────────────────────┤
│  🤖 Configuração IA     │  ← Integração OpenAI
└─────────────────────────┘
```

---

### 1. Dashboard

**O que mostra:**
- Resumo do projeto selecionado
- Total de colaboradores
- Total de clientes
- Orçamento do projeto
- Ano de vigência
- Próximas férias previstas

**Como usar:**
1. Selecionar projeto no topo
2. Visualizar métricas principais
3. Identificar próximas ações

---

### 2. Colaboradores

**O que mostra:**
- Lista de todos os colaboradores
- Filtros por projeto
- Informações de taxa e cliente

**Ações disponíveis:**
- ✏️ Editar colaborador
- 👁️ Ver detalhes
- 🔍 Filtrar por cliente

**Informações exibidas:**
- Nome
- Cliente alocado
- Taxa horária
- Data de admissão
- Localização

---

### 3. Clientes

**O que mostra:**
- Lista de clientes tomadores
- Projetos vinculados
- Status (Ativo/Inativo)

**Ações disponíveis:**
- ➕ Adicionar cliente
- ✏️ Editar cliente
- 🗑️ Excluir cliente
- 🔗 Vincular a projetos

**Informações exibidas:**
- Nome do cliente
- Pessoa de contato
- Email
- Projetos contratados
- Quantidade de colaboradores

---

### 4. Projetos

**O que mostra:**
- Lista de todos os projetos
- Status e orçamento
- Configurações

**Ações disponíveis:**
- ➕ Criar projeto
- ✏️ Editar projeto
- 🗑️ Excluir projeto
- ⚙️ Configurar regras

**Informações exibidas:**
- Nome do projeto
- Gerente responsável
- Orçamento
- Moeda
- Período de vigência
- Status
- Regras de concorrência

---

### 5. Regras CLT

**O que mostra:**
- Configurações trabalhistas
- Regras de fracionamento
- Abono pecuniário

**Configurações disponíveis:**
- Dias de férias padrão (30)
- Permitir fracionamento (Sim/Não)
- Período principal mínimo (14 dias)
- Limite de venda de dias (10)

**Como usar:**
1. Ajustar configurações conforme necessidade
2. Clicar em "ATUALIZAR REGRAS"
3. Regras aplicam-se a todos os cálculos

---

### 6. Feriados

**O que mostra:**
- Calendário de feriados brasileiros
- Feriados por estado
- Identificação de pontes

**Informações exibidas:**
- Data do feriado
- Nome do feriado
- Tipo (Nacional/Estadual)
- Dia da semana
- Se gera ponte

**Como usar:**
- Consultar feriados do ano
- Identificar períodos críticos
- Planejar alocações

---

### 7. Motor de Otimização ILP

**O que mostra:**
- Interface de configuração
- Resultados da otimização
- Métricas e gráficos

**Seções principais:**

#### A. Configuração
- Estratégia de férias
- Faturamento esperado
- Regras ativas
- Solver ILP (Ativar/Desativar)
- Timeout do solver
- Janelas de medição

#### B. Resultados - Grid
- Tabela detalhada de alocações
- Colunas por janela
- Impacto financeiro
- Horas úteis

#### C. Resultados - Dashboard
- Impacto financeiro total
- Economia gerada
- Conflitos evitados
- Método usado (ILP/Heurística/IA)
- Tempo de processamento
- Gráfico de fluxo de caixa
- Cronograma de férias

**Como usar:**
1. Configurar janelas (21 a 20, ano 2025)
2. Clicar em "Gerar Janelas"
3. Selecionar estratégia
4. Ativar Solver ILP
5. Clicar em "EXECUTAR SOLVER INTELIGENTE"
6. Aguardar processamento
7. Analisar resultados

---

### 8. Comparativo Legado

**O que mostra:**
- Interface de configuração
- Resultados da alocação
- Análise de economia

**Seções principais:**

#### A. Configuração
- Estratégia de férias
- Lógica de alocação (Smart/Taxa)
- Janelas de medição

#### B. Resultados - Tabela
- Colaborador
- Cliente
- Datas de início e fim
- Breakdown (divisão de períodos)
- Impacto total
- Horas úteis
- Pior caso
- Economia gerada
- Economia %
- Impacto por janela

#### C. Métricas Gerais
- Impacto total
- Total de horas
- Economia total
- Quantidade de colaboradores

**Como usar:**
1. Configurar janelas
2. Selecionar estratégia
3. Escolher lógica de alocação
4. Clicar em "EXECUTAR COMPARATIVO"
5. Analisar resultados e economia

---

### 9. Configuração IA

**O que mostra:**
- Configurações de integração OpenAI
- Histórico de salvamentos
- Prompts customizados

**Configurações:**
- Provedor (OpenAI)
- Modelo (gpt-4o-mini, gpt-4, etc.)
- API Key
- Prompt customizado

**Como usar:**
1. Inserir API Key da OpenAI
2. Selecionar modelo
3. Customizar prompt (opcional)
4. Clicar em "SALVAR"
5. Ativar "Calcular com IA" no Motor de Otimização

---

## Módulos Principais

### Motor de Otimização ILP

**Tecnologia:** Programação Linear Inteira (PuLP + CBC)

**O que faz:**
1. Recebe colaboradores e configurações
2. Gera todas as datas válidas (segundas-feiras)
3. Cria modelo matemático de otimização
4. Define variáveis de decisão (0 ou 1)
5. Adiciona restrições (CLT, feriados, 10% cliente)
6. Resolve problema matemático
7. Retorna solução ótima

**Regras aplicadas:**
- ✅ CLT (30 dias/ano)
- ✅ Concorrência global (% máximo)
- ✅ 10% por cliente por janela
- ✅ Segundas-feiras válidas
- ✅ Separação de períodos (30 dias)

**Saída:**
- Lista de alocações otimizadas
- Impacto financeiro total
- Método usado (ILP)
- Tempo de processamento

---

### Comparativo Legado

**Tecnologia:** Algoritmo Heurístico (Guloso)

**O que faz:**
1. Recebe colaboradores e configurações
2. Ordena colaboradores (taxa/mediana)
3. Para cada colaborador:
   - Testa todas as segundas
   - Valida regras
   - Escolhe menor custo
4. Calcula economia vs pior caso
5. Retorna alocações e métricas

**Regras aplicadas:**
- ✅ 10% por cliente por janela
- ✅ Segundas-feiras válidas
- ✅ CLT (30 dias/ano)

**Saída:**
- Lista de alocações
- Impacto total
- Pior caso
- Economia gerada
- Economia %

---

## Dados e Cadastros

### Dados Necessários

Para usar o sistema, você precisa cadastrar:

1. **Projetos**
   - Nome, orçamento, moeda
   - Datas de vigência
   - Regras de concorrência

2. **Clientes**
   - Nome, contato, email
   - Vinculação a projetos

3. **Colaboradores**
   - Nome, admissão
   - Taxa horária
   - Cliente e projeto
   - Localização

---

### Fluxo de Dados

```
1. CADASTRO
   ↓
   Projetos → Clientes → Colaboradores
   
2. CONFIGURAÇÃO
   ↓
   Regras CLT + Janelas de Medição
   
3. OTIMIZAÇÃO
   ↓
   Motor ILP ou Comparativo Legado
   
4. RESULTADOS
   ↓
   Grid + Dashboard + Gráficos
```

---

## Como Começar

### Passo 1: Configuração Inicial

1. **Criar Projeto**
   - Ir em "Projetos"
   - Clicar em "Adicionar Projeto"
   - Preencher dados
   - Salvar

2. **Cadastrar Clientes**
   - Ir em "Clientes"
   - Adicionar clientes tomadores
   - Vincular ao projeto

3. **Cadastrar Colaboradores**
   - Ir em "Colaboradores"
   - Importar ou adicionar manualmente
   - Vincular a clientes e projeto

---

### Passo 2: Configurar Regras

1. **Regras CLT**
   - Ir em "Regras CLT"
   - Ajustar configurações
   - Salvar

2. **Verificar Feriados**
   - Ir em "Feriados"
   - Conferir calendário do ano

---

### Passo 3: Executar Otimização

1. **Motor ILP (Recomendado)**
   - Ir em "Motor de Otimização"
   - Configurar janelas (21 a 20)
   - Gerar janelas
   - Selecionar estratégia
   - Executar solver
   - Analisar resultados

2. **Comparativo Legado (Alternativa)**
   - Ir em "Comparativo Legado"
   - Configurar janelas
   - Executar comparativo
   - Ver economia gerada

---

### Passo 4: Análise e Decisão

1. **Comparar Métodos**
   - Executar ambos (ILP + Legado)
   - Comparar impacto total
   - Verificar economia

2. **Validar Regras**
   - Conferir se todas as férias começam em segundas
   - Verificar 10% por cliente
   - Confirmar compliance CLT

3. **Exportar Resultados**
   - Clicar em "Exportar Excel"
   - Compartilhar com stakeholders

---

## Glossário

### Termos Técnicos

**ILP (Integer Linear Programming)**
- Programação Linear Inteira
- Técnica matemática para otimização
- Garante solução ótima

**Heurística**
- Método prático baseado em regras
- Encontra boa solução rapidamente
- Não garante otimalidade

**Solver**
- Resolvedor de problemas matemáticos
- No caso: PuLP com backend CBC

**Bridge-Aware**
- Considera pontes (feriados em terças/quintas)
- Calcula horas úteis reais

---

### Termos de Negócio

**Impacto Financeiro**
- Quanto o projeto deixa de faturar durante férias
- Calculado: Horas úteis × Taxa

**Pior Caso**
- Cenário onde todos os dias são úteis
- Usado para calcular economia

**Economia**
- Diferença entre pior caso e impacto real
- Demonstra valor da otimização

**Janela de Medição**
- Período de análise (ex: 21/Jan a 20/Fev)
- Usado para rastrear impacto mensal

**Concorrência**
- Quantidade de pessoas em férias simultaneamente
- Controlado por % máximo

**10% por Cliente**
- Máximo de colaboradores de um cliente em férias por janela
- Protege cliente de ficar desfalcado

---

### Estratégias de Férias

**STANDARD_30**
- 30 dias contínuos
- Mais simples

**SELL_10**
- 20 dias de férias + 10 dias vendidos
- Abono pecuniário
- Para colaboradores com taxa alta

**SPLIT_2_PERIODS**
- 15 + 15 dias
- Fracionamento em 2 períodos

**SPLIT_3_PERIODS**
- 14 + 8 + 8 dias
- Máximo fracionamento permitido

**SMART_HYBRID**
- Automático por taxa
- Taxa > R$ 180 → SELL_10
- Taxa ≤ R$ 180 → STANDARD_30

---

## Suporte e Documentação

### Manuais Disponíveis

1. **Manual do Motor de Otimização ILP**
   - [`docs/Manual-Motor-Otimizacao-ILP.md`](file:///c:/Users/User/Documents/PYTHON/SmartVacations-Enterprise/docs/Manual-Motor-Otimizacao-ILP.md)

2. **Manual do Comparativo Legado**
   - [`docs/Manual-Comparativo-Legado-Detalhado.md`](file:///c:/Users/User/Documents/PYTHON/SmartVacations-Enterprise/docs/Manual-Comparativo-Legado-Detalhado.md)

3. **Manual do Sistema** (este documento)
   - [`docs/Manual-Sistema-Completo.md`](file:///c:/Users/User/Documents/PYTHON/SmartVacations-Enterprise/docs/Manual-Sistema-Completo.md)

---

## Conclusão

O **SmartVacations Enterprise** é uma solução completa para gestão inteligente de férias, combinando:

✅ **Tecnologia de ponta** (React + FastAPI + PuLP)  
✅ **Algoritmos avançados** (ILP + Heurística + IA)  
✅ **Interface intuitiva** e profissional  
✅ **Compliance total** com CLT e regras contratuais  
✅ **Economia comprovada** de 15-25%  

Use este manual como guia completo para operar o sistema com confiança! 🚀

---

**Versão:** 2.0  
**Data:** Dezembro 2025  
**Autor:** SmartVacations Team
