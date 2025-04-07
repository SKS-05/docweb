const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baprkcpydygrxvcvoogg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcHJrY3B5ZHlncnh2Y3Zvb2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODU4NzgsImV4cCI6MjA1ODQ2MTg3OH0.Dr2Lsu0Gh-rltskeclh-_i0HpAhtS8f_xJ39LjWU-Mc'

const supabase = createClient(supabaseUrl, supabaseKey)

// List of emails to add (example)
const emailsToAdd = [
  'kssinchana715@gmail.com',
  'naveenshetty08@gmail.com',
  'shettynidhiii12@gmail.com'
]

// List of emails to remove (example)
const emailsToRemove = [
  'srujalbiradar777@gmail.com'
]

async function manageUsers() {
  try {
    console.log('Managing users...')

    // Step 1: Add new users
    if (emailsToAdd.length > 0) {
      const newUsers = emailsToAdd.map(email => ({
        email,
        password: email === 'kssinchana715@gmail.com' ? 'newpassword' : 'defaultpassword',
        first_login: email !== 'kssinchana715@gmail.com'
      }))

      const { error: upsertError } = await supabase
        .from('docs')
        .upsert(newUsers, {
          onConflict: 'email',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('Error adding/updating users:', upsertError.message)
      } else {
        console.log('Successfully added/updated users:', emailsToAdd)
      }
    }

    // Step 2: Remove users
    if (emailsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('docs')
        .delete()
        .in('email', emailsToRemove)

      if (deleteError) {
        console.error('Error removing users:', deleteError.message)
      } else {
        console.log('Successfully removed users:', emailsToRemove)
      }
    }

    // Step 3: List all current users
    const { data: currentUsers, error: listError } = await supabase
      .from('docs')
      .select('email, first_login')
      .order('email')

    if (listError) {
      console.error('Error listing users:', listError.message)
    } else {
      console.log('\nCurrent users in the system:')
      currentUsers.forEach(user => {
        console.log(`- ${user.email} (${user.first_login ? 'First Login' : 'Active'})`)
      })
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

manageUsers() 