# Guia de Deploy e Migração - SmartVacations Enterprise

Este guia explica como transportar este projeto para outro computador, garantindo que o Backend (Python 3.12) e o Frontend (React) funcionem corretamente.

## 1. Preparação (Computador de Origem)

Antes de zipar a pasta, você deve **remover** as pastas pesadas e geradas automaticamente. Isso reduz o tamanho do arquivo e evita conflitos de configuração.

**Pastas para EXCLUIR antes de zipar:**
*   `backend/venv` (Ambiente virtual Python)
*   `backend/__pycache__` (Arquivos temporários do Python - pode haver várias)
*   `backend/smartvacations.db` (**OPCIONAL**: Mantenha se quiser levar os dados. Apague se quiser limpar o banco.)
*   `node_modules` (Dependências do Frontend)
*   `.git` (Se não quiser levar o histórico de versionamento)

**O que deve sobrar:**
*   Pasta `backend` com `app/`, `requirements.txt`, `main.py`, etc.
*   Pasta raiz com `src/`, `components/`, `package.json`, `tsconfig.json`, `App.tsx`, etc.

**Passo Final:**
1.  Selecione todas as pastas restantes.
2.  Clique com botão direito -> "Enviar para" -> "Pasta compactada (zip)".
3.  Leve este arquivo `.zip` para o novo computador.

---

## 2. Instalação (Computador de Destino)

### Pré-requisitos
*   **Python 3.12** instalado. (Verifique com `python --version`)
*   **Node.js** (LTS) instalado. (Verifique com `node -v`)

### Passo 1: Configurar o Backend (API)

1.  Descompacte o projeto.
2.  Abra um terminal na pasta `backend`.
3.  Crie o ambiente virtual forçando o Python 3.12:
    ```bash
    py -3.12 -m venv venv
    # OU, se o python principal já for o 3.12:
    python -m venv venv
    ```
4.  Ative o ambiente virtual:
    *   **Windows**: `.\venv\Scripts\activate`
    *   **Linux/Mac**: `source venv/bin/activate`
5.  Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```
6.  Inicie o servidor:
    ```bash
    uvicorn app.main:app --reload
    ```
    *Se der erro de porta, use:* `uvicorn app.main:app --reload --port 8001`

### Passo 2: Configurar o Frontend (React)

1.  Abra um **novo terminal** na pasta raiz do projeto (onde está `package.json`).
2.  Instale as dependências do Node:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## Resumo dos Comandos

**Backend (Terminal 1):**
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

Acesse o sistema em: `http://localhost:5173` (ou a porta indicada pelo npm).
