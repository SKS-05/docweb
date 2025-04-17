'use server';

import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kssinchana715@gmail.com', // Admin email
    pass: 'wxey mngw cnwa lcso'  // App password
  },
  // Add additional configuration for better deliverability
  pool: true, // Use pooled connections
  maxConnections: 3,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
});

export async function sendPasswordEmail(to: string, password: string) {
  const mailOptions = {
    from: {
      name: 'AriaDocs Admin',
      address: 'kssinchana715@gmail.com'
    },
    to,
    subject: 'Your New Password for AriaDocs',
    headers: {
      'List-Unsubscribe': '<mailto:kssinchana715@gmail.com?subject=unsubscribe>',
      'Precedence': 'bulk'
    },
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your New Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Your New Password</h2>
          <p>Hello,</p>
          <p>Your password has been updated. Here are your login credentials:</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e9ecef;">
            <p style="margin: 0;"><strong>Email:</strong> ${to}</p>
            <p style="margin: 10px 0 0;"><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p>For security reasons, please change your password after logging in.</p>
          <p>To change your password:</p>
          <ol style="margin-bottom: 20px;">
            <li>Log in using your email and the temporary password above</li>
            <li>Enter your new password</li>
          </ol>
          <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
            If you didn't request this password change, please contact your administrator immediately.
          </p>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
          <p style="color: #666; font-size: 0.8em;">
            This is an automated message from AriaDocs. Please do not reply to this email.<br>
            To unsubscribe from these notifications, reply with "unsubscribe" in the subject line.<br>
            AriaDocs - Secure Documentation Platform
          </p>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.verify(); // Verify connection configuration
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
} 