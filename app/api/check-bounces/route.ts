import { NextResponse } from 'next/server';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';
import supabase from '@/lib/supabase';

// Define type for email record
type EmailRecord = {
  email: string;
  message_id: string;
};

// IMAP client configuration
const imapConfig = {
  user: 'kssinchana715@gmail.com',
  password: 'wxey mngw cnwa lcso', // App password
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

export async function GET() {
  try {
    // Get all message IDs from the database
    const { data: sentEmails } = await supabase
      .from('docs')
      .select('email, message_id')
      .eq('email_sent', true)
      .not('message_id', 'is', null);

    // Initialize set for bounced emails
    const bouncedEmails = new Set<string>();

    // Check inbox for bounce messages
    await new Promise<void>((resolve) => {
      const imap = new Imap(imapConfig);
      
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            imap.end();
            resolve();
            return;
          }
          
          // Search for bounce messages from Mail Delivery Subsystem (last 24 hours)
          const searchCriteria = [
            ['FROM', 'Mail Delivery Subsystem'], 
            ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
          ];
          
          imap.search(searchCriteria, (err, results) => {
            if (err) {
              console.error('Error searching emails:', err);
              imap.end();
              resolve();
              return;
            }
            
            if (results.length === 0) {
              console.log('No bounce messages found');
              imap.end();
              resolve();
              return;
            }
            
            let processed = 0;
            
            const f = imap.fetch(results, { bodies: '' });
            
            f.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                // Convert node stream to readable stream
                const readableStream = stream as unknown as Readable;
                
                simpleParser(readableStream)
                  .then((parsed) => {
                    const subject = parsed.subject || '';
                    const text = parsed.text || '';
                    
                    // Check if it's a delivery status notification with 550 error
                    if ((subject.includes('Delivery Status Notification') || 
                         subject.includes('Mail delivery failed')) && 
                        (text.includes('550') || text.includes('User unknown'))) {
                      
                      // Extract email addresses from the message
                      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                      const emailMatches = text.match(emailRegex);
                      
                      if (emailMatches) {
                        for (const email of emailMatches) {
                          // Skip the admin email and focus on real recipients
                          if (email !== 'kssinchana715@gmail.com') {
                            // Check if this is one of our sent emails
                            const typedEmails = sentEmails as EmailRecord[] || [];
                            const sentEmail = typedEmails.find(e => e.email.toLowerCase() === email.toLowerCase());
                            if (sentEmail) {
                              console.log('Found bounced email:', email);
                              bouncedEmails.add(email);
                            }
                          }
                        }
                      }
                    }
                    
                    processed++;
                    if (processed === results.length) {
                      imap.end();
                      resolve();
                    }
                  })
                  .catch(err => {
                    console.error('Error parsing message:', err);
                    processed++;
                    if (processed === results.length) {
                      imap.end();
                      resolve();
                    }
                  });
              });
            });
            
            f.once('error', (err) => {
              console.error('Fetch error:', err);
              imap.end();
              resolve();
            });
            
            f.once('end', () => {
              console.log('Finished processing messages');
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        resolve();
      });
      
      imap.once('end', () => {
        console.log('IMAP connection ended');
      });
      
      imap.connect();
    });

    console.log('Found bounced emails:', Array.from(bouncedEmails));
    
    // Return the list of bounced emails
    return NextResponse.json({ 
      bouncedEmails: Array.from(bouncedEmails),
      success: true 
    });
    
  } catch (error) {
    console.error('Error in check-bounces API:', error);
    return NextResponse.json({ 
      error: 'Failed to check bounced emails', 
      success: false 
    }, { status: 500 });
  }
}