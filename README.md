# Timao e Pumba Tips — plataforma esportiva, comunidade e CRM

Plataforma esportiva propria (PWA) para maiores de 18 anos: jogos, analises,
comunidade e um funil completo de aquisicao ate FTD (primeiro deposito),
com atribuicao de campanhas, CRM e automacoes. Ver o PRD original para o
escopo completo; este README documenta o que foi implementado e como rodar.

## Stack

- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript, Tailwind CSS
- **Banco/Auth/Realtime**: Supabase (Postgres, Auth, Realtime, RLS)
- **Push**: Firebase Cloud Messaging (via `firebase` no client, `firebase-admin` no servidor)
- **Dados esportivos**: abstracao `SportsDataProvider` (mock por padrao; Flashscore4/RapidAPI pronto para plugar — ver `docs/sports-data-provider.md`)
- **PWA**: `public/manifest.json` + `public/sw.js` (instalavel, push, shell offline minimo)

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com um projeto Supabase real
npm run dev
```

Abra http://localhost:3000. As paginas fazem uso extensivo de Server
Components/Route Handlers que precisam de `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` — sem isso a
maioria das rotas dinamicas retorna erro em runtime (o build estatico
funciona sem env, pois as chamadas ao Supabase sao lazy).

### Banco de dados

As migrations em `supabase/migrations/` criam o schema completo (todas as
tabelas do PRD, secao 22), politicas de RLS e dados de seed (papeis,
entitlements, salas de comunidade, pipeline de CRM, config de onboarding).
Aplique com a Supabase CLI:

```bash
supabase link --project-ref <seu-projeto>
supabase db push
```

### Criando o primeiro administrador

Nao ha UI para promover um usuario a `ADMIN` (fora do escopo do MVP). Depois
de criar uma conta normalmente pelo app, rode no SQL editor do Supabase:

```sql
update users set access_level = 'ADMIN' where email = 'voce@exemplo.com';
```

Isso libera `/admin`.

## O que esta implementado

Seguindo a ordem de prioridade do PRD (secao 32: fluxo antes de interface):

1. **Tracking e atribuicao** (`src/middleware.ts`, `src/lib/tracking/`): Lead
   ID gerado no primeiro acesso, captura de UTMs/click IDs, first-touch e
   last-touch separados, eventos client+server-side.
2. **Auth e cadastro** (`src/app/(auth)/`, `src/app/api/auth/`): criacao de
   conta com verificacao de maioridade, aceite de termos/privacidade,
   consentimento de marketing separado.
3. **Onboarding pos-cadastro** (`src/app/onboarding/`,
   `src/components/onboarding/`): instalacao do PWA (Android/desktop via
   `beforeinstallprompt`, iOS com instrucoes manuais), ativacao de push,
   personalizacao esportiva — cada decisao e registrada no perfil e na
   timeline do CRM.
4. **Integracao com a casa parceira** (`src/lib/affiliate/`,
   `src/app/api/webhooks/affiliate/`): link com subid dinamico, postback
   unico para registration/ftd com validacao HMAC, idempotencia, liberacao
   de nivel de acesso e encaminhamento de conversao para Meta/TikTok
   (Google Ads fica documentado como pendente — ver o codigo).
5. **Niveis de acesso e entitlements** (`src/lib/entitlements/`): niveis
   VISITOR → APP_USER → REGISTERED_USER → FTD_USER (+ RESTRICTED_USER,
   ADMIN), liberacao de comunidade guiada pela tabela `entitlements`
   (editavel via admin/DB, nao hardcoded).
6. **Dados esportivos** (`src/lib/sports/`): interface `SportsDataProvider`,
   implementacao mock funcional, esqueleto do provider real (RapidAPI)
   documentado em `docs/sports-data-provider.md`, cache com TTL por tipo de
   dado e fallback para dado stale se o provider cair.
7. **App do usuario** (`src/app/(app)/`): home com status da conta, jogos,
   analises (com controle de acesso), comunidade (salas + chat em tempo
   real via Supabase Realtime), perfil (consentimento, exportacao,
   exclusao de conta).
8. **Painel administrativo** (`src/app/admin/`): dashboard com funil,
   usuarios/CRM (timeline, notas), analises (criacao manual — a API nunca
   publica sozinha), configuracao da casa parceira, campanhas de push
   (com bloqueio de opt-out para categoria promocional), config/funil do
   onboarding.
9. **PWA** (`public/manifest.json`, `public/sw.js`,
   `src/components/ServiceWorkerRegistration.tsx`): instalavel, com
   service worker cuidando de push notifications e um shell offline
   minimo.

## O que fica para depois

- Integracao real com Flashscore4/RapidAPI (endpoints reais nao foram
  inventados — ver `docs/sports-data-provider.md`).
- Integracao real com Google Ads Conversions (requer client OAuth completo).
- Moderacao de comunidade completa (a primitiva `restrictUser` existe em
  `src/lib/entitlements/rules.ts`, mas nao ha UI dedicada).
- Segmentacao dinamica de CRM e automacoes agendadas (n8n) — o webhook do
  n8n ja e chamado para notificar a equipe em FTDs, mas fluxos completos de
  reativacao (D3/D7/D15) nao foram implementados.
- App nativo para lojas (fora do escopo inicial, por definicao do PRD).

## Observacoes tecnicas

- `src/middleware.ts` usa a convencao "middleware" do Next 16, que emite um
  aviso de depreciacao a favor de `proxy.ts`; funciona normalmente, mas vale
  migrar quando a API `proxy` estiver validada.
- `src/types/database.ts` e escrito a mao para cobrir as tabelas usadas
  pelo codigo. Depois de linkar um projeto Supabase real, prefira gerar via
  `supabase gen types typescript` e ajustar os imports.
