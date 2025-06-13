'use server';

import nodemailer from 'nodemailer';
import { validateEmail } from './validation';
import dns from 'dns';
import { promisify } from 'util';
import type { SentMessageInfo } from 'nodemailer';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';
import fs from 'fs';

const dnsResolveMx = promisify(dns.resolveMx);

const adminEmail = process.env.GMAIL_USER;
const adminPassword = process.env.GMAIL_APP_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
}

let sentEmails = new Set<string>();

const loadSentEmails = () => {
  try {
    const data = fs.readFileSync('sentEmails.json', 'utf8');
    const parsedData = JSON.parse(data);
    sentEmails = new Set(parsedData);
  } catch {
    console.log('No previous sent emails found, starting fresh.');
  }
};

const saveSentEmails = () => {
  try {
    fs.writeFileSync('sentEmails.json', JSON.stringify(Array.from(sentEmails), null, 2));
  } catch {
    console.error('Error saving sent emails');
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: adminEmail,
    pass: adminPassword
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  debug: true,
  logger: true,
  verify: true as unknown as { (callback: (err: Error | null, success: true) => void): void; (): Promise<true>; },
  headers: {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High'
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection error:', error.message);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

async function verifyEmailDomain(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    if (!domain) {
      console.warn(`verifyEmailDomain: No domain found for email: ${email}`);
      return false;
    }
    const mxRecords = await dnsResolveMx(domain);
    if (mxRecords.length === 0) {
      console.warn(`verifyEmailDomain: No MX records found for domain: ${domain}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('verifyEmailDomain: Error verifying domain for', email, ':', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
}

loadSentEmails();

const imapConfig = {
  user: 'kssinchana715@gmail.com',
  password: 'wxey mngw cnwa lcso',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const failedEmails = new Set<string>();

async function checkBouncedEmails(): Promise<Set<string>> {
  return new Promise((resolve) => {
    try {
      // @ts-expect-error - Imap constructor type issue
      const imap = new Imap(imapConfig);
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err: unknown) => {
          if (err) {
            console.error('checkBouncedEmails: Error opening inbox:', err instanceof Error ? err.message : 'Unknown error');
            imap.end();
            resolve(failedEmails);
            return;
          }
          const searchCriteria = [
            ['FROM', 'Mail Delivery Subsystem'],
            ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
          ];
          imap.search(searchCriteria, (err: unknown, results: unknown) => {
            if (err) {
              console.error('Error searching emails:', err);
              imap.end();
              resolve(failedEmails);
              return;
            }
            if ((results as number[]).length === 0) {
              console.log('No bounce messages found');
              imap.end();
              resolve(failedEmails);
              return;
            }
            const f = imap.fetch(results, { bodies: '' });
            f.on('message', (msg: Imap.ImapMessage) => {
              msg.on('body', (stream: unknown) => {
                const readableStream = stream as unknown as Readable;
                simpleParser(readableStream)
                  .then((parsed) => {
                    const subject = parsed.subject || '';
                    const text = parsed.text || '';
                    if ((subject.includes('Delivery Status Notification') || subject.includes('Mail delivery failed')) &&
                      text.includes('550')) {
                      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g);
                      if (emailMatches) {
                        emailMatches.forEach(email => {
                          if (email !== imapConfig.user) {
                            console.log('checkBouncedEmails: Found bounced email:', email);
                            failedEmails.add(email);
                          }
                        });
                      }
                    }
                  })
                  .catch((parseErr) => {
                    console.error('checkBouncedEmails: Error parsing message:', parseErr instanceof Error ? parseErr.message : 'Unknown error');
                  });
              });
            });
            f.once('end', () => {
              console.log('checkBouncedEmails: Finished checking bounce messages, found', failedEmails.size, 'failed emails');
              imap.end();
              resolve(failedEmails);
            });
          });
        });
      });
      imap.once('error', (imapErr: unknown) => {
        console.error('checkBouncedEmails: IMAP error:', imapErr instanceof Error ? imapErr.message : 'Unknown error');
        resolve(failedEmails);
      });
      imap.connect();
    } catch (err) {
      console.error('checkBouncedEmails: Error in main try block:', err instanceof Error ? err.message : 'Unknown error');
      resolve(failedEmails);
    }
  });
}

checkBouncedEmails().then(failed => {
  console.log('Initial bounce check found', failed.size, 'failed emails');
});

setInterval(async () => {
  await checkBouncedEmails();
  console.log('Scheduled bounce check found', failedEmails.size, 'failed emails');
}, 5 * 60 * 1000);

export const sendPasswordEmail = async (toEmail: string, password: string): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
  alreadySent?: boolean;
}> => {
  try {
    if (failedEmails.has(toEmail)) {
      console.log('Email was previously marked as bounced:', toEmail);
      return {
        success: false,
        error: `Email address ${toEmail} previously failed delivery`
      };
    }

    const isValidDomain = await verifyEmailDomain(toEmail);
    if (!isValidDomain) {
      console.error('sendPasswordEmail: Invalid email domain or domain does not accept emails:', toEmail);
      return {
        success: false,
        error: 'Invalid email domain or domain does not accept emails'
      };
    }

    if (sentEmails.has(toEmail)) {
      console.log(`Email already sent to: ${toEmail}`);
      return {
        success: false,
        error: "Email already sent to this address",
        alreadySent: true
      };
    }

    if (!validateEmail(toEmail)) {
      console.error(`Invalid email format: ${toEmail}`);
      return {
        success: false,
        error: "Invalid email format"
      };
    }

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

    const sendMailPromise = new Promise<SentMessageInfo>((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('sendPasswordEmail: Send error for', toEmail, ':', err.message);
          reject(err);
          return;
        }

        console.log('SMTP response for', toEmail, ':', {
          response: info.response,
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
        });

        if (info.rejected?.length > 0) {
          reject(new Error(`Delivery immediately rejected for ${toEmail}: ${info.response}`));
          return;
        }

        if (info.accepted?.length > 0) {
          resolve(info);
        } else {
          reject(new Error(`No recipients were accepted for ${toEmail}`));
        }
      });
    });

    try {
      const info = await sendMailPromise;

      sentEmails.add(toEmail);
      saveSentEmails();

      if (toEmail.includes('kriyatus.in') || !toEmail.includes('gmail.com')) {
        await checkBouncedEmails();

        if (failedEmails.has(toEmail)) {
          console.error('sendPasswordEmail: Email address was detected as invalid in bounce messages after sending:', toEmail);
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
    } catch (sendError) {
      console.error('sendPasswordEmail: Failed to deliver email to', toEmail, ':', sendError instanceof Error ? sendError.message : 'Unknown error');
      return {
        success: false,
        error: `Failed to deliver email to ${toEmail}`
      };
    }

  } catch (outerErr) {
    console.error('sendPasswordEmail: Top-level error in email sending process for', toEmail, ':', outerErr instanceof Error ? outerErr.message : 'Unknown error');
    return {
      success: false,
      error: `Failed to send email to ${toEmail}`
    };
  }
};

export const checkIfEmailBounced = async (email: string): Promise<boolean> => {
  if (failedEmails.has(email)) {
    return true;
  }

  await checkBouncedEmails();
  return failedEmails.has(email);
};

export const resetSentEmailsTracking = async (specificEmail?: string): Promise<boolean> => {
  try {
    if (specificEmail) {
      sentEmails.delete(specificEmail);
      console.log(`resetSentEmailsTracking: Removed ${specificEmail} from sent emails tracking`);
    } else {
      sentEmails = new Set<string>();
      console.log('resetSentEmailsTracking: Reset all sent emails tracking');
    }

    saveSentEmails();
    return true;
  } catch (err) {
    console.error('resetSentEmailsTracking: Error resetting sent emails tracking:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
};

export const removeDeletedEmailsFromTracking = async (deletedEmails: string[]): Promise<boolean> => {
  try {
    let removedCount = 0;

    for (const email of deletedEmails) {
      if (sentEmails.has(email)) {
        sentEmails.delete(email);
        removedCount++;
      }
      if (failedEmails.has(email)) {
        failedEmails.delete(email);
      }
    }

    if (removedCount > 0) {
      console.log(`removeDeletedEmailsFromTracking: Removed ${removedCount} deleted emails from tracking`);
      saveSentEmails();
    }

    return true;
  } catch (err) {
    console.error('removeDeletedEmailsFromTracking: Error removing deleted emails from tracking:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
};