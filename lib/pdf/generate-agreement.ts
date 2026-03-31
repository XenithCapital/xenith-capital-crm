import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'

interface AgreementData {
  fullName: string
  signedAt: Date
  ipAddress: string
  recordId: string
  agreementVersion?: string
}

const MIDNIGHT_BLUE = rgb(0, 0.129, 0.278)   // #002147
const FERN_GREEN    = rgb(0.373, 0.710, 0.282) // #5FB548
const DARK_GREY     = rgb(0.2, 0.2, 0.2)
const LIGHT_GREY    = rgb(0.6, 0.6, 0.6)

const AGREEMENT_TEXT = `INDEPENDENT CAPITAL INTRODUCER AGREEMENT
Xenith Capital — Sophisticated & High-Net-Worth Client Programme
Version: V2 | March 2026

This Agreement is entered into between SRL Partners Ltd, trading as Xenith Capital (Company No. 15983046), registered at 167-169 Great Portland Street, 5th Floor, London, W1W 5PF ("Xenith Capital") and the Introducer identified in the portal profile ("you" or "Introducer").

1. APPOINTMENT
Xenith Capital appoints you as a non-exclusive, independent capital introducer on the terms set out in this Agreement. You are not an employee, agent, or representative of Xenith Capital or Pelican Trading for any purpose.

2. SCOPE OF PERMITTED ACTIVITIES
You may introduce prospective investors to Xenith Capital by:
- Sharing Xenith-approved materials only
- Directing prospects to the Xenith Capital website and Dashboard
- Registering prospects via the Introducer Portal
You must include the mandatory risk disclaimer on all materials and disclose your remunerated introducer status to all prospects.

3. PROHIBITED ACTIVITIES
You must not:
- Provide personalised investment advice or suitability assessments
- Handle, receive, or transmit client funds
- Make representations about future returns or guaranteed performance
- Publish any content about Xenith Capital without prior written approval
- Create the impression you are an employee of Xenith Capital or Pelican Trading
- Sub-appoint agents without Xenith Capital's prior written consent

4. REVENUE SHARE
Subject to the terms of this Agreement:
- Tier 1 (AUM USD 10,000–999,999): 15% of Performance Fee generated on your Introduced Accounts
- Tier 2 (AUM USD 1,000,000–9,999,999): 20% of Performance Fee
- Tier 3 (AUM USD 10,000,000+): individually agreed
Performance Fees are only charged on net new profits above the High-Water Mark. In any month with no profit, no Performance Fee is charged and no Revenue Share is payable.

5. REFERRAL REWARD
USD 500 one-time payment per Introduced Account, vesting after 90 continuous days funded at or above USD 10,000. Subject to a 24-month clawback window.

6. QUALIFIED MINIMUM DEPOSIT
USD 10,000 per Introduced Account. Accounts below this threshold generate no Revenue Share or Referral Reward until the threshold is met and maintained.

7. ATTRIBUTION
You must register each prospect via the portal before they contact Xenith Capital independently. Registration must reference a genuine pre-existing relationship. No bulk speculative registrations permitted.

8. COMPLIANCE
You must comply with all applicable laws and FCA guidance. You acknowledge that introducing investors to financial services firms may constitute a regulated activity and you are solely responsible for ensuring your activities fall within permitted boundaries. Xenith Capital operates as a Strategy Provider to Pelican Trading, a trading name of London & Eastern LLP (FCA Ref: 534484).

9. CONFIDENTIALITY
You must keep all non-public information about Xenith Capital, its technology, fee structures, partners, and clients strictly confidential.

10. TERMINATION
Either party may terminate this Agreement on 30 days' written notice. Xenith Capital may terminate immediately for material breach. A 24-month clawback window applies to all payments where a breach is subsequently established.

11. GOVERNING LAW
This Agreement is governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the English courts.

By signing below you confirm you have read, understood, and agree to be bound by the terms of this Agreement in its entirety.`

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

