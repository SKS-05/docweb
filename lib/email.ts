'use server';

import nodemailer from 'nodemailer';
import { validateEmail } from './validation';
import dns from 'dns';
import { promisify } from 'util';
import type { SentMessageInfo } from 'nodemailer';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { Readable } from 'stream';
import fs from 'fs';

const dnsResolveMx = promisify(dns.resolveMx);

// Admin email configuration
const adminEmail = 'sinchks94@gmail.com';
// App password for Gmail (replace with your actual app password)
const adminPassword = 'wxey mngw cnwa lcso';
const APP_NAME = 'AriaAuth';

// Initialize in-memory tracking for sent emails
let sentEmails = new Set<string>();

// Function to load sent emails from file (to persist the state)
const loadSentEmails = () => {
  try {
    const data = fs.readFileSync('sentEmails.json', 'utf8');
    const parsedData = JSON.parse(data);
    sentEmails = new Set(parsedData);
  } catch (error) {
    console.log('No previous sent emails found, starting fresh.');
  }
};

// Function to save sent emails to file
const saveSentEmails = () => {
  try {
    fs.writeFileSync('sentEmails.json', JSON.stringify(Array.from(sentEmails), null, 2));
  } catch (error) {
    console.error('Error saving sent emails:', error);
  }
};

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: adminEmail,
    pass: adminPassword
  },
  pool: true, // Use pooled connections
  maxConnections: 3,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  // Enable SMTP debugging for detailed logs
  debug: true,
  logger: true,
  // Add verification settings
  verify: true as any, // Type assertion to fix verify property type
  headers: {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High'
  }
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

