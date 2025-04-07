const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baprkcpydygrxvcvoogg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcHJrY3B5ZHlncnh2Y3Zvb2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODU4NzgsImV4cCI6MjA1ODQ2MTg3OH0.Dr2Lsu0Gh-rltskeclh-_i0HpAhtS8f_xJ39LjWU-Mc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  try {
    console.log('Testing login with correct password...')

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'kssinchana715@gmail.com',
      password: 'newpassword'
    })

    if (signInError) {
      console.error('Sign in error:', signInError.message)
    } else {
      console.log('Sign in successful:', signInData)
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testLogin() 