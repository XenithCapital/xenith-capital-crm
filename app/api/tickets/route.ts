import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, ADMIN_EMAIL } from '@/lib/email/resend'
import {
  supportTicketAdminEmail,
  supportTicketResponseEmail,
} from '@/lib/email/templates'
import type { TicketPriority } from '@/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://partners.xenithcapital.co.uk'

// POST: Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { subject, ticketBody, priority } = body

    if (!subject || !ticketBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: ticket, error: insertError } = await serviceClient
      .from('support_tickets')
      .insert({
        raised_by: user.id,
        subject,
        body: ticketBody,
        priority: (priority as TicketPriority) ?? 'normal',
        status: 'open',
      })
      .select()
      .single()

    if (insertError || !ticket) {
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Notify admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New support ticket: ${subject} from ${profile?.full_name ?? user.email}`,
      html: supportTicketAdminEmail(
        profile?.full_name ?? user.email ?? 'Unknown',
        subject,
        ticketBody,
        `${APP_URL}/admin/tickets`
      ),
    })

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('[create-ticket] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Admin responds to a ticket
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { ticketId, adminResponse, status } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const updates: Record<string, unknown> = {}
    if (adminResponse !== undefined) updates.admin_response = adminResponse
    if (status !== undefined) updates.status = status

    const { data: ticket, error: updateError } = await serviceClient
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select('*, raiser:raised_by(full_name, email)')
      .single()

    if (updateError || !ticket) {
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    // Notify introducer if response was added
    if (adminResponse && ticket) {
      const raiser = ticket.raiser as { full_name: string; email: string } | null
      if (raiser?.email) {
        await sendEmail({
          to: raiser.email,
          subject: `Update on your support ticket: ${ticket.subject}`,
          html: supportTicketResponseEmail(
            raiser.full_name,
            ticket.subject,
            adminResponse,
            `${APP_URL}/portal/tickets`
          ),
        })
      }
    }

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('[update-ticket] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
