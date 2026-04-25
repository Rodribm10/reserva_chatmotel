# Reserva 1001 — SaaS de reservas de hotéis/motéis

Página pública de reserva com geração de PIX multi-tenant. Nasceu como fallback do fluxo de PIX do Chatwoot (fazer.ai) para as marcas do Grupo Nova, mas agora é um produto: qualquer rede pode ter sua própria identidade, dados e subdomínio.

**Status:** Fase 4 — Multi-tenant + Admin (em andamento). Público funcional, admin completo, deploy pendente.

## Stack

- **Vite 6 + React 19 + TypeScript** + React Router
- **Tailwind v4** com tema via CSS variables dinâmicas
- **Supabase** (Postgres + Auth + Storage + RLS) — schema `reserva_hotel`
- **Integração Chatwoot** — endpoint público `POST /public/api/v1/captain/public_reservations`
- **qrcode.react** · **react-colorful** (admin)
- **Vitest** + Testing Library
- Google Fonts carregadas dinamicamente (fontes vem do `app_config` do tenant)

## Arquitetura

```
┌─────────────────────────────┐       ┌──────────────────────┐
│  {slug}.reserva.fazer.ai    │──────▶│  Chatwoot (Rails)    │
│  Next/Vite + Supabase       │  API  │  PublicReservations  │
│  • Página pública /         │       │  Controller          │
│  • Admin /admin/*           │       │  CobService (Inter)  │
└──────────┬──────────────────┘       └──────────┬───────────┘
           │                                      │
           ▼                                      ▼
   ┌───────────────┐                      ┌──────────────┐
   │  Supabase     │                      │  Banco Inter │
   │  reserva_hotel│                      │  (PIX)       │
   │  schema       │                      └──────────────┘
   └───────────────┘
```

## Multi-tenant

Cada rede de hotéis/motéis é um **tenant** no banco. O subdomínio da URL identifica qual tenant carregar:

| URL | Tenant | Config |
|---|---|---|
| `grupo-1001.reserva.fazer.ai` | `grupo-1001` | "Rede 1001", Fraunces, champagne |
| `motel-ocean.reserva.fazer.ai` | `motel-ocean` | "Motel Ocean", Playfair, cyan |
| `localhost:5180` (dev) | fallback via `VITE_DEFAULT_TENANT_SLUG` | define no `.env.local` |

Todos os dados (marcas, unidades, preços, fotos, extras, reservas) são filtrados por `tenant_id`. O admin só enxerga dados do tenant ao qual o usuário logado está associado (via tabela `tenant_members`).

## Setup local

```bash
pnpm install
cp .env.local.example .env.local
# preencha .env.local com as credenciais (ver abaixo)
pnpm dev
```

Acesse `http://localhost:5180/` (fallback pro tenant `grupo-1001`).

### Variáveis de ambiente

```bash
# Supabase
VITE_SUPABASE_URL=https://acdvblhzzaneddlxqyst.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key do projeto>
VITE_SUPABASE_SCHEMA=reserva_hotel

# Chatwoot (pra o endpoint público de reservas)
VITE_CHATWOOT_API_URL=https://chatwoot.fazer.ai
VITE_CHATWOOT_API_TOKEN=<token definido em chatwoot/.env como RESERVA_1001_API_TOKEN>

# Multi-tenant: slug default quando rodando sem subdomínio
VITE_DEFAULT_TENANT_SLUG=grupo-1001
```

## Admin

Acesse `http://localhost:5180/admin` (redireciona para `/admin/login`).

**Usuário de teste (dev):**
- Email: `admin@reserva.test`
- Senha: `Admin1234!`
- Associado ao tenant `grupo-1001`

### Abas

| Aba | O que faz |
|---|---|
| **Aparência** | Nome, títulos, logo, favicon, 5 cores (primária/secundária/fundo/superfície/texto), 2 fontes (display/corpo) — tudo editável com color picker e preview |
| **Marcas** | CRUD de marcas. Categorias e permanências como listas CSV |
| **Unidades** | CRUD de unidades. Vincula marca + conta Inter + `chatwoot_unit_id` |
| **Categorias** | Edita `marcas.categorias` como lista ordenável |
| **Preços** | Grid categoria × permanência, editável inline, salva em batch |
| **Fotos** | Upload direto pro Supabase Storage ou URL manual, por unidade + categoria |
| **Extras** | CRUD de extras (tira-gosto, decoração, etc) por marca |
| **Reservas** | Read-only com filtros de status/data + link pra conversa no Chatwoot |

### Como criar um novo tenant

Via SQL (enquanto não tem UI de onboarding):

