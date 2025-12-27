import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toCsv(rows: (string | number)[][], header?: (string | number)[]): string {
  const escape = (val: string | number) => {
    const s = String(val ?? "")
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const lines: string[] = []
  if (header && header.length) lines.push(header.map(escape).join(","))
  for (const row of rows) lines.push(row.map(escape).join(","))
  return lines.join("\n")
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Excel utility functions
export function downloadExcel(filename: string, data: any[][], headers?: string[], sheetName?: string) {
  const ExcelJS = require('exceljs')

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName || 'Sheet1', {
    properties: { defaultRowHeight: 18 },
  })

  const rows = headers ? [headers, ...data] : data
  for (const row of rows) sheet.addRow(row)

  workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  })
}

export function createStyledExcel(data: any[][], headers?: string[], title?: string, subtitle?: string, sheetName?: string) {
  const ExcelJS = require('exceljs')

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName || 'Sheet1', {
    properties: { defaultRowHeight: 18 },
    views: [{ state: 'frozen', ySplit: 5 }],
  })

  let currentRow = 1

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

  if (title) {
    const row = sheet.getRow(currentRow++)
    row.values = [title]
    row.font = { size: 16, bold: true }
    // center across all columns
    sheet.mergeCells(`A${row.number}:${lastCol}${row.number}`)
    sheet.getCell(`A${row.number}`).alignment = { horizontal: 'center' }
  }

  if (subtitle) {
    const row = sheet.getRow(currentRow++)
    row.values = [subtitle]
    row.font = { size: 12 }
    sheet.mergeCells(`A${row.number}:${lastCol}${row.number}`)
    sheet.getCell(`A${row.number}`).alignment = { horizontal: 'center' }
  }

  if (title || subtitle) {
    currentRow++ // empty spacer row
  }

  if (headers && headers.length) {
    const headerRow = sheet.getRow(currentRow++)
    headerRow.values = headers
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { vertical: 'middle' }
    headerRow.height = 20
    headerRow.eachCell((cell: any) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164E63' } }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    })
  }

  for (const rowValues of data) {
    const row = sheet.getRow(currentRow++)
    row.values = rowValues
    row.eachCell((cell: any) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      }
    })
  }

  if (headers && headers.length) {
    const widths = headers.map((h) => Math.max(12, Math.min(30, String(h || '').length + 2)))
    sheet.columns = widths.map((w) => ({ width: w }))
  }

  return workbook
}

export function downloadStyledExcel(filename: string, workbook: any) {
  workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  })
}

// Branded Excel export with logo and richer styling using exceljs
// NOTE: exportBrandedExcel moved to lib/excel.ts to avoid bundling exceljs