// Function to validate email domain
async function isDomainValid(domain: string): Promise<boolean> {
  try {
    const mxRecords = await dnsResolveMx(domain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch (error) {
    console.error(`Error validating domain ${domain}:`, error);
    return false;
  }
}

// Function to process new CSV data and send emails to new users only
async function processCsvAndSendEmails(csvFile: string) {
  // Simulate CSV parsing (replace with actual CSV parsing logic)
  const users = parseCsv(csvFile);  // You need to implement this function

  for (const user of users) {
    const { email, username } = user;
    
    // If email has not been sent before, send it
    if (!sentEmails.has(email)) {
      const password = generatePassword();  // Function to generate a password
      await sendPasswordEmail(email, password);
    } else {
      console.log(`Skipping email to ${email}, already sent.`);
    }
  }
}

// Load previously sent emails when the server starts
loadSentEmails();

// Example function to parse CSV file (implement this based on your needs)
function parseCsv(csvFile: string): { email: string, username: string }[] {
  // Example of CSV parsing logic (you'll need to replace this with your actual CSV parsing)
  return [
    { email: 'newuser@example.com', username: 'New User' },
    { email: 'anotheruser@example.com', username: 'Another User' }
  ];
}

// Example password generator
function generatePassword(): string {
  return Math.random().toString(36).slice(-8);  // Random 8-character password
}

// Function to verify if email domain exists
async function verifyEmailDomain(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    // Check if domain has MX records
    const mxRecords = await dnsResolveMx(domain);
    return mxRecords.length > 0;
  } catch (error) {
    console.error('Domain verification failed:', error);
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
      // Create a new instance of Imap with the provided config
      // @ts-ignore - Ignoring constructor type error as it should work at runtime
      const imap = new Imap(imapConfig);
      
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err: any, box: any) => {
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
          
          imap.search(searchCriteria, (err: any, results: any) => {
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
            
            f.on('message', (msg: any, seqno: any) => {
              msg.on('body', (stream: any, info: any) => {
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
      
      imap.once('error', (err: any) => {
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

export const sendPasswordEmail = async (toEmail: string, password: string): Promise<{ 
  success: boolean; 
  error?: string;
  messageId?: string;
  alreadySent?: boolean;  // Add this flag to indicate already sent status
}> => {
  try {
    // Check if this email has previously bounced
    if (failedEmails.has(toEmail)) {
      console.log('Email was previously marked as bounced:', toEmail);
      return { 
        success: false, 
        error: `Email address ${toEmail} previously failed delivery` 
      };
    }

    // First verify if the email domain exists
    const isValidDomain = await verifyEmailDomain(toEmail);
    if (!isValidDomain) {
      console.error('Invalid email domain:', toEmail);
      return { 
        success: false, 
        error: 'Invalid email domain or domain does not accept emails' 
      };
    }

    // Extract username from email for personalization
    const username = toEmail.split('@')[0];
    
    // Check if email has already been sent
    if (sentEmails.has(toEmail)) {
      console.log(`Email already sent to: ${toEmail}`);
      return { 
        success: false, 
        error: "Email already sent to this address",
        alreadySent: true  // Set flag for UI to display "Already Sent" instead of "Failed"
      };
    }

    // Validate email format
    if (!validateEmail(toEmail)) {
      console.error(`Invalid email format: ${toEmail}`);
      return { 
        success: false, 
        error: "Invalid email format" 
      };
    }

    // Verify SMTP connection
    await transporter.verify();

    const mailOptions = {
      from: {
        name: 'AriaDocs Admin',
        address: 'kssinchana715@gmail.com'
      },
      to: toEmail,
      subject: 'Your Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Temporary Password</h2>
          <p>Here is your temporary password: <strong>${password}</strong></p>
          <p>Please change this password when you first log in.</p>
          <p style="color: #666; font-size: 0.9em;">For security reasons, please change this password immediately after logging in.</p>
        </div>
      `,
      headers: {
        'priority': 'high',
        'x-priority': '1',
        'x-msmail-priority': 'High',
        'importance': 'high',
        'List-Unsubscribe': '<mailto:kssinchana715@gmail.com?subject=unsubscribe>',
        'Precedence': 'bulk'
      }
    };

    // Create a Promise that will handle both immediate and delayed responses
    const sendMailPromise = new Promise<SentMessageInfo>((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Send error:', err);
          reject(err);
          return;
        }

        // Log complete response for debugging
        console.log('SMTP response for', toEmail, ':', {
          response: info.response,
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
        });

        // Check for immediate rejection signs
        if (info.rejected?.length > 0) {
          reject(new Error(`Delivery immediately rejected: ${info.response}`));
          return;
        }

        // If we have accepted recipients, consider it tentatively successful
        if (info.accepted?.length > 0) {
          resolve(info);
        } else {
          reject(new Error('No recipients were accepted'));
        }
      });
    });

    try {
      const info = await sendMailPromise;
      
      // Mark email as sent
      sentEmails.add(toEmail);
      saveSentEmails();
      
      // Force a check for new bounces if this is a potentially problematic domain
      if (toEmail.includes('kriyatus.in') || !toEmail.includes('gmail.com')) {
        await checkBouncedEmails();
        
        // Check if our email was found in the bounce messages
        if (failedEmails.has(toEmail)) {
          return {
            success: false,
            error: `Email address ${toEmail} was detected as invalid in bounce messages`,
            messageId: info.messageId
          };
        }
      }

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to deliver email to ${toEmail}: ${errorMessage}`
      };
    }

  } catch (error) {
    console.error('Error in email sending process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      error: `Failed to send email to ${toEmail}: ${errorMessage}`
    };
  }
};

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

/**
 * Reset sent emails tracking to allow resending emails
 * @param specificEmail Optional email to remove from tracking. If not provided, all tracking is reset.
 * @returns Success status of the reset operation
 */
export const resetSentEmailsTracking = async (specificEmail?: string): Promise<boolean> => {
  try {
    if (specificEmail) {
      // Remove just one specific email from tracking
      sentEmails.delete(specificEmail);
      console.log(`Removed ${specificEmail} from sent emails tracking`);
    } else {
      // Reset all tracking
      sentEmails = new Set<string>();
      console.log('Reset all sent emails tracking');
    }
    
    // Save updated tracking to file
    saveSentEmails();
    return true;
  } catch (error) {
    console.error('Error resetting sent emails tracking:', error);
    return false;
  }
};

/**
 * Remove deleted email addresses from tracking
 * This should be called when users are deleted to ensure they can receive emails if re-added
 * @param deletedEmails Array of email addresses that were deleted
 * @returns Success status
 */
export const removeDeletedEmailsFromTracking = async (deletedEmails: string[]): Promise<boolean> => {
  try {
    let removedCount = 0;
    
    // Remove each deleted email from tracking
    for (const email of deletedEmails) {
      if (sentEmails.has(email)) {
        sentEmails.delete(email);
        removedCount++;
      }
      
      // Also remove from failed emails if present
      if (failedEmails.has(email)) {
        failedEmails.delete(email);
      }
    }
    
    // Save changes if any emails were removed
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} deleted emails from tracking`);
      saveSentEmails();
    }
    
    return true;
  } catch (error) {
    console.error('Error removing deleted emails from tracking:', error);
    return false;
  }
};

