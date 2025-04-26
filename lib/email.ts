'use server';

import nodemailer from 'nodemailer';
import { validateEmail } from '@/lib/validation';
import dns from 'dns';
import { promisify } from 'util';
import type { SentMessageInfo } from 'nodemailer';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { Readable } from 'stream';

const dnsResolveMx = promisify(dns.resolveMx);

// Admin email configuration
const adminEmail = process.env.ADMIN_EMAIL || 'kssinchana715@gmail.com';
const adminPassword = process.env.ADMIN_APP_PASSWORD || '';
const APP_NAME = 'AriaAuth';

/**
 * Check if a domain has valid MX records
 * @param domain The domain to check
 * @returns True if the domain has valid MX records
 */
async function isDomainValid(domain: string): Promise<boolean> {
  try {
    const mxRecords = await dnsResolveMx(domain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch (error) {
    console.error(`Error validating domain ${domain}:`, error);
    return false;
  }
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: adminEmail,
    pass: adminPassword,
  },
  // Connection pooling to reuse connections
  pool: true,
  // Rate limiting to avoid being flagged as spam
  rateLimit: 10, // max 10 emails per second
  maxConnections: 5,
  // Add headers to improve deliverability
  headers: {
    'X-Priority': '1', // High priority
    'X-MSMail-Priority': 'High'
  }
});

// Verify transport configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection established');
  }
});

/**
 * Send a password email to a user
 * @param toEmail Recipient email address
 * @param username User's username or name
 * @param password The new password
 * @param subject Email subject
 * @returns Promise resolving to success status
 */
export async function sendPasswordEmail(
  toEmail: string,
  username: string,
  password: string,
  subject = 'Your New AriaAuth Password'
): Promise<boolean> {
  try {
    // Validate email format
    if (!validateEmail(toEmail)) {
      console.error(`Invalid email format: ${toEmail}`);
      return false;
    }

    // Get domain from email
    const domain = toEmail.split('@')[1];
    
    // Validate domain has MX records
    const domainValid = await isDomainValid(domain);
    if (!domainValid) {
      console.error(`Invalid email domain: ${domain}`);
      return false;
    }

    // Build a well-formatted HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 5px;
          }
          .header {
            background-color: #4f46e5;
            color: white;
            padding: 10px 20px;
            border-radius: 5px 5px 0 0;
          }
          .content {
            padding: 20px;
          }
          .password {
            font-family: monospace;
            font-size: 16px;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
            margin: 10px 0;
          }
          .footer {
            font-size: 12px;
            color: #666;
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${APP_NAME}</h2>
          </div>
          <div class="content">
            <p>Hello ${username},</p>
            <p>Your account has been created or updated in the ${APP_NAME} system.</p>
            <p>Your new password is:</p>
            <div class="password">${password}</div>
            <p><strong>Important:</strong> For security reasons, please change your password upon first login.</p>
            <p>If you did not request this password, please contact your administrator immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${APP_NAME}. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: {
        name: `${APP_NAME} Admin`,
        address: adminEmail
      },
      to: toEmail,
      subject: subject,
      text: `Hello ${username},\n\nYour account has been created or updated in the ${APP_NAME} system.\n\nYour new password is: ${password}\n\nFor security reasons, please change your password upon first login.\n\nIf you did not request this password, please contact your administrator immediately.\n\nThis is an automated message from ${APP_NAME}. Please do not reply to this email.`,
      html: htmlContent,
      // Improve deliverability with these options
      priority: 'high',
      headers: {
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2, 11)}` // Unique ID for this email
      }
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Create IMAP client for checking bounces
const imapConfig = {
  user: 'kssinchana715@gmail.com',
  password: 'wxey mngw cnwa lcso', // App password
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Store failed email addresses
const failedEmails = new Set<string>();

// Function to check for bounce messages in inbox
async function checkBouncedEmails(): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    try {
      const imap = new Imap(imapConfig);
      
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            imap.end();
            resolve(failedEmails);
            return;
          }
          
          // Search for bounce messages from Mail Delivery Subsystem
          const searchCriteria = [
            ['FROM', 'Mail Delivery Subsystem'], 
            ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
          ];
          
          imap.search(searchCriteria, (err, results) => {
            if (err) {
              console.error('Error searching emails:', err);
              imap.end();
              resolve(failedEmails);
              return;
            }
            
            if (results.length === 0) {
              console.log('No bounce messages found');
              imap.end();
              resolve(failedEmails);
              return;
            }
            
            const f = imap.fetch(results, { bodies: '' });
            
            f.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                // Convert to Readable stream for mailparser
                const readableStream = stream as unknown as Readable;
                
                simpleParser(readableStream)
                  .then((parsed) => {
                    const subject = parsed.subject || '';
                    const text = parsed.text || '';
                    
                    // Look for typical bounce message patterns
                    if ((subject.includes('Delivery Status Notification') || subject.includes('Mail delivery failed')) 
                        && text.includes('550')) {
                      // Extract failed email address
                      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                      if (emailMatches) {
                        emailMatches.forEach(email => {
                          if (email !== 'kssinchana715@gmail.com') {
                            console.log('Found bounced email:', email);
                            failedEmails.add(email);
                          }
                        });
                      }
                    }
                  })
                  .catch(err => {
                    console.error('Error parsing message:', err);
                  });
              });
            });
            
            f.once('end', () => {
              console.log('Finished checking bounce messages, found', failedEmails.size, 'failed emails');
              imap.end();
              resolve(failedEmails);
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        resolve(failedEmails);
      });
      
      imap.connect();
    } catch (error) {
      console.error('Error in checkBouncedEmails:', error);
      resolve(failedEmails);
    }
  });
}

// Run an initial check for bounced emails on server start
checkBouncedEmails().then(failed => {
  console.log('Initial bounce check found', failed.size, 'failed emails');
});

// Schedule checking for bounces every 5 minutes
setInterval(async () => {
  await checkBouncedEmails();
  console.log('Scheduled bounce check found', failedEmails.size, 'failed emails');
}, 5 * 60 * 1000);

/**
 * Function to check for bounced emails and handle them
 * This is a placeholder for future implementation
 */
export async function checkForBounces() {
  // In the future, implement a bounce handling mechanism here
  // For Google Workspace, you might use the Gmail API to check for bounce notifications
  // For now, this is just a placeholder
  return;
}

// Function to check if an email has bounced (for use by other parts of the app)
export const checkIfEmailBounced = async (email: string): Promise<boolean> => {
  // First check our in-memory cache
  if (failedEmails.has(email)) {
    return true;
  }
  
  // Then force a fresh check
  await checkBouncedEmails();
  return failedEmails.has(email);
}; 