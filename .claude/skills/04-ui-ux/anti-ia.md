# Anti-Padrões "Cara de IA"

Toda interface que Claude/ChatGPT/Cursor gera por default cai no mesmo buraco visual. Essa lista é a checagem obrigatória antes de entregar qualquer tela. Se a UI tem 2+ desses sinais, refaça.

## Sinais de cara de IA

### Cores e gradientes

- **Gradiente roxo-azul-rosa** como background hero. Todo mundo usa. Evite.
- **Aurora/mesh gradients coloridos** no canvas todo sem motivo funcional.
- **Orbs/esferas flutuantes com blur** espalhados pela tela.
- **Paleta padrão do Tailwind** (`slate`, `gray`, `indigo-500`, `purple-600`) sem customização.
- **Dark mode roxo** (`#0A0A0F` com acento `#A78BFA`).

### Layout

- **Hero centralizado** com eyebrow badge "New ✨" + H1 + subhead + 2 botões + gradient abaixo.
- **Bento grid simétrico** com 6 cards iguais.
- **Card flutuante com glassmorphism** perfeitamente centralizado.
- **3 colunas iguais** com ícone + título + parágrafo.
- **Floating navbar com blur** sobreposta em cima.

### Tipografia

- **Inter ou Geist Sans** em tudo, sem contraste.
- **Título gigante** em `text-6xl md:text-8xl font-bold tracking-tight`.
- **Apenas 1 tipografia** no projeto todo.
- **Gradient no texto** (`bg-clip-text bg-gradient-to-r from-X to-Y`).

### Componentes

- **Sparkle icon** (✨) em qualquer lugar que não seja IA explícita.
- **Ícone em rounded square** com gradiente dentro e sombra suave.
- **Botão com `rounded-full` + `shadow-lg`** roxo ou preto.
- **Badge de "AI-powered"** onde não tem IA de verdade.
- **Avatar stack** com 4 círculos sobrepostos + "10k users".

### Microcopy

- **"Built with AI"** sem valor específico.
- **"10x faster"** ou **"Magical experience"** sem prova.
- **"Get started in seconds"** genérico.
- **"No credit card required"** seguido de outras promessas vazias.

### Ilustrações/assets

- **Undraw.co** em projeto profissional.
- **Storyset** padrão.
- **Emojis decorativos** espalhados (🚀 💡 ✨).
- **Mockup de dashboard 3D flutuante** gerado por IA.

## Por que acontece

LLMs foram treinados em portfólios de designers juniores e páginas de launch do Product Hunt, que repetem esses padrões. Gerar default = gerar média. Média = cara de IA.

## Como escapar

1. **Comprometa-se com uma referência específica** de `design-refs.md`. Não "inspiração difusa".
2. **Defina uma personalidade** antes de abrir o código ("old money restaurant", não "modern SaaS").
3. **Use tipografia com caráter**, mistura de 2 famílias (serif display + sans corpo), pesos definidos.
4. **Uma cor de destaque forte**, não arco-íris. Se o projeto é verde, tudo é cinza + verde.
5. **Assimetria proposital** em pelo menos um bloco do hero, quebra o "centro automático".
6. **Fotografia ou ilustração autoral** em vez de stock/gerado.
7. **Micro-detalhes específicos** que só aquele projeto teria (unidade, nomenclatura, formato de número).
8. **Spacing com ritmo**, alterne blocos apertados e espaçosos, nem tudo `py-24`.

## Checagem final (antes de entregar)

Passe por cada item. Se responder "sim" a 2+, refaça.

- [ ] O hero é texto centralizado + 2 botões + gradiente?
- [ ] Tem gradient roxo-rosa-azul em algum lugar?
- [ ] Tem glassmorphism?
- [ ] Tem bento grid simétrico?
- [ ] Tem sparkle ✨ ou lightning ⚡ icon?
- [ ] Fonte é só Inter/Geist?
- [ ] Cor de destaque é índigo/roxo padrão?
- [ ] Tem ilustração Undraw/Storyset?
- [ ] Tem "Built with AI" sem ser produto de IA?
- [ ] Tem avatar stack com "+10k users"?
- [ ] Toda seção tem o mesmo padding vertical?
- [ ] Todos os cards têm `rounded-xl shadow-lg border`?

Um "sim" às vezes escapa. Dois significa que você entregou design genérico.

## Exceções

Esses padrões existem por algum motivo. Podem ser usados quando:

- **Glassmorphism** → projeto é sobre iOS/macOS/Apple Vision, então faz parte da linguagem.
- **Gradiente colorido** → projeto é explicitamente sobre criatividade/IA visual.
- **Bento grid** → página de "features" que precisa mostrar 6 recursos lado a lado e o grid faz sentido.

O problema nunca é o padrão em si, é usar sem intenção.
