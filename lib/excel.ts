export async function exportBrandedExcel(
  filename: string,
  data: any[][],
  headers: string[],
  orgName: string,
  reportTitle: string,
  logoUrl?: string,
  sheetName?: string
) {
  // exceljs is heavy; load only where used (client-side)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ExcelJS = require('exceljs')

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName || 'Sheet1', {
    properties: { defaultRowHeight: 18 },
    views: [{ state: 'frozen', ySplit: 6 }],
  })

  const toCol = (n: number) => {
    let s = ''
    while (n > 0) {
      const m = (n - 1) % 26
      s = String.fromCharCode(65 + m) + s
      n = Math.floor((n - 1) / 26)
    }
    return s
  }

  const totalCols = Math.max(1, headers?.length || 1)
  const lastCol = toCol(totalCols)

  if (logoUrl) {
    try {
      const resp = await fetch(logoUrl)
      if (resp.ok) {
        const blob = await resp.blob()
        const reader = new FileReader()
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        const imageId = workbook.addImage({ base64: dataUrl, extension: 'jpeg' })
        sheet.addImage(imageId, {
          tl: { col: Math.max(0, totalCols / 2 - 1.5), row: 0 },
          ext: { width: 160, height: 60 },
          editAs: 'oneCell',
        })
      }
    } catch (_) {}
  }

  sheet.mergeCells(`A2:${lastCol}2`)
  sheet.getCell('A2').value = orgName || ''
  sheet.getCell('A2').alignment = { horizontal: 'center' }
  sheet.getCell('A2').font = { bold: true, size: 16 }

  sheet.mergeCells(`A3:${lastCol}3`)
  sheet.getCell('A3').value = reportTitle || ''
  sheet.getCell('A3').alignment = { horizontal: 'center' }
  sheet.getCell('A3').font = { size: 12 }

  const headerRow = sheet.getRow(5)
  headerRow.values = headers
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.height = 20
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164E63' } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  })

  let rowIdx = 6
  for (const r of data) {
    const row = sheet.getRow(rowIdx++)
    row.values = r
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      }
    })
  }

  const widths = headers.map((h) => Math.max(12, Math.min(30, String(h || '').length + 2)))
  sheet.columns = widths.map((w) => ({ width: w }))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