```sql
-- 1. Cria o tenant
insert into reserva_hotel.tenants (slug, nome, ativo)
values ('motel-xyz', 'Motel XYZ', true);

-- 2. Cria a app_config com os defaults
insert into reserva_hotel.app_config (tenant_id, nome_rede, titulo_hero, subtitulo_hero, tagline, footer_text)
select t.id, 'Motel XYZ', 'Reserva Motel XYZ', 'Experiência única', 'Reserve sua suíte agora.', '© 2026 Motel XYZ'
from reserva_hotel.tenants t where t.slug = 'motel-xyz';

-- 3. Crie um user admin via /auth/v1/signup e associe
insert into reserva_hotel.tenant_members (tenant_id, user_id, role)
select t.id, u.id, 'admin'
  from reserva_hotel.tenants t, auth.users u
 where t.slug = 'motel-xyz' and u.email = 'admin@motelxyz.com';
```

Depois acesse via `motel-xyz.reserva.fazer.ai` (ou em dev, altere `VITE_DEFAULT_TENANT_SLUG`).

## Supabase Storage

O upload de fotos usa o bucket **`reserva-fotos`**. Crie-o no dashboard Supabase antes de usar:
- Storage → New bucket → name: `reserva-fotos` → Public: ✓

## Integração Chatwoot

O fluxo de geração de PIX reutiliza a tubulação existente do Chatwoot fazer.ai:

1. Cliente preenche a página pública e clica "Confirmar e Pagar"
2. Frontend chama `POST /public/api/v1/captain/public_reservations` no Chatwoot (autenticado via `X-Reserva-Token`)
3. Chatwoot cria `Contact` + `Conversation` + `Captain::Reservation` e gera PIX via `Captain::Inter::CobService`
4. Retorna `{ reservation_id, pix: { txid, copia_e_cola, ... } }`
5. Frontend mostra QR code + faz polling do status
6. Cliente paga → webhook Inter → `ConfirmationService` → mensagem automática na conversa
7. Frontend detecta o status `paid` → tela de sucesso

Veja `chatwoot/docs/superpowers/specs/2026-04-13-reserva-1001-design.md` e `chatwoot/docs/superpowers/plans/` pros detalhes de cada fase.

## Comandos

| Comando | Descrição |
|---|---|
| `pnpm dev` | Dev server com HMR (porta 5180) |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview do build |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm test` | Vitest |
| `pnpm test:watch` | Vitest em watch |
| `pnpm typecheck` | TypeScript check |
| `pnpm supabase:types` | Regenera tipos do schema `reserva_hotel` |

## Estrutura do código

```
src/
├── components/
│   ├── admin/            # DataTable, Modal, AuthGate
│   ├── reservation/      # StayDetailsStep, ImageGallery, PriceSummary, CustomerForm, ReservationFlow
│   ├── checkout/         # PixCheckout (QR + polling), SuccessScreen
│   └── ui/               # Button (shadcn-style)
├── contexts/
│   └── TenantProvider.tsx  # carrega tenant + aplica tema CSS vars + Google Fonts
├── hooks/
│   ├── useAppConfig.ts     # useAppConfig() + useTenantId()
│   ├── useAuth.ts          # Supabase Auth hook
│   ├── useCrud.ts          # CRUD genérico filtrado por tenant
│   └── useReservationForm.ts  # estado em cascata do form público
├── lib/
│   ├── supabase.ts         # cliente Supabase (schema reserva_hotel)
│   ├── tenant.ts           # resolve slug por subdomínio
│   ├── appConfig.ts        # carrega tenant + app_config
│   ├── chatwootApi.ts      # client do endpoint público do Chatwoot
│   ├── formatters.ts       # BRL, CPF, telefone
│   └── prefill.ts          # query params → form state
├── pages/
│   ├── ReservationPage.tsx # página pública (/)
│   └── admin/              # LoginPage, AdminLayout, 8 abas
├── services/
│   └── catalogoService.ts  # queries Supabase filtradas por tenant
└── router.tsx              # React Router
```

## Deploy (Fase 4-F pendente)

Plano: Vercel com **wildcard domain** `*.reserva.fazer.ai`.

Passos resumidos:
1. `vercel link` no diretório
2. Configurar env vars no painel Vercel (idem `.env.local.example`)
3. Apontar `reserva.fazer.ai` via DNS CNAME pro Vercel
4. Project Settings → Domains → adicionar `*.reserva.fazer.ai`
5. Primeiro deploy: `vercel --prod`

## Referências

- **Spec de design**: `chatwoot/docs/superpowers/specs/2026-04-13-reserva-1001-design.md`
- **Plano Fase 1 (fundação)**: `chatwoot/docs/superpowers/plans/2026-04-13-reserva-1001-fase-1-fundacao.md`
- **Plano Fase 2+3 (backend + fluxo)**: `chatwoot/docs/superpowers/plans/2026-04-13-reserva-1001-fase-2-3-fluxo-completo.md`
- **Plano Fase 3.5 (Jasmine prefill)**: `chatwoot/docs/superpowers/plans/2026-04-14-reserva-1001-fase-3-5-angelina-prefill.md`
- **Plano Fase 4 (multi-tenant + admin)**: `chatwoot/docs/superpowers/plans/2026-04-14-reserva-1001-fase-4-multitenant-admin.md`
<!-- teste de fluxo Kilo-Oracle apos upgrade v0.1.27 -->
