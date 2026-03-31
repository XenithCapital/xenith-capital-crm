import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'

interface ConsentData {
  prospectName: string
  introducerName: string
  signedAt: Date
  ipAddress: string
  recordId: string
}

const MIDNIGHT_BLUE = rgb(0, 0.129, 0.278)
const FERN_GREEN    = rgb(0.373, 0.710, 0.282)
const DARK_GREY     = rgb(0.2, 0.2, 0.2)
const LIGHT_GREY    = rgb(0.6, 0.6, 0.6)

const DECLARATIONS = [
  'I confirm that I have a genuine pre-existing relationship with the named Introducer and that I have expressed genuine interest in learning more about Xenith Capital.',
  'I understand that by confirming my interest, a mandatory 24-hour regulatory cooling-off period will begin. During this period I am under no obligation to invest or proceed further.',
  'I understand that Xenith Capital acts as a Strategy Provider and that client accounts are managed by Pelican Trading, a trading name of London & Eastern LLP (FCA Ref: 534484), and that all investments carry risk.',
]

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export async function generateConsentPdf(data: ConsentData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const reg    = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const obl    = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const [pageWidth, pageHeight] = PageSizes.A4
  const margin = 60
  const contentWidth = pageWidth - margin * 2

  const page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 50

  // Try to load logo
  type EmbeddedImage = Awaited<ReturnType<typeof pdfDoc.embedPng>>
  let logoImage: EmbeddedImage | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs   = require('fs')   as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path')
    const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
    logoImage = await pdfDoc.embedPng(logoBytes)
  } catch {
    // Falls back to text header
  }

  // Footer
  page.drawText('Xenith Capital — SRL Partners Ltd (Co. No. 15983046) — Confidential', {
    x: margin, y: 30, size: 8, font: reg, color: LIGHT_GREY,
  })
  page.drawText('Page 1 of 1', {
    x: pageWidth - margin - 50, y: 30, size: 8, font: reg, color: LIGHT_GREY,
  })
  page.drawLine({
    start: { x: margin, y: 45 }, end: { x: pageWidth - margin, y: 45 },
    thickness: 0.5, color: rgb(0.85, 0.85, 0.85),
  })

  // Header bar
  const headerHeight = 80
  page.drawRectangle({ x: 0, y: pageHeight - headerHeight, width: pageWidth, height: headerHeight, color: MIDNIGHT_BLUE })

  if (logoImage) {
    // Display logo image — scale to fit 140×36 pt bounding box
    const maxW = 140, maxH = 36
    const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height)
    const imgW  = logoImage.width  * scale
    const imgH  = logoImage.height * scale
    const imgY  = pageHeight - headerHeight + (headerHeight - imgH) / 2
    page.drawImage(logoImage, { x: margin, y: imgY, width: imgW, height: imgH })
  } else {
    page.drawText('XENITH CAPITAL', { x: margin, y: pageHeight - 34, size: 16, font: bold, color: rgb(1, 1, 1) })
  }

  page.drawText('Prospect Consent Form', { x: margin, y: pageHeight - 56, size: 9, font: reg, color: rgb(0.7, 0.7, 0.7) })
  page.drawText(formatDate(data.signedAt), {
    x: pageWidth - margin - 60, y: pageHeight - 34, size: 9, font: bold, color: FERN_GREEN,
  })

  y = pageHeight - 100

  // Title
  y -= 12
  page.drawText('PROSPECT CONSENT FORM', { x: margin, y, size: 13, font: bold, color: MIDNIGHT_BLUE })
  y -= 16
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: MIDNIGHT_BLUE })
  y -= 16

  // Details table
  const details: Array<[string, string]> = [
    ['Prospect',   data.prospectName],
    ['Introducer', data.introducerName],
    ['Date',       formatDate(data.signedAt)],
    ['Time (UTC)', data.signedAt.toISOString()],
    ['IP Address', data.ipAddress],
    ['Record ID',  data.recordId],
  ]

  page.drawRectangle({
    x: margin, y: y - details.length * 15 - 10,
    width: contentWidth, height: details.length * 15 + 18,
    color: rgb(0.97, 0.98, 1), borderColor: rgb(0.88, 0.90, 0.95), borderWidth: 0.5,
  })

  y -= 8
  for (const [label, value] of details) {
    page.drawText(`${label}:`, { x: margin + 10, y, size: 9, font: bold, color: DARK_GREY })
    page.drawText(value,       { x: margin + 110, y, size: 9, font: reg,  color: DARK_GREY })
    y -= 15
  }
  y -= 10

  // Declarations heading
  y -= 8
  page.drawText('DECLARATIONS', { x: margin, y, size: 9, font: bold, color: MIDNIGHT_BLUE })
  y -= 14

  // Draw each declaration with a checkbox indicator
  for (const declaration of DECLARATIONS) {
    // Checked box indicator
    page.drawRectangle({
      x: margin, y: y - 2, width: 10, height: 10,
      color: FERN_GREEN, borderColor: FERN_GREEN, borderWidth: 0.5,
    })
    page.drawText('X', { x: margin + 2, y: y - 1, size: 7, font: bold, color: rgb(1, 1, 1) })

    // Declaration text — word-wrap
    const words = declaration.split(' ')
    const maxW = contentWidth - 20
    let line = ''
    let firstLine = true
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (reg.widthOfTextAtSize(test, 9) > maxW && line) {
        page.drawText(line, { x: margin + 20, y: firstLine ? y : y, size: 9, font: reg, color: DARK_GREY })
        y -= 13
        firstLine = false
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      page.drawText(line, { x: margin + 20, y, size: 9, font: reg, color: DARK_GREY })
      y -= 13
    }
    y -= 6
  }

  // Signature block
  y -= 12
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 14

  page.drawText('ELECTRONIC SIGNATURE', { x: margin, y, size: 9, font: bold, color: MIDNIGHT_BLUE })
  y -= 14

  const sigFields: Array<[string, string]> = [
    ['Signed by',       data.prospectName],
    ['Date',            formatDate(data.signedAt)],
    ['Timestamp (UTC)', data.signedAt.toISOString()],
    ['IP Address',      data.ipAddress],
    ['Record ID',       data.recordId],
  ]

  for (const [label, value] of sigFields) {
    page.drawText(`${label}:`, { x: margin, y, size: 9, font: bold, color: DARK_GREY })
    page.drawText(value,       { x: margin + 120, y, size: 9, font: reg,  color: DARK_GREY })
    y -= 13
  }

  // Verification bar
  y -= 10
  page.drawRectangle({
    x: margin, y: y - 16, width: contentWidth, height: 28,
    color: rgb(0.93, 0.98, 0.91), borderColor: FERN_GREEN, borderWidth: 0.5,
  })
  page.drawText('Electronically confirmed via the Xenith Capital Introducer Portal', {
    x: margin + 10, y: y - 6, size: 8, font: obl, color: rgb(0.15, 0.5, 0.1),
  })

  return await pdfDoc.save()
}
