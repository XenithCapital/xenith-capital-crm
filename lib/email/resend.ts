import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_ADDRESS = 'noreply@xenithcapital.co.uk'
export const REPLY_TO = 'info@xenithcapital.co.uk'
export const ADMIN_EMAIL = 'info@xenithcapital.co.uk'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('[Resend] Failed to send email:', error)
    return { success: false, error }
  }
}
