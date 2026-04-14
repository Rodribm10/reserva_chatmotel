# Reserva Rede 1001

Página pública de reserva para as marcas do Grupo Nova (Hotel 1001 Noites, Prime, Express, Dolce Amore).

**Status:** Fase 1 — Fundação

## Stack

- Vite 6 + React 19 + TypeScript
- Tailwind v4 com paleta premium (obsidian/champagne/rose-gold)
- Supabase (Postgres + Auth + Storage), schema `reserva_hotel` no projeto InAudit Hotel
- framer-motion + anime.js
- Vitest + Testing Library

## Setup local

1. Instale as dependências:
   ```bash
   pnpm install
   ```

2. Copie as variáveis de ambiente:
   ```bash
   cp .env.local.example .env.local
   ```
   Preencha `VITE_SUPABASE_ANON_KEY` com a anon key do projeto Supabase `acdvblhzzaneddlxqyst` (InAudit Hotel).

3. Rode o dev server:
   ```bash
   pnpm dev
   ```
   Abre em `http://localhost:5173`.

## Comandos

| Comando | Descrição |
|---|---|
| `pnpm dev` | Dev server com HMR |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview do build |
| `pnpm lint` | Roda ESLint |
| `pnpm format` | Formata com Prettier |
| `pnpm test` | Roda testes (Vitest) |
| `pnpm test:watch` | Testes em watch mode |
| `pnpm typecheck` | TypeScript check |
| `pnpm supabase:types` | Regenera tipos do Supabase |

## Estrutura

```
src/
├── components/    # Componentes React
│   └── ui/        # Primitivos shadcn/ui
├── lib/           # Clientes (supabase) e utils
├── types/         # Tipos gerados do Supabase
└── __tests__/     # Testes Vitest
supabase/
└── migrations/    # SQL de schema (source of truth)
_poc-reference/    # POC antigo — só pra consultar
```

## Paleta premium

| Token | Hex | Uso |
|---|---|---|
| `obsidian` | `#0B0D12` | Fundo principal |
| `midnight` | `#0F1A2E` | Superfícies elevadas |
| `champagne` | `#C9A961` | Ação primária, luxo |
| `rose-gold` | `#E8B4A0` | Acento secundário |
| `ivory` | `#F5F1E8` | Texto principal |
| `slate` | `#6B7280` | Texto secundário |
| `emerald` | `#10B981` | Sucesso |
| `ruby` | `#E11D48` | Erro |

## Integração com Chatwoot

Esta fase **não** integra com Chatwoot ainda. A geração de PIX acontece na Fase 2, onde um endpoint novo é criado no Chatwoot (`POST /public/api/v1/captain/public_reservations`) e esta app passa a consumir.

## Referências

- Spec de design: `chatwoot/docs/superpowers/specs/2026-04-13-reserva-1001-design.md`
- Plano Fase 1: `chatwoot/docs/superpowers/plans/2026-04-13-reserva-1001-fase-1-fundacao.md`
