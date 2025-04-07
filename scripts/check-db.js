const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baprkcpydygrxvcvoogg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcHJrY3B5ZHlncnh2Y3Zvb2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODU4NzgsImV4cCI6MjA1ODQ2MTg3OH0.Dr2Lsu0Gh-rltskeclh-_i0HpAhtS8f_xJ39LjWU-Mc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  try {
    console.log('Checking database structure...')

    // Check if users table exists and its structure
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('Error checking users table:', usersError.message)
      return
    }

    console.log('Users table exists')

    // Check auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error checking auth users:', authError.message)
      return
    }

    console.log('\nAuth users:', authData)

    // Try to sign in as admin
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'kssinchana715@gmail.com',
      password: '1234567890'
    })

    if (signInError) {
      console.error('\nSign in error:', signInError.message)
    } else {
      console.log('\nSign in successful:', signInData)
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkDatabase() 