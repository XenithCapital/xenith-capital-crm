// ============================================================
// Xenith Capital — Resend Email Templates
// All emails: Midnight Blue header, white body, Fern Green CTAs
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'

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
              <img src="${BASE_URL}/logo.png" alt="Xenith Capital" width="180" height="50"
                   style="display:block;width:180px;height:auto;max-height:50px;border:0;outline:none;" />
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
  Click the button below to accept your invitation and create your password. You will then be guided through a short setup before your account is active.
</p>
${ctaButton(inviteUrl, 'Accept invitation')}
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  This link is single-use and will expire after 24 hours.
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
  _coolingOffStartedAt: string | null,
  _coolingOffCompletedAt: string | null,
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
<table style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr>
    <td style="color:#166534;font-size:13px;line-height:1.6;">
      <strong>Next step:</strong> A consent request email has been sent to your prospect.
      Once they confirm their interest, the mandatory 24-hour cooling-off period will begin
      automatically, and you will receive a notification.
    </td>
  </tr>
</table>
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
// 8. Cooling-Off Complete — Prospect Email
// ============================================================
export function coolingOffCompleteProspectEmail(
  prospectName: string,
  introducerName: string,
  completedAt: string,
  welcomeUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Your cooling-off period is now complete
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Dear ${prospectName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Thank you for your interest in Xenith Capital. Your 24-hour regulatory cooling-off period
  concluded at <strong>${completedAt}</strong>.
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  <strong>${introducerName}</strong> will be in touch with you shortly to discuss the next steps,
  including guiding you through the account opening process with our regulated brokerage partner,
  Pelican Trading (FCA Ref: 534484).
</p>
<p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.6;">
  Your personalised onboarding page is ready — it includes our strategy overview,
  downloadable resources, and your next steps:
</p>
${ctaButton(welcomeUrl, 'View Your Onboarding Page')}
<table style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:8px 0 20px;width:100%;" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <p style="margin:0 0 6px;color:#166534;font-size:13px;font-weight:600;">Track your performance once live</p>
      <p style="margin:0 0 10px;color:#15803d;font-size:13px;line-height:1.5;">
        Sign up to the Xenith Capital Investor Dashboard to monitor your portfolio,
        view strategy returns, and track your account in real time.
      </p>
      <a href="https://investor.xenithcapital.co.uk/" target="_blank"
         style="display:inline-block;color:#166534;font-size:13px;font-weight:600;text-decoration:underline;">
        investor.xenithcapital.co.uk →
      </a>
    </td>
  </tr>
</table>
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  If you have any questions, please contact your introducer or reach us directly at
  <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}

// ============================================================
// 9. Prospect Self-Registration Confirmation
// ============================================================
export function prospectSelfRegisteredEmail(
  prospectName: string,
  introducerName: string,
  _coolingOffEnds: string | null
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  New prospect registered — ${prospectName}
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hello ${introducerName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Your prospect <strong>${prospectName}</strong> has self-registered via your referral link.
</p>
<table style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr>
    <td style="color:#166534;font-size:13px;line-height:1.6;">
      <strong>Next step:</strong> A consent request email has been sent to your prospect.
      Once they confirm their interest, the mandatory 24-hour cooling-off period will begin
      automatically, and you will receive a notification.
    </td>
  </tr>
</table>
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  If you have any questions, contact <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}

// ============================================================
// 10. Prospect Consent Request
// ============================================================
export function prospectConsentRequestEmail(
  prospectName: string,
  introducerName: string,
  consentUrl: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Action Required: Confirm Your Interest in Xenith Capital
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Dear ${prospectName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  <strong>${introducerName}</strong> has submitted your details to the Xenith Capital Introducer Portal, registering your interest in our managed trading strategy service.
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Before we can formally register your interest and begin the required regulatory process, we need you to confirm your consent. This is a necessary step under FCA guidance.
</p>
<table style="background:#fff8f0;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr>
    <td style="color:#92400e;font-size:13px;line-height:1.6;">
      <strong>What happens when you confirm:</strong><br/>
      A mandatory 24-hour regulatory cooling-off period will start. During this period you are under <strong>no obligation</strong> to invest or take any further action. You will receive a confirmation email with a record of your consent.
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;">
  Click the button below to review the terms and confirm your interest:
</p>
${ctaButton(consentUrl, 'Confirm My Interest')}
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  This link is unique to you and can only be used once. If you did not expect this email or do not wish to proceed, please ignore it — no action will be taken.
  For questions, contact <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}

// ============================================================
// 11. Prospect Consent Confirmed (with PDF attachment)
// ============================================================
export function prospectConsentConfirmedEmail(
  prospectName: string,
  introducerName: string,
  coolingOffEnds: string
): string {
  return emailWrapper(`
<h2 style="margin:0 0 8px;color:#002147;font-size:22px;font-weight:700;">
  Cooling-Off Period Started — Xenith Capital
</h2>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Dear ${prospectName},
</p>
<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  Thank you for confirming your interest in Xenith Capital via <strong>${introducerName}</strong>.
  Your 24-hour regulatory cooling-off period has now started.
</p>
<table style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;width:100%;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:4px 0;color:#64748b;font-size:13px;">Cooling-off ends</td><td style="padding:4px 0;color:#002147;font-size:13px;font-weight:600;">${coolingOffEnds}</td></tr>
  <tr><td style="padding:8px 0 0;color:#64748b;font-size:13px;" colspan="2">During this period you are under <strong>no obligation</strong> to invest or proceed further. A signed copy of your consent form is attached to this email for your records.</td></tr>
</table>
<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
  You will receive a follow-up email from us once the cooling-off period concludes.
  In the meantime, you are welcome to learn more about our strategies:
</p>
${ctaButton('https://xenithcapital.co.uk/strategies', 'Explore Strategies')}
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
  If you have any questions, please contact <a href="mailto:info@xenithcapital.co.uk" style="color:#5FB548;">info@xenithcapital.co.uk</a>.
</p>
  `)
}

// ============================================================
// 12. Support Ticket Response — Introducer
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
