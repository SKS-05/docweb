const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://baprkcpydygrxvcvoogg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcHJrY3B5ZHlncnh2Y3Zvb2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODU4NzgsImV4cCI6MjA1ODQ2MTg3OH0.Dr2Lsu0Gh-rltskeclh-_i0HpAhtS8f_xJ39LjWU-Mc'

const supabase = createClient(supabaseUrl, supabaseKey)

const OLD_ADMIN_EMAIL = 'kssinchana715@gmail.com'
const NEW_ADMIN_EMAIL = 'sinchks94@gmail.com'
const ADMIN_PASSWORD = 'newpassword'

async function updateAdmin() {
  try {
    console.log('Updating admin account...')

    // Step 1: Check if old admin exists
    const { data: oldAdmin, error: oldAdminError } = await supabase
      .from('docs')
      .select('*')
      .eq('email', OLD_ADMIN_EMAIL)
      .single()

    if (oldAdminError) {
      console.error('Error finding old admin:', oldAdminError.message)
      return
    }

    if (!oldAdmin) {
      console.error('Old admin account not found')
      return
    }

    // Step 2: Check if new admin already exists
    const { data: existingNewAdmin, error: checkError } = await supabase
      .from('docs')
      .select('*')
      .eq('email', NEW_ADMIN_EMAIL)
      .single()

    if (existingNewAdmin) {
      // Update existing new admin record
      const { error: updateError } = await supabase
        .from('docs')
        .update({
          password: ADMIN_PASSWORD,
          first_login: false
        })
        .eq('email', NEW_ADMIN_EMAIL)

      if (updateError) {
        console.error('Error updating new admin:', updateError.message)
        return
      }
    } else {
      // Create new admin record
      const { error: insertError } = await supabase
        .from('docs')
        .insert([{
          email: NEW_ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          first_login: false
        }])

      if (insertError) {
        console.error('Error creating new admin:', insertError.message)
        return
      }
    }

    // Step 3: Delete old admin if different from new admin
    if (OLD_ADMIN_EMAIL !== NEW_ADMIN_EMAIL) {
      const { error: deleteError } = await supabase
        .from('docs')
        .delete()
        .eq('email', OLD_ADMIN_EMAIL)

      if (deleteError) {
        console.error('Error deleting old admin:', deleteError.message)
        return
      }
    }

    console.log('Admin update complete!')
    console.log('New admin email:', NEW_ADMIN_EMAIL)
    console.log('Password:', ADMIN_PASSWORD)

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

updateAdmin() 