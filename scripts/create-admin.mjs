import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bcurxeoptnyopblobnst.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const EMAIL = process.env.ADMIN_EMAIL || 'admin@xenithcapital.co.uk'
const PASSWORD = process.env.ADMIN_PASSWORD

if (!PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is required')
  process.exit(1)
}

async function createAdmin() {
  console.log(`Creating admin user: ${EMAIL}`)

  // Create the user via Admin API (bypasses trigger issues)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      full_name: process.env.ADMIN_NAME || 'Admin',
    },
  })

  if (authError) {
    console.error('Failed to create auth user:', authError.message)
    process.exit(1)
  }

  console.log('Auth user created:', authData.user.id)

  // Upsert profile row (in case trigger didn't fire)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    email: EMAIL,
    full_name: process.env.ADMIN_NAME || 'Admin',
    role: 'admin',
    agreement_signed: true, // admins don't need to sign
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('Failed to upsert profile:', profileError.message)
    console.log('Auth user was created (ID:', authData.user.id, ') — manually insert profile if needed')
    process.exit(1)
  }

  console.log('✅ Admin user created successfully!')
  console.log('   Email:', EMAIL)
  console.log('   ID:', authData.user.id)
  console.log('   Role: admin')
  console.log('\nYou can now log in at http://localhost:3000/login')
}

createAdmin()
