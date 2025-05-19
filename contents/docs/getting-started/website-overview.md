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
- Admin users (e.g., `kssinchana715@gmail.com`) have access to special routes like `/send-passwords`.

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

### 5. Documentation Content
- All docs are written in MDX files under `contents/docs/`.
- Each page can have headings, code blocks, tables, and custom components.

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

---

Feel free to expand this documentation as your project grows! If you want a more detailed section or a specific troubleshooting guide, just ask. 