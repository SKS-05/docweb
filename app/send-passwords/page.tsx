'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { sendPasswordEmail } from '@/lib/email';
import { CSVUpload } from '@/components/ui/csv-upload';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown, ArrowUpDown, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Define types for our data
type User = {
  email: string;
  password: string;
  first_login: boolean;
  email_sent?: boolean;  // Add this field to track email status
};

// Admin email constant
const ADMIN_EMAIL = 'kssinchana715@gmail.com';

type FilterOption = 'firstlogin' | 'active' | 'all';
type EmailFilterOption = 'already_sent' | 'sent' | 'failed' | 'all';

export default function SendPasswordsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{[key: string]: 'sent' | 'already_sent' | 'failed'}>({});
  const [importLoading, setImportLoading] = useState(false);
  const [uploadedEmails, setUploadedEmails] = useState<string[]>([]);
  const [filterOption, setFilterOption] = useState<FilterOption>('firstlogin');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [emailFilterOption, setEmailFilterOption] = useState<EmailFilterOption>('all');
  const [isEmailFilterOpen, setIsEmailFilterOpen] = useState(false);
  const [shouldResetUpload, setShouldResetUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hasImportedUsers, setHasImportedUsers] = useState(false);
  const [failedMessages, setFailedMessages] = useState<string[]>([]);
  const [checkingBounces, setCheckingBounces] = useState(false);

  // Helper derived state
  const failedEmailsCount = Object.entries(emailStatus).filter(([_, status]) => status === 'failed').length;

  // Add useEffect to auto-dismiss messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    const checkAuthAndFetchUsers = async () => {
      try {
        // Check if user is logged in and is admin
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userEmail = localStorage.getItem('userEmail');

        if (!isLoggedIn || userEmail !== ADMIN_EMAIL) {
          console.error('Not authenticated or not admin');
          router.push('/login');
          return;
        }

        // Check if user exists in docs table
        const { data: docUser, error: docError } = await supabase
          .from('docs')
          .select('*')
          .eq('email', ADMIN_EMAIL)
          .single();

        if (docError || !docUser) {
          console.error('Admin user not found:', docError);
          router.push('/login');
          return;
        }

        setIsAdmin(true);
        await fetchUsers();
      } catch (err) {
        console.error('Error in checkAuthAndFetchUsers:', err);
        setError('An error occurred: ' + (err instanceof Error ? err.message : 'Unknown error'));
        router.push('/login');
      }
    };

    checkAuthAndFetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    const { data: users, error: dbError } = await supabase
      .from('docs')
      .select('email, password, first_login, email_sent')  // Add email_sent to the select
      .returns<User[]>();

    if (dbError) {
      console.error('Error fetching users:', dbError);
      setError('Error fetching users: ' + dbError.message);
      return;
    }

    if (users) {
      setUsers(users);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  // Add useEffect to reset hasImportedUsers when upload is canceled
  useEffect(() => {
    if (uploadedEmails.length === 0) {
      setHasImportedUsers(false);
    }
  }, [uploadedEmails.length]);

  const handleCSVUpload = async (emails: string[]) => {
    setImportLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get all existing users
      const { data: existingUsers } = await supabase
        .from('docs')
        .select('email')
        .in('email', emails.map(email => email.toLowerCase()));

      // Fix type error and filter out existing emails
      const existingEmails = new Set(
        (existingUsers || []).map(user => (user as { email: string }).email.toLowerCase())
      );
      
      const newEmails = emails.filter(email => 
        !existingEmails.has(email.toLowerCase()) && 
        email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
      );

      if (newEmails.length === 0) {
        setSuccess('No new email addresses to add.');
        setImportLoading(false);
        return;
      }

      // Store uploaded emails for potential cancellation
      setUploadedEmails(newEmails);
      setHasImportedUsers(true);

      // Add new users with generated passwords but don't send emails
      const newUsers = newEmails.map(email => ({
        email,
        password: '', // Leave password empty until Generate & Send is clicked
        first_login: true,
        email_sent: false
      }));

      // Insert new users into the database
      const { error: insertError } = await supabase
        .from('docs')
        .insert(newUsers);

      if (insertError) {
        setError('Error adding new users: ' + insertError.message);
        setImportLoading(false);
        return;
      }

      // Refresh user list
      await fetchUsers();

      setSuccess(`Successfully added ${newUsers.length} new users. Click "Generate & Send Passwords" to generate and send passwords.`);
    } catch (err) {
      setError('An error occurred while importing users: ' + 
        (err instanceof Error ? err.message : 'Unknown error')
      );
      setHasImportedUsers(false);
    } finally {
      setImportLoading(false);
    }
  };

  const handleCancelUpload = async () => {
    if (uploadedEmails.length > 0) {
      try {
        // Remove the uploaded users from the database
        const { error: deleteError } = await supabase
          .from('docs')
          .delete()
          .in('email', uploadedEmails);

        if (deleteError) {
          setError('Error removing uploaded users: ' + deleteError.message);
          return;
        }

        // Clear the uploaded emails
        setUploadedEmails([]);
        setHasImportedUsers(false);
        
        // Refresh the user list
        await fetchUsers();
        
        setSuccess('Successfully removed uploaded users.');
      } catch (err) {
        setError('An error occurred while removing users: ' + 
          (err instanceof Error ? err.message : 'Unknown error')
        );
      }
    }
  };

  const isValidEmail = (email: string) => {
    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.includes('.');
  };

  // Add a new useEffect to automatically check for bounced emails when the page loads
  useEffect(() => {
    if (isAdmin) {
      // Only run if admin is authenticated
      checkBouncedMessages();
    }
  }, [isAdmin]);

  // Check for bounced messages function
  const checkBouncedMessages = async () => {
    try {
      // Get all sent message IDs that might have failed
      const { data: sentMessages } = await supabase
        .from('docs')
        .select('email, message_id')
        .not('message_id', 'is', null);
      
      if (!sentMessages || sentMessages.length === 0) {
        return;
      }

      // Check for bounce notifications in admin inbox
      const response = await fetch('/api/check-bounces', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check bounced messages');
      }

      const { bouncedEmails } = await response.json();
      
      // Mark emails as failed in the UI
      if (bouncedEmails && bouncedEmails.length > 0) {
        const newEmailStatus = { ...emailStatus };
        
        for (const email of bouncedEmails) {
          console.log('Marking as failed:', email);
          newEmailStatus[email] = 'failed';
          
          // Also update the database
          await supabase
            .from('docs')
            .update({ 
              email_sent: false,
              email_sending: null
            })
            .eq('email', email);
        }
        
        setEmailStatus(newEmailStatus);
        setSuccess(`Found ${bouncedEmails.length} bounced emails and marked them as failed.`);
        
        // Refresh users
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error checking bounced messages:', error);
    }
  };

  // Modify the sendPasswords function to also check for bounces before starting
  const sendPasswords = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEmailStatus({});

    try {
      // Check for bounces first to ensure we have the latest status
      await checkBouncedMessages();

      // Check if still logged in and is admin
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const userEmail = localStorage.getItem('userEmail');

      if (!isLoggedIn || userEmail !== ADMIN_EMAIL) {
        setError('Unauthorized. Please log in again.');
        router.push('/login');
        return;
      }

      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;
      let invalidEmailCount = 0;

      // Get fresh user data to ensure we have the latest email_sent status
      const { data: currentUsers, error: fetchError } = await supabase
        .from('docs')
        .select('email, password, first_login, email_sent')
        .returns<User[]>();

      if (fetchError) {
        throw new Error('Failed to fetch current user data');
      }

      for (const user of currentUsers || []) {
        // Skip admin user
        if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) continue;

        // Validate email format
        if (!isValidEmail(user.email)) {
          console.error(`Invalid email format: ${user.email}`);
          invalidEmailCount++;
          setEmailStatus(prev => ({ ...prev, [user.email]: 'failed' }));
          continue;
        }

        // CRITICAL CHECK: Get the very latest status from database to prevent duplicate sends
        const { data: latestStatus } = await supabase
          .from('docs')
          .select('email_sent, email_sending')
          .eq('email', user.email)
          .single();
        
        // Skip if email was already sent OR is currently being sent
        if (latestStatus?.email_sent === true || latestStatus?.email_sending === true) {
          console.log(`Skipping ${user.email} - email already sent or in progress`);
          skippedCount++;
          setEmailStatus(prev => ({ ...prev, [user.email]: 'already_sent' }));
          continue;
        }

        // Set a lock before sending email - use a transaction if possible for better atomicity
        const { error: lockError } = await supabase
          .from('docs')
          .update({ email_sending: true })
          .eq('email', user.email)
          .is('email_sending', null)
          .is('email_sent', false); // Only try to send to emails that are explicitly marked as not sent

        // If we couldn't set the lock, skip this user
        if (lockError) {
          console.log(`Skipping ${user.email} - couldn't acquire lock, may be concurrent send attempt`);
          skippedCount++;
          continue;
        }

        try {
          // Generate a random password
          const newPassword = generateRandomPassword();
          
          // Update password in docs table
          const { error: updateError } = await supabase
            .from('docs')
            .update({ 
              password: newPassword,
              first_login: true 
            })
            .eq('email', user.email);

          if (updateError) {
            console.error(`Error updating password for ${user.email}:`, updateError);
            failureCount++;
            setEmailStatus(prev => ({ ...prev, [user.email]: 'failed' }));
            
            // Release the lock since we failed
            await supabase
              .from('docs')
              .update({ email_sending: null })
              .eq('email', user.email);
            
            continue;
          }

          // Send email with new password
          const { success, error: emailError, messageId } = await sendPasswordEmail(user.email, newPassword);
          
          if (success) {
            // Store the messageId for tracking and mark as sent
            await supabase
              .from('docs')
              .update({ 
                email_sent: true,
                email_sending: null,
                message_id: messageId // Store message ID for tracking
              })
              .eq('email', user.email);

            successCount++;
            setEmailStatus(prev => ({ ...prev, [user.email]: 'sent' }));
          } else {
            failureCount++;
            setEmailStatus(prev => ({ ...prev, [user.email]: 'failed' }));
            
            // Log the specific error
            console.error(`Failed to send email to ${user.email}:`, emailError);
            
            // Revert the password update and remove lock since email failed
            await supabase
              .from('docs')
              .update({ 
                password: user.password,
                first_login: user.first_login,
                email_sending: null,
                email_sent: false // Ensure it's marked as not sent
              })
              .eq('email', user.email);
          }
        } catch (error) {
          // Remove lock in case of any error
          await supabase
            .from('docs')
            .update({ email_sending: null })
            .eq('email', user.email);
          
          failureCount++;
          setEmailStatus(prev => ({ ...prev, [user.email]: 'failed' }));
        }
      }

      // Refresh the user list to get updated statuses
      await fetchUsers();

      // After successful sending, reset the upload state
      setShouldResetUpload(true);
      setUploadedEmails([]);
      
      // Update success message to include all counts
      let message = [];
      if (successCount > 0) {
        message.push(`Successfully sent passwords to ${successCount} users`);
      }
      if (skippedCount > 0) {
        message.push(`Skipped ${skippedCount} users who already received emails`);
      }
      if (failureCount > 0) {
        message.push(`Failed to send emails to ${failureCount} users`);
      }
      if (invalidEmailCount > 0) {
        message.push(`${invalidEmailCount} invalid email addresses found`);
      }
      
      if (message.length > 0) {
        setSuccess(message.join('. '));
      } else {
        setError('No emails were processed.');
      }

      // Check for bounces again after sending to catch any new bounces
      setTimeout(checkBouncedMessages, 10000); // Check for bounces 10 seconds after sending
      
    } catch (err) {
      console.error('Error in sendPasswords:', err);
      setError('An error occurred while sending passwords: ' + 
        (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
      // Reset the shouldResetUpload flag after a short delay
      setTimeout(() => {
        setShouldResetUpload(false);
      }, 100);
    }
  };

  // Also modify handleResendEmails to check for bounces
  const handleResendEmails = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEmailStatus({});

    try {
      // Check for bounces first
      await checkBouncedMessages();
      
      let successCount = 0;
      let failureCount = 0;

      for (const email of selectedUsers) {
        const user = users.find(u => u.email === email);
        if (!user) continue;

        // Set a lock before sending email
        const { error: lockError } = await supabase
          .from('docs')
          .update({ email_sending: true })
          .eq('email', email)
          .is('email_sending', null);

        if (lockError) {
          console.error(`Skipping ${email} - concurrent send attempt`);
          continue;
        }

        try {
          const newPassword = generateRandomPassword();
          
          // Update password in docs table
          const { error: updateError } = await supabase
            .from('docs')
            .update({ 
              password: newPassword,
              first_login: true,
              email_sent: false
            })
            .eq('email', email);

          if (updateError) {
            console.error(`Error updating password for ${email}:`, updateError);
            setEmailStatus(prev => ({ ...prev, [email]: 'failed' }));
            failureCount++;
            continue;
          }

          // Send email with new password
          const { success, error: emailError, messageId } = await sendPasswordEmail(email, newPassword);
          
          if (success) {
            await supabase
              .from('docs')
              .update({ 
                email_sent: true,
                email_sending: null,
                message_id: messageId // Store message ID for tracking
              })
              .eq('email', email);

            successCount++;
            setEmailStatus(prev => ({ ...prev, [email]: 'sent' }));
          } else {
            console.error(`Failed to send email to ${email}:`, emailError);
            setEmailStatus(prev => ({ ...prev, [email]: 'failed' }));
            failureCount++;
            
            // Revert password if email fails
            await supabase
              .from('docs')
              .update({ 
                password: user.password,
                first_login: user.first_login,
                email_sending: null
              })
              .eq('email', email);
          }
        } catch (error) {
          // Remove lock in case of any error
          await supabase
            .from('docs')
            .update({ email_sending: null })
            .eq('email', email);
          
          failureCount++;
          setEmailStatus(prev => ({ ...prev, [email]: 'failed' }));
        }
      }

      await fetchUsers();
      
      if (successCount > 0 && failureCount > 0) {
        setSuccess(`Successfully resent ${successCount} emails. ${failureCount} failed - you can retry failed emails.`);
      } else if (successCount > 0) {
        setSuccess(`Successfully resent ${successCount} emails.`);
      } else if (failureCount > 0) {
        setError(`Failed to send ${failureCount} emails. Please try again.`);
      }
      
      setSelectedUsers(new Set());
      
      // Check for bounces after sending
      setTimeout(checkBouncedMessages, 10000);
      
    } catch (err) {
      setError('An error occurred while resending emails: ' + 
        (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  const sortedAndFilteredUsers = users
    .filter(user => {
      // First apply search filter
      if (searchQuery) {
        const normalizedQuery = searchQuery.toLowerCase();
        const normalizedEmail = user.email.toLowerCase();
        if (!normalizedEmail.includes(normalizedQuery)) {
          return false;
        }
      }
      
      // Apply status filter
      let statusMatch = true;
      if (filterOption !== 'all') {
        if (filterOption === 'firstlogin' && !user.first_login) return false;
        if (filterOption === 'active' && user.first_login) return false;
      }

      // Apply email status filter
      let emailStatusMatch = true;
      if (emailFilterOption !== 'all') {
        const status = emailStatus[user.email];
        if (emailFilterOption === 'already_sent' && status !== 'already_sent') return false;
        if (emailFilterOption === 'sent' && status !== 'sent') return false;
        if (emailFilterOption === 'failed' && status !== 'failed') return false;
      }

      // Return true only if both conditions are met
      return statusMatch && emailStatusMatch;
    });

  // Add new handlers for selection
  const handleSelectUser = (email: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === sortedAndFilteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(sortedAndFilteredUsers.map(user => user.email)));
    }
  };

  const handleDeleteUsers = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('docs')
        .delete()
        .in('email', Array.from(selectedUsers));

      if (deleteError) {
        setError('Error deleting users: ' + deleteError.message);
        return;
      }

      await fetchUsers();
      setSuccess(`Successfully deleted ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('An error occurred while deleting users: ' + 
        (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  // Add useEffect to handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close filter dropdowns if clicking outside
      if (!target.closest('.status-filter-container')) {
        setIsFilterOpen(false);
      }
      if (!target.closest('.email-filter-container')) {
        setIsEmailFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add useEffect to reset deleteConfirmText when modal opens/closes
  useEffect(() => {
    setDeleteConfirmText('');
  }, [showDeleteConfirm]);

  // Show loading state while checking admin status
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          .alert-animate {
            animation: fadeOut 0.5s ease-out 2.5s forwards;
          }
        `}
      </style>
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Send Temporary Passwords
        </h1>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1 max-w-md">
            <CSVUpload 
              onFileUpload={handleCSVUpload} 
              onCancel={handleCancelUpload}
              isLoading={importLoading}
              shouldReset={shouldResetUpload}
            />
          </div>
          <button
            onClick={sendPasswords}
            disabled={loading || !hasImportedUsers || !users.some(user => !user.email_sent)}
            className="bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed h-10 whitespace-nowrap"
            title={!hasImportedUsers ? "Import users from CSV first" :
                   !users.some(user => !user.email_sent) ? "All users have already received emails" :
                   "Generate and send passwords to new users"}
          >
            {loading ? 'Processing...' : 'Generate & Send Passwords'}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Users ({sortedAndFilteredUsers.length})</h2>
              <div className="flex gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-muted-foreground">Active: {users.filter(u => !u.first_login).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                  <span className="text-muted-foreground">First Login: {users.filter(u => u.first_login).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  <span className="text-muted-foreground">Total: {users.length}</span>
                </div>
              </div>
            </div>
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 w-full"
              />
            </div>
          </div>

          {/* Selected users actions - Now positioned above the table */}
          {selectedUsers.size > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleResendEmails}
                    disabled={loading}
                    className="bg-background text-foreground border px-4 py-1.5 rounded text-sm hover:bg-muted disabled:opacity-50"
                  >
                    Resend Email
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setDeleteConfirmText(''); // Also clear here for extra safety
                    }}
                    className="bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:opacity-90"
                  >
                    Delete Users
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add helper text for failed emails */}
          {failedEmailsCount > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-sm">
                  {failedEmailsCount} email{failedEmailsCount !== 1 ? 's' : ''} failed to send. 
                  Select the failed emails and click "Resend Email" to try again.
                </span>
              </div>
            </div>
          )}

          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === sortedAndFilteredUsers.length && sortedAndFilteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <div className="relative status-filter-container">
                          <button
                            className="flex items-center gap-1 hover:opacity-80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFilterOpen(!isFilterOpen);
                              setIsEmailFilterOpen(false); // Close other dropdown
                            }}
                          >
                            <Filter className="w-3 h-3" />
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-1 w-36 rounded-md shadow-lg bg-popover border border-border z-50">
                              <div className="py-1">
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    filterOption === 'firstlogin' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterOption('firstlogin');
                                    setIsFilterOpen(false);
                                  }}
                                >
                                  First Login
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    filterOption === 'active' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterOption('active');
                                    setIsFilterOpen(false);
                                  }}
                                >
                                  Active Users
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    filterOption === 'all' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterOption('all');
                                    setIsFilterOpen(false);
                                  }}
                                >
                                  All Users
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Email Status</span>
                        <div className="relative email-filter-container">
                          <button
                            className="flex items-center gap-1 hover:opacity-80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEmailFilterOpen(!isEmailFilterOpen);
                              setIsFilterOpen(false); // Close other dropdown
                            }}
                          >
                            <Filter className="w-3 h-3" />
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {isEmailFilterOpen && (
                            <div className="absolute top-full right-0 mt-1 w-36 rounded-md shadow-lg bg-popover border border-border z-50">
                              <div className="py-1">
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    emailFilterOption === 'already_sent' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailFilterOption('already_sent');
                                    setIsEmailFilterOpen(false);
                                  }}
                                >
                                  Already Sent
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    emailFilterOption === 'sent' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailFilterOption('sent');
                                    setIsEmailFilterOpen(false);
                                  }}
                                >
                                  Email Sent
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    emailFilterOption === 'failed' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailFilterOption('failed');
                                    setIsEmailFilterOpen(false);
                                  }}
                                >
                                  Failed
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                                    emailFilterOption === 'all' ? 'bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailFilterOption('all');
                                    setIsEmailFilterOpen(false);
                                  }}
                                >
                                  All
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {sortedAndFilteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredUsers.map((user) => (
                      <tr key={user.email} className={selectedUsers.has(user.email) ? 'bg-primary/5' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.email)}
                            onChange={() => handleSelectUser(user.email)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.first_login ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.first_login ? 'First Login' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {emailStatus[user.email] && (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              emailStatus[user.email] === 'sent' 
                                ? 'bg-green-100 text-green-800'
                                : emailStatus[user.email] === 'already_sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {emailStatus[user.email] === 'sent' 
                                ? 'Email Sent' 
                                : emailStatus[user.email] === 'already_sent'
                                ? 'Already Sent'
                                : 'Failed to Send'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete {selectedUsers.size} selected user{selectedUsers.size !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Type <span className="font-medium text-foreground">Delete</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'Delete' here"
                className="w-full px-3 py-2 border rounded-md mb-4 bg-background text-foreground placeholder:text-muted-foreground"
                autoComplete="off"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 rounded bg-muted hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUsers}
                  disabled={deleteConfirmText !== 'Delete'}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">
          First import users via CSV, then click "Generate & Send Passwords" to send emails. 
          Users who have already received emails will be skipped.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 alert-animate">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 alert-animate">
            {success}
          </div>
        )}
      </div>
    </div>
  );
} 