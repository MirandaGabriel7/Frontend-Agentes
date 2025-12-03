# Frontend Agentes - FISCATUS

Frontend do portal de agentes de IA do FISCATUS.

## Stack Tecnológica

- React 18 + TypeScript
- Vite
- React Router DOM
- Material UI (MUI v5)
- Axios
- react-markdown + remark-gfm

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:3000`.

## Build

```bash
npm run build
```

## Estrutura do Projeto

```
src/
├── layout/
│   └── MainLayout.tsx      # Layout principal com AppBar
├── pages/
│   ├── AgentsPage.tsx      # Portal de agentes
│   ├── TrpAgentPage.tsx    # Agente TRP
│   └── DfdAgentPage.tsx    # Agente DFD (stub)
├── services/
│   └── api.ts              # Cliente Axios e funções de API
├── App.tsx                 # Rotas principais
├── main.tsx               # Entry point
└── theme.ts               # Tema MUI customizado
```

## Rotas

- `/` → Redireciona para `/agents`
- `/agents` → Portal de agentes
- `/agents/trp` → Agente TRP
- `/agents/dfd` → Agente DFD

## API

O frontend espera que o backend esteja rodando e expondo APIs em `/api/*`. O Vite está configurado para fazer proxy das requisições `/api` para `http://localhost:8000` durante o desenvolvimento.

### Endpoints esperados:

- `POST /api/files/upload` - Upload de arquivos
- `POST /api/agents/trp/run` - Executar agente TRP

