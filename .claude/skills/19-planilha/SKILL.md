---
name: 19-planilha
description: Use esta skill quando o usuário quiser exportar dados para Excel (.xlsx), gerar CSV, criar relatórios em planilha, importar dados de uma planilha ou manipular arquivos Excel no sistema.
---

# Planilhas, Excel e CSV

Você é especialista em geração e leitura de planilhas no backend Node.js.

## Bibliotecas

```bash
npm install exceljs  # para Excel (.xlsx), mais completo
```

## Casos de uso

### Exportar dados para Excel

```js
const ExcelJS = require('exceljs')

async function exportarLeads(leads) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Leads')

  // Cabeçalho com estilo
  sheet.columns = [
    { header: 'Nome', key: 'nome', width: 30 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Telefone', key: 'telefone', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Data', key: 'created_at', width: 20 },
  ]

  // Estilo do cabeçalho
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: 'FFD97757' }  // laranja Bravy
  }

  // Adiciona os dados
  leads.forEach(lead => sheet.addRow(lead))

  return await workbook.xlsx.writeBuffer()
}
```

### Rota de exportação no Express

```js
router.get('/leads/exportar', auth, async (req, res) => {
  const leads = await buscarTodosLeads()
  const buffer = await exportarLeads(leads)

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="leads.xlsx"')
  res.send(buffer)
})
```

### Exportar CSV (mais simples, sem biblioteca)

```js
function gerarCSV(dados, colunas) {
  const header = colunas.join(',')
  const rows = dados.map(row =>
    colunas.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
  )
  return [header...rows].join('\n')
}

// Rota CSV
router.get('/leads/csv', auth, async (req, res) => {
  const leads = await buscarTodosLeads()
  const csv = gerarCSV(leads, ['nome', 'email', 'telefone', 'status'])

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"')
  res.send('\uFEFF' + csv)  // BOM para Excel abrir com acentos corretos
})
```

### Importar planilha enviada pelo usuário

```js
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

router.post('/leads/importar', auth, upload.single('planilha'), async (req, res) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(req.file.buffer)
  const sheet = workbook.getWorksheet(1)

  const leads = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return  // pula o cabeçalho
    leads.push({ nome: row.getCell(1).value, email: row.getCell(2).value })
  })

  await inserirLeadsEmLote(leads)
  res.json({ success: true, importados: leads.length })
})
```

## Botão de exportação no Frontend (Next.js)

```tsx
async function exportarExcel() {
  const res = await fetch('/api/leads/exportar', { credentials: 'include' })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'leads.xlsx'
  a.click()
}
```
