export type UserRole = 'admin' | 'introducer'
export type IntroducerTier = 'tier_1' | 'tier_2' | 'tier_3'

export type ProspectStatus =
  | 'pending_consent'
  | 'registered'
  | 'cooling_off'
  | 'cooling_off_complete'
  | 'education_sent'
  | 'handoff_pending'
  | 'handed_off'
  | 'onboarding'
  | 'funded'
  | 'active'
  | 'stalled'
  | 'lost'
  | 'rejected'

export type InvestorStatus = 'active' | 'inactive' | 'withdrawn' | 'suspended'
export type ReferralRewardStatus = 'pending' | 'vested' | 'paid' | 'forfeited'
export type InvestorStrategy = 'XQS' | 'XNS' | 'XXS'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  linkedin_url: string | null
  agreement_signed: boolean
  signed_agreement_version: string | null
  is_internal: boolean
  tier: IntroducerTier
  created_at: string
  updated_at: string
}

export interface AppSetting {
  key: string
  value: string
  updated_at: string
  updated_by: string | null
}

export interface Document {
  id: string
  name: string
  description: string | null
  category: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  visible_to_introducers: boolean
  uploaded_by: string | null
  created_at: string
}

export interface Agreement {
  id: string
  introducer_id: string
  signed_at: string
  ip_address: string
  full_name_typed: string
  agreement_version: string
  pdf_storage_path: string
  created_at: string
}

export interface Prospect {
  id: string
  introducer_id: string
  full_name: string
  email: string
  phone: string | null
  country: string | null
  source_note: string | null
  status: ProspectStatus
  cooling_off_started_at: string | null
  cooling_off_completed_at: string | null
  consent_token: string | null
  consent_signed_at: string | null
  consent_ip_address: string | null
  consent_pdf_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  introducer?: Profile
}

export interface ProspectStatusHistory {
  id: string
  prospect_id: string
  changed_by: string
  old_status: string | null
  new_status: string
  note: string | null
  changed_at: string
  // Joined
  changer?: Profile
}

export interface Investor {
  id: string
  prospect_id: string | null
  introducer_id: string
  full_name: string
  email: string
  phone: string | null
  vantage_account_number: string | null
  strategy: InvestorStrategy | null
  account_type: string | null
  funded_amount_usd: number | null
  status: InvestorStatus
  funded_at: string | null
  vesting_start_date: string | null
  vesting_end_date: string | null
  referral_reward_status: ReferralRewardStatus
  high_water_mark: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  introducer?: Profile
  prospect?: Prospect
}

export interface SupportTicket {
  id: string
  raised_by: string
  subject: string
  body: string
  status: TicketStatus
  priority: TicketPriority
  admin_response: string | null
  created_at: string
  updated_at: string
  // Joined
  raiser?: Profile
}

export interface AuditLog {
  id: string
  actor_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  // Joined
  actor?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      agreements: {
        Row: Agreement
        Insert: Omit<Agreement, 'id' | 'created_at'>
        Update: Partial<Omit<Agreement, 'id' | 'created_at'>>
      }
      prospects: {
        Row: Prospect
        Insert: Omit<Prospect, 'id' | 'created_at' | 'updated_at' | 'introducer'>
        Update: Partial<Omit<Prospect, 'id' | 'created_at' | 'introducer'>>
      }
      prospect_status_history: {
        Row: ProspectStatusHistory
        Insert: Omit<ProspectStatusHistory, 'id' | 'changed_at' | 'changer'>
        Update: Partial<Omit<ProspectStatusHistory, 'id' | 'changer'>>
      }
      investors: {
        Row: Investor
        Insert: Omit<Investor, 'id' | 'created_at' | 'updated_at' | 'introducer' | 'prospect'>
        Update: Partial<Omit<Investor, 'id' | 'created_at' | 'introducer' | 'prospect'>>
      }
      support_tickets: {
        Row: SupportTicket
        Insert: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'raiser'>
        Update: Partial<Omit<SupportTicket, 'id' | 'created_at' | 'raiser'>>
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at' | 'actor'>
        Update: never
      }
    }
  }
}
