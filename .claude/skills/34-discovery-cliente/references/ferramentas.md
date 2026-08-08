# Ferramentas pra discovery (2024-2026)

Ferramentas testadas pra conduzir discovery de ponta a ponta: pré-sessão, gravação, transcrição, anotação, síntese, armazenamento.

Escolhi qualidade sobre quantidade. Cada ferramenta listada é usada por profissionais sérios. Preços em abril de 2026, verificar antes de contratar.

## Pré-sessão

### Granola

O que é: assistente de reunião por IA que roda localmente no Mac. Grava, transcreve, escuta contexto e gera notas estruturadas automaticamente.

Preço: US$ 18 a 25/mês individual.

Por que usar em discovery: gera transcrição precisa em português BR. Permite você focar na conversa em vez de anotar. Notas ficam organizadas por tópicos.

Alternativa: Fathom (gratuito até certo limite), Otter.ai (bom em inglês, menos em PT-BR).

### Typeform ou Tally

O que é: formulário visual pra pré-discovery escrito.

Preço: Tally é gratuito com limites generosos. Typeform começa em US$ 25/mês.

Por que usar: antes da sessão ao vivo, mandar 5 a 10 perguntas escritas economiza 20 min de conversa básica.

Quando usar: sempre. Pré-formulário deveria ser ritual.

### Notion template pré-discovery

O que é: página no Notion que você duplica pra cada novo cliente com checklist de pré-pesquisa.

Estrutura sugerida:
- Instagram/LinkedIn do cliente (link + resumo).
- Site (link + snapshot).
- Concorrentes diretos (3 a 5).
- Perguntas específicas baseadas no que vi.
- Hipóteses iniciais (que vou testar no discovery).

## Durante a sessão

### Google Meet ou Zoom

O que é: plataforma de videochamada.

Por que: funcionalidade básica é igual nas duas. Google Meet integra melhor com Calendar. Zoom tem mais recursos avançados.

Preço: Meet é grátis até 60 min. Zoom Pro é US$ 15/mês.

Atenção: sempre perguntar autorização antes de gravar.

### Apple Notes ou Obsidian

O que é: app de notas pra anotar durante a sessão.

Por que: anotar palavras-chave durante a sessão (não transcrição inteira) mantém seu foco ativo.

Recomendação: use 2 colunas. Coluna esquerda: o que cliente fala. Coluna direita: perguntas de aprofundamento que você quer voltar depois.

### Loom

O que é: ferramenta de gravação de vídeo assíncrono.

Por que usar em discovery: pra discovery de follow-up, você pode mandar vídeo de 3 min fazendo 2 ou 3 perguntas específicas. Cliente responde em vídeo quando tiver tempo.

Preço: gratuito até 25 vídeos. Starter US$ 15/mês.

Bom pra: perguntas de detalhe que não precisam de conversa síncrona.

## Pós-sessão

### Dovetail ou Condens

O que é: plataforma de análise qualitativa. Faz tagging de trechos de transcrição, gera síntese por tema.

Preço: Dovetail a partir de US$ 29/mês. Condens tem plano gratuito limitado.

Quando usar: quando tiver 5+ entrevistas pra consolidar. Pra sessão única, é overkill.

### Claude ou ChatGPT

O que é: LLM pra sintetizar transcrição.

Como usar: cole a transcrição (ou resumo gerado pelo Granola) e peça síntese estruturada.

Prompt recomendado:

> "Analisa essa transcrição de discovery. Extraia: 1) dor principal em 1 frase; 2) 3 premissas validadas; 3) 3 premissas que eu deveria questionar; 4) 5 citações literais importantes; 5) 3 hipóteses pra testar em próxima sessão. Formato: markdown estruturado."

Atenção: LLM pode inventar. Sempre valide as citações "literais" contra a transcrição real.

### Notion ou Obsidian pra síntese final

O que é: base de conhecimento pessoal ou de empresa.

Estrutura sugerida:
- Uma pasta por cliente.
- Dentro: Síntese.md, Transcrição.md, Briefing.md, Próximos passos.md.
- Template padrão de Síntese com as 10 seções obrigatórias.

### Airtable ou planilha simples

O que é: banco de dados visual.

Por que: consolidar achados de múltiplos clientes pra identificar padrões de mercado.

Quando: quando você faz discovery regularmente e quer comparar achados.

## Fluxo recomendado (do início ao fim)

Dia -3: envia pré-formulário Tally com 8 perguntas.
Dia -1: faz pesquisa pública do cliente no Notion template.
Dia 0 (sessão): Google Meet + Granola rodando + Apple Notes pra palavras-chave.
Dia 0 (pós-sessão): exporta notas do Granola pro Notion da empresa.
Dia +1: escreve síntese no Notion usando estrutura das 10 seções + Claude pra rascunho + revisão manual.
Dia +2: manda síntese pro cliente via documento compartilhado.
Dia +3: agenda call de 20 min pra revisar síntese juntos.

## Custo total do stack

Se for solo e tá começando:
- Tally grátis + Meet grátis + Apple Notes grátis + ChatGPT grátis + Notion grátis = R$ 0.
- Funciona mas você perde Granola.

Se quiser stack profissional:
- Granola US$ 18 + Typeform US$ 25 + Notion Team US$ 12 = US$ 55/mês (R$ 275).
- Se faz 4 discoveries por mês, custa R$ 69 por sessão em ferramenta. Vale muito.

## Ferramentas que eu evitaria

- Miro/FigJam pra empathy map em discovery ao vivo: distrai o cliente. Use depois.
- ChatGPT pra gerar perguntas na hora: a conversa fica mecânica.
- Formulário longo no lugar de conversa: perde profundidade. Formulário é complemento, não substituto.
- Qualquer app com UX ruim (muito clique pra fazer o básico): atrapalha mais que ajuda.

## Ética e LGPD

Gravação de sessão tem implicações legais no Brasil (LGPD):

- Sempre peça autorização EXPLÍCITA antes de gravar.
- Informe quem terá acesso à gravação.
- Ofereça opção de apagar a gravação a qualquer momento.
- Nunca compartilhe gravação com terceiros sem autorização adicional.
- Guarde gravação em ambiente seguro (não Google Drive público).

Pra maior segurança, tenha um template de termo de consentimento por escrito antes da sessão. Modelo simples:

> "Eu, [nome], autorizo a gravação desta sessão de discovery conduzida por [você] em [data]. Entendo que a gravação será usada exclusivamente para análise posterior e não será compartilhada com terceiros sem minha autorização por escrito. Posso solicitar exclusão da gravação a qualquer momento."

## Custo do "sem ferramenta"

Não usar nenhuma ferramenta = decoreba do que cliente disse. Em 72h você esqueceu 50%. Em 2 semanas, 80%. Investimento mínimo em Granola ou equivalente paga sozinho no primeiro cliente.
