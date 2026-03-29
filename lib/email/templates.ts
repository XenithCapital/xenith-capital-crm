// ============================================================
// Xenith Capital — Resend Email Templates
// All emails: Midnight Blue header, white body, Fern Green CTAs
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.xenithcapital.co.uk'

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xenith Capital</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background:#002147;padding:24px 32px;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:2px;">
                XENITH CAPITAL
              </p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:1px;text-transform:uppercase;">
                Operations Portal
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                Xenith Capital — SRL Partners Ltd (Company No. 15983046)<br/>
                167-169 Great Portland Street, 5th Floor, London, W1W 5PF<br/>
                <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;text-decoration:none;">info@xenithcapital.co.uk</a>
              </p>
              <p style="margin:12px 0 0;color:#cbd5e1;font-size:10px;line-height:1.5;">
                Trading in foreign exchange and financial instruments involves a high level of risk.
                Xenith Capital acts as Strategy Provider only; client accounts are managed by Pelican Trading (FCA Ref: 534484).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function ctaButton(href: string, text: string): string {
  return `
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
  <tr>
    <td style="border-radius:8px;background:#5FB548;">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:12px 28px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
  `.trim()
}

// ============================================================
// 1. Introducer Invite
// ============================================================
export function introducerInviteEmail(name: string, inviteUrl: string): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  You've been invited to the Xenith Capital Introducer Portal
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hello ${name},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  You have been invited to join the <strong>Xenith Capital Introducer Portal</strong> —
  our platform for independent capital introducers. Through this portal you will be able to:
</p>
<ul style="margin:0 0 20px;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
  <li>Register and track your prospect pipeline</li>
  <li>Monitor investor account status and vesting</li>
  <li>View your earnings and revenue share tier</li>
  <li>Raise and track support requests</li>
</ul>
<p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;">
  Click the button below to access the portal and complete your setup.
</p>
${ctaButton(inviteUrl, 'Access Portal')}
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  This invitation link is single-use and will expire after 24 hours.
  If you have any questions, contact <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}

// ============================================================
// 2. Agreement Signed — Introducer Copy
// ============================================================
export function agreementSignedIntroducerEmail(
  name: string,
  signedAt: string,
  agreementVersion: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Your Introducer Agreement — Xenith Capital
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hello ${name},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Thank you for signing the Xenith Capital Independent Capital Introducer Agreement.
  A copy of your signed agreement is attached to this email.
</p>
<table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Agreement Version</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${agreementVersion}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Signed At (UTC)</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${signedAt}</td></tr>
</table>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Your account is now fully active. You can register prospects and track your pipeline immediately.
</p>
${ctaButton(`${BASE_URL}/portal/dashboard`, 'Go to your portal')}
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  Please retain this email and the attached PDF for your records.
  For queries, contact <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}

// ============================================================
// 3. Agreement Signed — Admin Notification
// ============================================================
export function agreementSignedAdminEmail(
  name: string,
  email: string,
  signedAt: string,
  adminRecordUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  New introducer signed: ${name}
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  A new introducer has completed onboarding and signed the Introducer Agreement.
</p>
<table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Full Name</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${name}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${email}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Signed At (UTC)</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${signedAt}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Agreement Ver.</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">V2_March_2026</td></tr>
</table>
${ctaButton(adminRecordUrl, 'View Introducer Record')}
  `)
}

// ============================================================
// 4. Cooling-Off Complete — Introducer
// ============================================================
export function coolingOffCompleteIntroducerEmail(
  introducerName: string,
  prospectName: string,
  completedAt: string,
  prospectUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  24-hour cooling-off complete — ${prospectName}
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hello ${introducerName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  The 24-hour regulatory cooling-off period for <strong>${prospectName}</strong> concluded at
  <strong>${completedAt}</strong>.
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  You can now proceed to the <strong>Education &amp; Dashboard Demo</strong> stage.
  This involves sharing Xenith-approved materials and directing your prospect to the
  Xenith Capital website.
</p>
<p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.6;">
  <strong>Next steps:</strong>
</p>
<ul style="margin:0 0 20px;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
  <li>Share approved educational materials with your prospect</li>
  <li>Direct them to the Xenith Capital website</li>
  <li>Update the prospect status to "Education Sent" in your portal</li>
</ul>
${ctaButton(prospectUrl, 'View Prospect')}
  `)
}

// ============================================================
// 5. Cooling-Off Complete — Admin Notification
// ============================================================
export function coolingOffCompleteAdminEmail(
  prospectName: string,
  introducerName: string,
  completedAt: string,
  adminProspectUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Cooling-off complete: ${prospectName} via ${introducerName}
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  The 24-hour cooling-off period has elapsed for the following prospect:
</p>
<table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Prospect</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${prospectName}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Introducer</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${introducerName}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Completed At (UTC)</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${completedAt}</td></tr>
</table>
${ctaButton(adminProspectUrl, 'View Prospect Record')}
  `)
}

// ============================================================
// 6. Prospect Registered — Introducer Confirmation
// ============================================================
export function prospectRegisteredEmail(
  introducerName: string,
  prospectName: string,
  coolingOffStartedAt: string,
  coolingOffCompletedAt: string,
  prospectUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Prospect registered — ${prospectName}
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hello ${introducerName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Your prospect <strong>${prospectName}</strong> has been successfully registered in the
  Xenith Capital Introducer Portal.
</p>
<table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Cooling-off Started</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${coolingOffStartedAt}</td></tr>
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Cooling-off Completes</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${coolingOffCompletedAt} (approx.)</td></tr>
</table>
<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
  <strong>Important:</strong> The 24-hour regulatory cooling-off period has started automatically.
  You will receive an email notification when it concludes and you are able to proceed to the
  next stage.
</p>
${ctaButton(prospectUrl, 'View in portal')}
  `)
}

// ============================================================
// 7. Support Ticket — Admin Notification
// ============================================================
export function supportTicketAdminEmail(
  introducerName: string,
  subject: string,
  body: string,
  ticketUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  New support ticket: ${subject}
</h2>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  A new support ticket has been raised by <strong>${introducerName}</strong>.
</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Subject</p>
  <p style="margin:0 0 16px;color:#002147;font-size:14px;font-weight:600;">${subject}</p>
  <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
  <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;white-space:pre-line;">${body}</p>
</div>
${ctaButton(ticketUrl, 'View Ticket')}
  `)
}

// ============================================================
// 8. Support Ticket Response — Introducer
// ============================================================
export function supportTicketResponseEmail(
  introducerName: string,
  subject: string,
  response: string,
  ticketUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Update on your support ticket: ${subject}
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hello ${introducerName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  The Xenith Capital team has responded to your support request.
</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #5FB548;">
  <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Response from Xenith Capital</p>
  <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;white-space:pre-line;">${response}</p>
</div>
${ctaButton(ticketUrl, 'View Ticket')}
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  If you need further assistance, please reply to your ticket in the portal or
  contact <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}
