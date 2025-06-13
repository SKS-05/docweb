const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key

const supabase = createClient(supabaseUrl, supabaseKey)

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD

async function updateAdmin() {
  try {
    console.log('Updating admin account...')

    // Attempt to get user by email from Supabase auth.users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError.message)
      return
    }

    const existingAdminUser = users.users.find(user => user.email === ADMIN_EMAIL)

    if (existingAdminUser) {
      // Update existing user (e.g., password or user metadata)
      const { data: updatedUser, error: updateAuthError } = await supabase.auth.admin.updateUserById(
        existingAdminUser.id,
        {
          password: ADMIN_PASSWORD,
          email_confirm: true, // Auto-confirm email for admin
        }
      )

      if (updateAuthError) {
        console.error('Error updating admin user in auth:', updateAuthError.message)
        return
      }
      console.log('Admin user updated in Supabase Auth:', updatedUser.user.email)

    } else {
      // Create new user in Supabase Auth
      const { data: newUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Auto-confirm email for admin
      })

      if (createAuthError) {
        console.error('Error creating admin user in auth:', createAuthError.message)
        return
      }
      console.log('Admin user created in Supabase Auth:', newUser.user.email)
    }

    // Ensure the admin entry exists in the 'docs' table and update it.
    // This table is for additional user metadata, not primary authentication.
    const { error: upsertDocsError } = await supabase
      .from('docs')
      .upsert(
        {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD, // This password here is just for direct lookup in your app, will be ignored by auth.signInWithPassword
          first_login: false, // Assuming admin doesn't need first_login flow after this script
        },
        { onConflict: 'email' } // Update if email conflicts
      )

    if (upsertDocsError) {
      console.error('Error upserting admin in docs table:', upsertDocsError.message)
      return
    }
    console.log('Admin details upserted in docs table.')

    console.log('Admin setup complete!')
    console.log('New admin email:', ADMIN_EMAIL)
    console.log('Password set to:', ADMIN_PASSWORD) // For your reference, should be ADMIN_INITIAL_PASSWORD

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

updateAdmin() 