export async function generateAgreementPdf(data: AgreementData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaObl  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const [pageWidth, pageHeight] = PageSizes.A4
  const margin = 60
  const contentWidth = pageWidth - margin * 2

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 50

  const pages: typeof page[] = [page]

  function addPage() {
    const newPage = pdfDoc.addPage([pageWidth, pageHeight])
    pages.push(newPage)
    page = newPage
    y = pageHeight - 50
    drawPageFooter()
    y = pageHeight - 70
    return newPage
  }

  function drawPageFooter() {
    const footerText = 'Xenith Capital — SRL Partners Ltd (Co. No. 15983046) — Confidential'
    const pageNum = pages.length
    const totalPages = '...' // will update after
    page.drawText(footerText, {
      x: margin,
      y: 30,
      size: 8,
      font: helvetica,
      color: LIGHT_GREY,
    })
    page.drawText(`Page ${pageNum}`, {
      x: pageWidth - margin - 40,
      y: 30,
      size: 8,
      font: helvetica,
      color: LIGHT_GREY,
    })
    // Horizontal rule
    page.drawLine({
      start: { x: margin, y: 45 },
      end: { x: pageWidth - margin, y: 45 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    })
  }

  function checkPageBreak(requiredHeight: number) {
    if (y - requiredHeight < 70) {
      addPage()
    }
  }

  function drawText(
    text: string,
    size: number,
    font: typeof helvetica,
    color: ReturnType<typeof rgb>,
    indent = 0,
    lineHeightMultiplier = 1.4
  ): void {
    const lineHeight = size * lineHeightMultiplier
    const availWidth = contentWidth - indent
    const words = text.split(' ')
    let line = ''

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const textWidth = font.widthOfTextAtSize(testLine, size)
      if (textWidth > availWidth && line) {
        checkPageBreak(lineHeight)
        page.drawText(line, {
          x: margin + indent,
          y,
          size,
          font,
          color,
        })
        y -= lineHeight
        line = word
      } else {
        line = testLine
      }
    }
    if (line) {
      checkPageBreak(lineHeight)
      page.drawText(line, {
        x: margin + indent,
        y,
        size,
        font,
        color,
      })
      y -= lineHeight
    }
  }

  // ── HEADER ──────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: MIDNIGHT_BLUE,
  })

  page.drawText('XENITH CAPITAL', {
    x: margin,
    y: pageHeight - 40,
    size: 18,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Independent Capital Introducer Agreement', {
    x: margin,
    y: pageHeight - 58,
    size: 10,
    font: helvetica,
    color: rgb(0.8, 0.8, 0.8),
  })
  page.drawText('V2 March 2026', {
    x: pageWidth - margin - 70,
    y: pageHeight - 40,
    size: 9,
    font: helveticaBold,
    color: FERN_GREEN,
  })

  y = pageHeight - 110
  drawPageFooter()

  // ── DOCUMENT TITLE ──────────────────────────────────────
  y -= 10
  page.drawText('INDEPENDENT CAPITAL INTRODUCER AGREEMENT', {
    x: margin,
    y,
    size: 13,
    font: helveticaBold,
    color: MIDNIGHT_BLUE,
  })
  y -= 18
  page.drawText('Xenith Capital — V2 | March 2026', {
    x: margin,
    y,
    size: 9,
    font: helveticaObl,
    color: LIGHT_GREY,
  })
  y -= 16

  // Horizontal rule under title
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: MIDNIGHT_BLUE,
  })
  y -= 16

  // ── AGREEMENT BODY ──────────────────────────────────────
  const lines = AGREEMENT_TEXT.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      y -= 6
      continue
    }

    // Section headings (all caps + number)
    if (/^\d+\.\s+[A-Z\s]+$/.test(trimmed)) {
      y -= 4
      checkPageBreak(20)
      page.drawText(trimmed, {
        x: margin,
        y,
        size: 10,
        font: helveticaBold,
        color: MIDNIGHT_BLUE,
      })
      y -= 14
      continue
    }

    // Title line
    if (trimmed.startsWith('INDEPENDENT CAPITAL')) {
      continue // already drawn above
    }

    // Bullet items
    if (trimmed.startsWith('- ')) {
      drawText('• ' + trimmed.slice(2), 9, helvetica, DARK_GREY, 12)
      continue
    }

    drawText(trimmed, 9, helvetica, DARK_GREY)
  }

  // ── SIGNATURE BLOCK ──────────────────────────────────────
  y -= 20
  checkPageBreak(260)

  // Try to load the pre-authorised company signature image
  type EmbeddedImage = Awaited<ReturnType<typeof pdfDoc.embedPng>>
  let companySignatureImage: EmbeddedImage | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs   = require('fs')   as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path')
    const sigBytes = fs.readFileSync(
      path.join(process.cwd(), 'public', 'szymon-signature.png')
    )
    companySignatureImage = await pdfDoc.embedPng(sigBytes)
  } catch {
    // Signature image not available — falls back to typed name
  }

  // Top divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })
  y -= 16

  page.drawText('SIGNATURES', {
    x: margin,
    y,
    size: 9,
    font: helveticaBold,
    color: MIDNIGHT_BLUE,
  })
  y -= 16

  // Column geometry
  const colDivX  = margin + contentWidth / 2        // centre line
  const leftColX  = margin
  const rightColX = colDivX + 14
  const labelW    = 92                               // label column width

  // Sub-headings
  const subheadY = y
  page.drawText('INTRODUCER', {
    x: leftColX, y: subheadY, size: 8,
    font: helveticaBold, color: LIGHT_GREY,
  })
  page.drawText('FOR AND ON BEHALF OF XENITH CAPITAL', {
    x: rightColX, y: subheadY, size: 8,
    font: helveticaBold, color: LIGHT_GREY,
  })
  y -= 14

  // ── Right column: company counter-signature ──────────────
  let rightY = y
  const imgDisplaySize = 110 // pts — square bounding box

  if (companySignatureImage) {
    // Scale to fit within imgDisplaySize × imgDisplaySize
    const scale = imgDisplaySize / Math.max(companySignatureImage.width, companySignatureImage.height)
    const imgW  = companySignatureImage.width  * scale
    const imgH  = companySignatureImage.height * scale
    page.drawImage(companySignatureImage, {
      x: rightColX,
      y: rightY - imgH,
      width: imgW,
      height: imgH,
    })
    rightY -= imgH + 6
  } else {
    // Fallback: italicised typed name as signature
    page.drawText('Szymon Wloch', {
      x: rightColX, y: rightY - 14,
      size: 12, font: helveticaObl, color: DARK_GREY,
    })
    rightY -= 22
  }

  const companyFields: Array<[string, string]> = [
    ['Signed by', 'Szymon Wloch'],
    ['Title',     'Co-Founder & CEO'],
    ['Company',   'SRL Partners Ltd'],
    ['Date',      formatDate(data.signedAt)],
  ]
  for (const [label, value] of companyFields) {
    page.drawText(`${label}:`, {
      x: rightColX, y: rightY,
      size: 9, font: helveticaBold, color: DARK_GREY,
    })
    page.drawText(value, {
      x: rightColX + labelW, y: rightY,
      size: 9, font: helvetica, color: DARK_GREY,
    })
    rightY -= 13
  }

  // ── Left column: introducer electronic signature record ──
  let leftY = y
  const introFields: Array<[string, string]> = [
    ['Signed by',        data.fullName],
    ['Date',             formatDate(data.signedAt)],
    ['Timestamp (UTC)',  data.signedAt.toISOString()],
    ['IP Address',       data.ipAddress],
    ['Agreement Ver.',   data.agreementVersion ?? 'V2_March_2026'],
    ['Portal Record ID', data.recordId],
  ]
  const maxValueW = colDivX - leftColX - labelW - 8
  for (const [label, value] of introFields) {
    page.drawText(`${label}:`, {
      x: leftColX, y: leftY,
      size: 9, font: helveticaBold, color: DARK_GREY,
    })
    // Truncate value if it overflows the left column
    let display = value
    while (display.length > 4 && helvetica.widthOfTextAtSize(display, 9) > maxValueW) {
      display = display.slice(0, -1)
    }
    page.drawText(display, {
      x: leftColX + labelW, y: leftY,
      size: 9, font: helvetica, color: DARK_GREY,
    })
    leftY -= 13
  }

  // Vertical column divider — draw now that we know both heights
  const colDivBottomY = Math.min(leftY, rightY) - 6
  page.drawLine({
    start: { x: colDivX, y: subheadY + 4 },
    end:   { x: colDivX, y: colDivBottomY },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  })

  y = colDivBottomY - 10

  // Bottom divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })
  y -= 14

  // Green verification box
  checkPageBreak(36)
  page.drawRectangle({
    x: margin,
    y: y - 16,
    width: contentWidth,
    height: 28,
    color: rgb(0.93, 0.98, 0.91),
    borderColor: FERN_GREEN,
    borderWidth: 0.5,
  })
  page.drawText('Electronically signed via the Xenith Capital Introducer Portal', {
    x: margin + 10,
    y: y - 6,
    size: 8,
    font: helvetica,
    color: rgb(0.15, 0.5, 0.1),
  })
  y -= 32

  // Update page numbers
  const totalPageCount = pages.length
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    // Overwrite the page number placeholder
    p.drawText(`Page ${i + 1} of ${totalPageCount}`, {
      x: pageWidth - margin - 70,
      y: 30,
      size: 8,
      font: helvetica,
      color: LIGHT_GREY,
    })
  }

  return await pdfDoc.save()
}
