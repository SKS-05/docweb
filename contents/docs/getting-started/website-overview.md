# Website Overview & Troubleshooting Guide

## Overview

Areadocs is a modern documentation platform built with Next.js. It features:
- User authentication (login/logout)
- Password management (send, resend, and track email status)
- Algolia-powered instant search
- MDX-based content for easy documentation writing
- Responsive, accessible UI

---

## How the Website Functions

### 1. User Authentication
- Users log in with their email and password.
- Admin users (e.g., `sinchks94@gmail.com`) have access to special routes like `/send-passwords`.

### 2. Password Management
- Admins can upload a CSV of user emails.
- The system generates and sends temporary passwords to new users.
- Email status is tracked and displayed:
  - **New**: User just added, not yet sent a password.
  - **Processing**: Email is being sent.
  - **Email Sent**: Successfully sent.
  - **Already Sent**: Email was already sent previously.
  - **Failed to Send**: Sending failed (e.g., invalid email, bounce).

### 3. Resending Passwords
- Admins can select users with failed or already sent statuses and resend emails.
- Only users with "new" status are processed when "Generate & Send Passwords" is clicked.

### 4. Algolia Search

- The search bar uses Algolia DocSearch for instant, hierarchical search.
- Search results are grouped by main topic and subtopic.
- Clicking a result navigates to the correct documentation page.
- The search functionality is implemented using the `AlgoliaSearch` component (`components/algolia-search.tsx`), which is integrated into the navbar (`components/navbar.tsx`).
- Algolia is configured using the following environment variables in the `.env.local` file:
  - `NEXT_PUBLIC_ALGOLIA_APP_ID`: Your Algolia Application ID.
  - `NEXT_PUBLIC_ALGOLIA_INDEX_NAME`: The name of your Algolia index configured to crawl your documentation content.
  - `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`: Your Algolia Search-only API Key.
- The indexing of documentation content is typically handled by the Algolia DocSearch scraper or a custom build process based on your Algolia configuration, which ensures all relevant files in `contents/docs/` are indexed.

### 5. Documentation Content
- All docs are written in MDX files under `contents/docs/`.
- Each page can have headings, code blocks, tables, and custom components.

### 6. Changing Admin Access
To change the admin email, follow these steps:

1. **Update Environment Variables**
   - Open `.env.local` file
   - Update `NEXT_PUBLIC_ADMIN_EMAIL` to the new admin email
   - Example: `NEXT_PUBLIC_ADMIN_EMAIL=sinchks94@gmail.com`

2. **Update Code Files**
   - Update admin email in `app/login/page.tsx`
   - Update admin email in `app/page.tsx`
   - Update admin email in `app/send-passwords/page.tsx`
   - Update admin email in `lib/email.ts`
   - Update admin email in `components/navbar.tsx`

3. **Update Database**
   - Run the update admin script: `node scripts/update-admin.js`
   - This will update the admin credentials in the database

4. **Verify Changes**
   - Log out of the current admin account
   - Log in with the new admin email
   - Verify access to admin features:
     - "Send Passwords" button in navbar
     - Access to `/send-passwords` page
     - Ability to send/resend passwords

---

## Key Features

- **Status Tracking:** Real-time email status for each user.
- **Bulk Operations:** Upload users via CSV, bulk send/resend passwords.
- **Search:** Fast, typo-tolerant, and grouped search results.
- **Responsive Design:** Works on desktop and mobile.
- **Admin Controls:** Only admins can access sensitive routes.

---

## Possible Errors & How to Fix Them

### Authentication Errors
- **Wrong password:** User sees an error message. _Fix:_ Double-check credentials.
- **Not logged in:** Redirected to login page for protected routes. _Fix:_ Log in again.

### Email Sending Errors
- **Invalid email format:** Status set to "Failed to Send". _Fix:_ Check and correct the email address.
- **Email already sent:** Status set to "Already Sent". _Fix:_ Use the resend feature if needed.
- **SMTP/server error:** Status set to "Failed to Send". _Fix:_ Check SMTP credentials and server status.
- **Bounce detected:** Status set to "Failed to Send" after bounce check. _Fix:_ Verify the recipient's email address is valid and active.

### Admin Change Errors
- **"Not authenticated or not admin" error:**
  - _Fix:_ Ensure all files have been updated with the new admin email
  - _Fix:_ Clear browser cache and local storage
  - _Fix:_ Restart the Next.js development server

- **Missing "Send Passwords" button:**
  - _Fix:_ Check if `components/navbar.tsx` has the correct admin email
  - _Fix:_ Verify you're on the home page (`pathname === '/'`)
  - _Fix:_ Ensure you're logged in with the new admin email

