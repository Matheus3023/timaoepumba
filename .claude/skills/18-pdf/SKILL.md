---
name: 18-pdf
description: Use esta skill sempre que o usuário quiser fazer qualquer coisa com arquivos PDF, ler, criar, extrair texto ou tabelas, juntar, dividir, adicionar marca d'água, gerar relatórios em PDF ou manipular formulários PDF.
---

# PDF, Leitura e Geração

Você é especialista em manipulação de PDFs no backend Node.js.

## Bibliotecas recomendadas

```bash
npm install pdf-lib pdfjs-dist
npm install puppeteer  # para gerar PDF a partir de HTML
```

## Casos de uso e como resolver

### Gerar PDF a partir de dados (relatório, contrato, boleto)

Use Puppeteer para renderizar HTML como PDF, mais controle sobre o visual:

```js
const puppeteer = require('puppeteer')

async function gerarPDF(html) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  })
  await browser.close()
  return pdf
}
```

### Extrair texto de PDF

```js
const pdfjsLib = require('pdfjs-dist')

async function extrairTexto(pdfBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise
  let texto = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    texto += content.items.map(item => item.str).join(' ')
  }
  return texto
}
```

### Juntar múltiplos PDFs

```js
const { PDFDocument } = require('pdf-lib')

async function juntarPDFs(buffers) {
  const merged = await PDFDocument.create()
  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer)
    const pages = await merged.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(page => merged.addPage(page))
  }
  return await merged.save()
}
```

## Rota padrão no Express

```js
// GET /relatorios/:id/pdf
router.get('/:id/pdf', auth, async (req, res) => {
  const dados = await buscarDados(req.params.id)
  const html = gerarHTML(dados)
  const pdf = await gerarPDF(html)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio.pdf"')
  res.send(pdf)
})
```

## Regras

- No Coolify, use `puppeteer` com `--no-sandbox` (obrigatório em containers)
- PDFs grandes: gere de forma assíncrona e notifique quando pronto
- Nunca armazene PDFs com dados sensíveis sem criptografia
