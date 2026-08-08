---
name: 43-proposta-comercial
description: Use esta skill para gerar proposta comercial e mockup de landing/redesenho para um lead ou cliente, como artefato HTML self-contained (quase um PDF pronto pra enviar). Sempre que o pedido for "monta uma proposta", "faz uma proposta pra esse cliente", "redesenha o site desse lead" ou "gera um pitch visual". A regra número 1: antes de desenhar qualquer coisa, colete a MARCA REAL do lead (logo, cores, fotos, contato) e desenhe em cima dela. Proposta genérica com paleta inventada tem cara de IA e queima o pitch. Trabalha junto do agent `closer` (estrutura comercial) e do agent `designer` (execução visual).
metadata:
  version: 1
---

# Proposta comercial e redesenho, com marca real

Você gera dois tipos de artefato HTML self-contained (renderiza offline, sem CDN, tudo embutido): a **proposta comercial** (documento de pitch) e o **mockup de landing/redesenho** que acompanha. O objetivo é entregar algo que o gestor abre e manda pro cliente, não um rascunho com cara de template.

## A REGRA DE OURO

> **Marca inventada tem cara de IA. Antes de escolher uma cor ou uma foto, você coleta a identidade real do lead (logo, paleta, fotos, contato) e desenha em cima dela. Um mockup com o logo real do cliente, a foto real da equipe e a cor real da marca converte a reunião. Um mockup com paleta genérica denuncia que foi a IA que fez.**

## FLUXO CANÔNICO (4 fases)

### 1. COLETAR A MARCA REAL (obrigatório, antes de qualquer design)
Carregue `references/coleta-assets-reais.md` e execute. Em resumo:
- Puxe o site do lead com User-Agent de navegador (muito site bloqueia bot com 403, o UA resolve). Nunca conclua "não deu" sem tentar o UA.
- Extraia: **logo** (arquivo real), **paleta** (os hex mais frequentes no CSS, essa é a cor real da marca), **fotos reais** (equipe, produto, fachada, capa/og:image), **contato real** (WhatsApp, Instagram, telefone, endereço) e **as headlines reais** (o tom de voz que eles já usam).
- Baixe os assets escolhidos e embuta como data URI (o artefato bloqueia host externo). Prefira variantes compactas para o arquivo não estourar.
Se o site não existir ou não abrir de jeito nenhum, peça ao operador o logo, as cores e 2 ou 3 fotos antes de desenhar. Não invente paleta.

### 2. ESTRUTURA COMERCIAL (chame o método do `closer`)
A proposta segue as 8 seções do `closer`: capa (com validade), diagnóstico (dores do negócio, espelhando o que você viu), solução, SOW (dentro e fora, binário), cronograma 90 dias, investimento (3 opções com ancoragem, a do meio recomendada), garantia/reversão de risco, próximo passo (CTA único + validade).
ROI obrigatório em 3 cenários (pessimista, realista, otimista) com **premissas explícitas na mesa**. Toda variável que só o cliente tem (comissão, ticket, taxa de conversão) fica como campo a preencher, nunca um número inventado.

### 3. DESIGN NA MARCA DO LEAD
- Paleta: use os hex reais coletados na fase 1. Defina tokens em `:root`, com tema claro e escuro.
- Logo real no topo, fotos reais nas seções de produto e de "quem te atende" (rosto real mata a cara de IA e gera confiança).
- Contato real nos CTAs (link de WhatsApp `https://api.whatsapp.com/send?phone=55DDDNUMERO`, Instagram real).
- Tipografia: stack de sistema (o artefato bloqueia webfont de CDN, que falha em silêncio). Carregue não é opção. Carregue peso e escala, não fonte externa.

### 4. ENTREGA
Publique como artefato (fica privado por padrão). No mockup de redesenho, deixe uma faixa "proposta de redesenho, não é o site publicado" para não ser confundido com o site real do cliente. Entregue o link + um resumo das decisões (paleta real usada, fotos usadas, o que ainda falta do cliente).

## O QUE NUNCA FAZER (as caras de IA que queimam o pitch)
- Paleta genérica default: navy com dourado, cream com terracota, gradiente roxo pra azul, tudo centralizado, cantos arredondados em tudo. Se você não coletou a cor real, você está prestes a fazer isso.
- Foto de banco de imagem genérica quando o lead tem foto real da própria equipe e do próprio produto.
- Número inventado: faturamento, ROI, "X clientes atendidos", depoimento fabricado. Sem dado real, use premissa marcada ou aponte a lacuna pro gestor.
- Travessão (—) em qualquer texto de tela. Use vírgula, ponto ou parênteses.
- Prometer o que o produto não entrega (no caso de consórcio, contemplação garantida é compliance sério).

## REFERÊNCIAS
- `references/coleta-assets-reais.md`: a receita técnica de puxar logo, cores, fotos e contato do site do lead (com o UA de navegador e o embed em data URI).
- `references/template-proposta.html`: estrutura de referência da proposta em 8 seções, tema claro e escuro, sem travessão. Troque o conteúdo pelo do lead, nunca deixe o texto de exemplo.

## Regra de travessão

Nenhum texto gerado por esta skill pode conter travessão (—) no que o cliente final vê. Use vírgula, ponto ou parênteses no lugar.
