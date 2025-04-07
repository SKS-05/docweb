const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baprkcpydygrxvcvoogg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcHJrY3B5ZHlncnh2Y3Zvb2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODU4NzgsImV4cCI6MjA1ODQ2MTg3OH0.Dr2Lsu0Gh-rltskeclh-_i0HpAhtS8f_xJ39LjWU-Mc'

const supabase = createClient(supabaseUrl, supabaseKey)

const adminEmail = 'kssinchana715@gmail.com'
const adminPassword = '1234567890'

async function setupAdmin() {
  try {
    console.log('Setting up admin account...')

    // Step 1: Check if admin already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single()

    if (existingUser) {
      console.log('Admin account already exists')
      return
    }

    // Step 2: Create admin in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          is_admin: true
        }
      }
    })

    if (authError) {
      console.error('Auth Error:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('No user data returned')
      return
    }

    console.log('Auth account created:', authData.user)

    // Step 3: Create admin in users table
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: adminEmail,
          first_login: false,
          is_admin: true
        }
      ])

    if (dbError) {
      console.error('Database Error:', dbError.message)
      return
    }

    console.log('Admin record created in database')

    // Step 4: Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    if (signInError) {
      console.error('Sign in Error:', signInError.message)
      return
    }

    console.log('Successfully signed in as admin')
    console.log('\nAdmin account setup complete!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\nYou can now log in with these credentials')

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

setupAdmin() 