# Bibliotecas de Componentes por Estilo

Catálogo de registries shadcn-compatíveis, agrupados por estilo de design. Escolha a biblioteca que casa com a direção visual do projeto, não a mais famosa.

Fonte: registry.directory (catálogo mantido pela comunidade).

---

## Instalação padrão

Todos os registries abaixo seguem o padrão shadcn. Para instalar:

```bash
npx shadcn@latest add <url-do-componente>
```

Exemplo: `npx shadcn@latest add https://magicui.design/r/marquee`

Para registries múltiplos, edite `components.json` adicionando namespaces.

---

## 1. Minimalistas / Essenciais

Para projetos que precisam de base sólida sem personalidade forte. Bom ponto de partida.

- **shadcn/ui**, `ui.shadcn.com`, Registry oficial. 73 componentes acessíveis e neutros. Base de tudo.
- **Kibo UI**, `kibo-ui.com`, Componentes composáveis e acessíveis, código aberto. Mais sóbrio que shadcn puro.
- **JollyUI**, `jollyui.dev`, Shadcn compatível com React Aria. Para quando acessibilidade é prioridade.
- **WDS Shadcn Registry**, `wds-shadcn-registry.netlify.app`, Componentes acessíveis focados em encaixar perfeitamente com shadcn.
- **Intent UI**, `intentui.com`, Biblioteca acessível com visual mais próximo de aplicações nativas iOS/macOS.

## 2. SaaS / Produto moderno

Para dashboards, produtos B2B, apps com tom profissional.

- **ReUI**, `reui.io`, Componentes e aplicações completas em React/Next. Excelente para dashboards complexos.
- **Supabase UI**, `supabase.com/ui`, Componentes que já conectam front com backend Supabase (auth, realtime, storage).
- **HextaUI**, `hextaui.com`, Componentes e blocos estendidos, tom moderno e comercial.
- **kokonut/ui**, `kokonutui.com`, 100+ componentes com Tailwind. Catálogo amplo para produtos SaaS.
- **Cult UI**, `cult-ui.com`, Para design engineers. Blocos com um toque de personalidade sem ser gratuito.
- **Dice UI**, `diceui.com`, Acessível e tipado, base para produtos sérios.
- **Coss UI**, `coss.com/ui`, Moderna, construída sobre Base UI. Mais flexibilidade de customização.

## 3. Landing / Marketing

Para páginas de venda, marketing, oferta pública.

- **Tailark**, `tailark.com`, Blocos prontos para sites de marketing. Hero, features, pricing, CTA.
- **Shadcn Blocks**, `shadcnblocks.com`, Blocos premium (pagos) com Tailwind.
- **Shadcn UI Blocks**, `shadcnui-blocks.com`, Blocos e componentes custom com preview.
- **Eldora UI**, `eldoraui.site`, Coleção de componentes, blocos e templates.
- **Shadcnship**, `shadcnship.com`, Blocos já conectados com Supabase auth e Stripe. Para SaaS boilerplate.

## 4. Animadas / Interativas

Para sites com movimento, portfolios, landings que querem se destacar.

- **Magic UI**, `magicui.design`, Para design engineers. Marquees, animated beams, particles. Use com moderação.
- **Animate UI**, `animate-ui.com`, Distribuição totalmente animada, open source.
- **Motion Primitives**, `motion-primitives.com`, Componentes de movimento sofisticados.
- **SmoothUI**, `smoothui.dev`, React + Motion, compatível shadcn.
- **Shadix UI**, `shadix-ui.vercel.app`, Animados prontos para produção, com Framer Motion.
- **React Bits**, `reactbits.dev`, Animados, interativos e customizáveis.
- **pqoqubbw/icons**, `icons.pqoqubbw.dev`, Ícones animados com Motion, open source.
- **heroicons-animated**, `heroicons-animated.vercel.app`, 316 heroicons animados.

## 5. Retro / Experimental

Para projetos com personalidade forte, nostalgia, side-projects criativos.

- **8bitcn**, `8bitcn.com`, Componentes estilo 8-bit. Para gaming, arcade, retro.
- **RetroUI**, `retroui.dev`, Inspirado em neo-brutalism.
- **The Gridcn**, `thegridcn.com`, Tema Tron, 55+ componentes com efeitos 3D.
- **shadcn-glass-ui**, `yhooi2.github.io/shadcn-glass-ui`, Glassmorphism controlado, 55 componentes WCAG AA. Use com cuidado para não virar estilo IA.

## 6. Dados e admin

Para dashboards pesados, tabelas complexas, gráficos, BI.

- **Tremor** (histórico Bravy), `tremor.so`, Cards de métrica, gráficos, badges, tabelas. Melhor para dashboards.
- **shadcn/studio**, `shadcnstudio.com`, Componentes, blocos, templates com ferramentas IA. Temas prontos.
- **ReUI**, `reui.io`, Já citado, tem layouts de admin completos.

## 7. Especializadas

Use quando o projeto tem necessidade específica.

- **AI Elements**, `ai-sdk.dev/elements`, Para apps nativamente IA (chat, streaming, tools).
- **Manifest UI**, `ui.manifest.build`, Específica para apps estilo ChatGPT.
- **ElevenLabs UI**, `ui.elevenlabs.io`, Áudio, waveforms, agentes de voz.
- **Plate**, `platejs.org`, Editor rich text com IA. Para Notion-like, editores de conteúdo.
- **SVGL**, `svgl.app`, Logos SVG de marcas conhecidas, útil para seção "integrações" ou "clientes".

## 8. Ícones

- **Lucide**, default do shadcn, use sempre que possível
- **pqoqubbw/icons**, animados
- **heroicons-animated**, 316 variações
- **Tabler Icons**, alternativa gratuita com 4500+ ícones
- **Phosphor Icons**, 5 pesos, amigável para produto

---

## Como escolher

| Projeto | Começar por |
|---|---|
| SaaS / dashboard | shadcn/ui + Tremor + ReUI |
| Landing de venda | shadcn/ui + Tailark + Magic UI (pouco) |
| App criativo | shadcn/ui + Cult UI ou Animate UI |
| Ecommerce | shadcn/ui + Shadcn Blocks |
| App de IA / chat | shadcn/ui + AI Elements + Plate |
| Retro / gaming | 8bitcn ou RetroUI |
| Acessibilidade crítica | JollyUI ou Intent UI |
| Áudio / podcast | ElevenLabs UI + base shadcn |

**Não misture mais que 2 registries no mesmo projeto.** Cada um tem sua linguagem visual, combinar 3+ vira mistura sem identidade.

---

## Atualizando este catálogo

Quando descobrir registry novo relevante, acrescente na seção correspondente com formato:
`- **Nome**, \`url\`, Descrição em 1 linha + contexto de uso.`
