'use server';

import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kssinchana715@gmail.com', // Admin email
    pass: 'wxey mngw cnwa lcso'  // App password
  }
});

export async function sendPasswordEmail(to: string, password: string) {
  const mailOptions = {
    from: 'kssinchana715@gmail.com', // Admin email as sender
    to,
    subject: 'Your New Password for AriaDocs',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your New Password</h2>
        <p>Hello,</p>
        <p>Your password has been updated. Here are your login credentials:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 10px 0 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p>For security reasons, please change your password after logging in.</p>
        <p>To change your password:</p>
        <ol>
          <li>Log in using your email and the temporary password above</li>
          <li>Click on the "Change Password" button in your dashboard</li>
          <li>Enter your new password</li>
        </ol>
        <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
          If you didn't request this password change, please contact your administrator immediately.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
} 