- **Cannot access `/send-passwords` page:**
  - _Fix:_ Check if `app/send-passwords/page.tsx` has the correct admin email
  - _Fix:_ Verify the database update script ran successfully
  - _Fix:_ Check browser console for any authentication errors

- **Email sending fails after admin change:**
  - _Fix:_ Verify `lib/email.ts` has the correct admin email and app password
  - _Fix:_ Check SMTP configuration in the email service
  - _Fix:_ Ensure the new admin email has proper Gmail app password set up

### Algolia Search Errors
- **appId/apiKey/indexName missing:**
  - _Fix:_ Check your `.env.local` file and make sure all three are set.
- **No results:**
  - _Fix:_ Make sure your Algolia index has records with the correct structure.
- **404 on search result click:**
  - _Fix:_ The `url` in your Algolia record does not match a real page in your app. Update the record or create the page.
- **TypeError: Cannot read properties of undefined (reading 'lvl0'):**
  - _Fix:_ Ensure each Algolia record has a `hierarchy` object with at least `lvl0`.

### General UI Issues
- **Status flicker:**
  - _Fix:_ Only update statuses for users being processed. Do not clear all statuses at once.
- **Processing tag disappears too soon:**
  - _Fix:_ Don't clear the status before the email is actually sent.

---

## How to Add Documentation

- Add new `.mdx` or `.md` files under `contents/docs/` for each topic.
- Use headings (`#`, `##`, etc.) for hierarchy.
- Add code blocks, tables, and custom components as needed.

### Example: Adding a New Doc Page

Create a file: `contents/docs/getting-started/faq/index.mdx`

```mdx
# FAQ

## How do I reset my password?
Go to the login page and click "Forgot Password".

## How do I contact support?
Email us at support@example.com.
```

---

## Need Help?

