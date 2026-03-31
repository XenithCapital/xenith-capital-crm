import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReSignWizard from './re-sign-wizard'

export default async function ReSignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return <ReSignWizard profile={profile} />
}
