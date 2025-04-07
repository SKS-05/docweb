const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baprkcpydygrxvcvoogg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcHJrY3B5ZHlncnh2Y3Zvb2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODU4NzgsImV4cCI6MjA1ODQ2MTg3OH0.Dr2Lsu0Gh-rltskeclh-_i0HpAhtS8f_xJ39LjWU-Mc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDocsTable() {
  try {
    console.log('Checking docs table structure...')

    // Check if docs table exists and its structure
    const { data: docsData, error: docsError } = await supabase
      .from('docs')
      .select('*')
      .limit(1)

    if (docsError) {
      console.error('Error checking docs table:', docsError.message)
      return
    }

    console.log('Docs table exists')
    console.log('Sample data:', docsData)

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

checkDocsTable() 