- For Algolia issues, check the [Algolia Dashboard](https://www.algolia.com/).
- For email issues, check your SMTP/app password and logs.
- For Next.js errors, check your terminal and browser console.
- For admin access issues, verify all email references and database updates.

---

## Setting Up Project in a New Account

### 1. Initial Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/SKS-05/docweb.git
   cd docweb
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### 2. Environment Configuration
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email

# Algolia Configuration
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=your_algolia_index_name
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_algolia_search_key
```

### 3. Required Services Setup

#### A. Supabase Setup
1. Create a new Supabase project
2. Get your project URL and anon key from your Supabase project settings (API -> Config).
3. Create the following table in your Supabase project's SQL Editor:

```sql
create table docs (
  email text primary key,
  password text,
  first_login boolean,
  email_sent boolean,
  email_sending boolean,
  message_id text
);
```
- This table is used to store user information, including email, password, login status, and email sending status for the password management feature.

#### B. Gmail Setup for Email Service
1. Create a Gmail account for sending emails
2. Enable 2-factor authentication
3. Generate an App Password:
   - Go to Google Account → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
4. Update `lib/email.ts` with:
   ```typescript
   const adminEmail = 'your_gmail_address';
   const adminPassword = 'your_app_password';
   ```

#### C. Algolia Setup
1. Create an Algolia account
2. Create a new application
3. Create an index for your documentation
4. Configure DocSearch:
   - Submit your site for DocSearch indexing
   - Once approved, you'll receive your API keys

### 4. Code Modifications

#### A. Update Email Configuration
In `lib/email.ts`:
```typescript
const adminEmail = 'your_gmail_address';
const adminPassword = 'your_app_password';
const APP_NAME = 'YourAppName';
```

#### B. Update Admin Email References
Update the admin email in these files:
- `app/login/page.tsx`
- `app/page.tsx`
- `app/send-passwords/page.tsx`
- `components/navbar.tsx`

#### C. Update Database Script
Create `scripts/update-admin.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateAdmin() {
  const { error } = await supabase
    .from('docs')
    .upsert({
      email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      password: 'newpassword', // Change this to your desired password
      first_login: false,
      email_sent: true
    });

  if (error) {
    console.error('Error updating admin:', error);
  } else {
    console.log('Admin updated successfully');
  }
}

updateAdmin();
```

### 5. Running the Project
1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### 6. Common Setup Issues

#### A. Supabase Connection Issues
- **Error:** "Failed to connect to Supabase"
  - _Fix:_ Verify your Supabase URL and anon key
  - _Fix:_ Check if your IP is allowed in Supabase dashboard
  - _Fix:_ Ensure the database tables are created correctly

#### B. Email Service Issues
- **Error:** "SMTP connection failed"
  - _Fix:_ Verify Gmail credentials
  - _Fix:_ Check if 2FA is enabled
  - _Fix:_ Ensure app password is correct
  - _Fix:_ Check if "Less secure app access" is enabled

#### C. Algolia Search Issues
- **Error:** "Algolia search not working"
  - _Fix:_ Verify API keys in `.env.local`
  - _Fix:_ Check if your index is properly configured
  - _Fix:_ Ensure your content is indexed

#### D. Database Issues
- **Error:** "Table does not exist"
  - _Fix:_ Run the SQL commands to create required tables
  - _Fix:_ Check table names and column types
  - _Fix:_ Verify database permissions

### 7. Security Considerations
1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different credentials for development and production
   - Regularly rotate sensitive keys

2. **Email Security**
   - Use app passwords instead of regular passwords
   - Regularly update app passwords
   - Monitor email sending logs

3. **Database Security**
   - Set up proper row-level security in Supabase
   - Use appropriate access policies
   - Regularly backup your database

4. **API Security**
   - Keep API keys secure
   - Use appropriate CORS settings
   - Monitor API usage

Feel free to expand this documentation as your project grows! If you want a more detailed section or a specific troubleshooting guide, just ask.

## Deploying to Vercel

### 1. Prerequisites
Before deploying to Vercel, make sure you have:
- A GitHub account
- A Vercel account (you can sign up with your GitHub account)
- All your environment variables ready (from the setup section above)
- Your project pushed to a GitHub repository

### 2. Step-by-Step Deployment Guide

#### Step 1: Push Your Code to GitHub
1. **Clone the Repository**
   ```bash
   git clone https://github.com/SKS-05/docweb.git
   cd docweb
   ```

2. **Push Your Changes**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

#### Step 2: Deploy on Vercel
1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" if you don't have an account
   - Sign in with your GitHub account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Find `SKS-05/docweb` in the list of repositories
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Select "Next.js"
   - Root Directory: Leave as is (usually `/`)
   - Build Command: Leave as is (usually `next build`)
   - Output Directory: Leave as is (usually `.next`)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add each variable from your `.env.local` file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
     NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email
     NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
     NEXT_PUBLIC_ALGOLIA_INDEX_NAME=your_algolia_index_name
     NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_algolia_search_key
     ```
   - Click "Save"

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your site will be live at `your-project-name.vercel.app`

### 3. After Deployment

#### A. Verify Your Deployment
1. **Check Basic Functionality**
   - Visit your site URL
   - Test the login functionality
   - Verify admin access
   - Test the search feature

2. **Check Email Functionality**
   - Try sending a test password email
   - Verify email delivery
   - Check email formatting

3. **Check Database Connection**
   - Try creating a new user
   - Verify data is saved in Supabase
   - Check admin access

#### B. Set Up Custom Domain (Optional)
1. **Add Domain**
   - Go to your project in Vercel
   - Click "Settings" → "Domains"
   - Add your domain
   - Follow Vercel's instructions to configure DNS

2. **Configure SSL**
   - Vercel automatically handles SSL certificates
   - Wait for SSL to be provisioned (usually 5-10 minutes)

### 4. Common Deployment Issues

#### A. Build Failures
- **Error:** "Build failed"
  - _Fix:_ Check build logs in Vercel dashboard
  - _Fix:_ Verify all dependencies are in `package.json`
  - _Fix:_ Make sure all environment variables are set

#### B. Environment Variables
- **Error:** "Missing environment variables"
  - _Fix:_ Double-check all variables are added in Vercel
  - _Fix:_ Verify variable names match exactly
  - _Fix:_ Check for typos in values

#### C. Database Connection
- **Error:** "Cannot connect to database"
  - _Fix:_ Verify Supabase URL and key
  - _Fix:_ Check if IP restrictions are set in Supabase
  - _Fix:_ Ensure database is properly set up

#### D. Email Service
- **Error:** "Email sending failed"
  - _Fix:_ Verify Gmail credentials
  - _Fix:_ Check if app password is correct
  - _Fix:_ Ensure email service is properly configured

### 5. Maintenance Tips

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor Vercel for any warnings
   - Check build logs regularly

2. **Monitoring**
   - Use Vercel Analytics to monitor performance
   - Set up error tracking
   - Monitor email delivery rates

3. **Backups**
   - Regularly backup your database
   - Keep a copy of environment variables
   - Document any custom configurations

4. **Scaling**
   - Monitor usage and performance
   - Upgrade Vercel plan if needed
   - Optimize images and assets

### 6. Getting Help

If you encounter issues:
1. Check Vercel's [documentation](https://vercel.com/docs)
2. Look for similar issues in [Vercel's GitHub discussions](https://github.com/vercel/vercel/discussions)
3. Contact Vercel support if needed
4. Check your project's build logs for specific errors
5. Visit the project repository at [https://github.com/SKS-05/docweb](https://github.com/SKS-05/docweb) for updates and issues 