'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { sendPasswordEmail } from '@/lib/email';

// Define types for our data
type User = {
  email: string;
  password: string;
  first_login: boolean;
};

// Admin email constant
const ADMIN_EMAIL = 'kssinchana715@gmail.com';

export default function SendPasswordsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{[key: string]: boolean}>({});

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

        // Now fetch users from the docs table
        const { data: users, error: dbError } = await supabase
          .from('docs')
          .select('email, password, first_login')
          .returns<User[]>();

        if (dbError) {
          console.error('Error fetching users:', dbError);
          setError('Error fetching users: ' + dbError.message);
          return;
        }

        if (users) {
          setUsers(users);
        }
      } catch (err) {
        console.error('Error in checkAuthAndFetchUsers:', err);
        setError('An error occurred: ' + (err instanceof Error ? err.message : 'Unknown error'));
        router.push('/login');
      }
    };

    checkAuthAndFetchUsers();
  }, [router]);

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

  const sendPasswords = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEmailStatus({});

    try {
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

      for (const user of users) {
        // Skip admin user
        if (user.email === ADMIN_EMAIL) continue;

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
          setEmailStatus(prev => ({ ...prev, [user.email]: false }));
          continue;
        }

        // Send email with new password
        const { success } = await sendPasswordEmail(user.email, newPassword);
        
        if (success) {
          successCount++;
          setEmailStatus(prev => ({ ...prev, [user.email]: true }));
        } else {
          failureCount++;
          setEmailStatus(prev => ({ ...prev, [user.email]: false }));
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully updated and sent passwords to ${successCount} users.${
          failureCount > 0 ? ` Failed for ${failureCount} users.` : ''
        }`);
      } else if (failureCount > 0) {
        setError(`Failed to update passwords for ${failureCount} users.`);
      }
    } catch (err) {
      console.error('Error in sendPasswords:', err);
      setError('An error occurred while updating passwords: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Send Temporary Passwords
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          This action will generate new temporary passwords for all users in the system (except admin). 
          Users will receive an email with their new password and will be required to change it upon first login.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Users ({users.length})</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.email}>
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
                      {emailStatus[user.email] !== undefined && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          emailStatus[user.email] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {emailStatus[user.email] ? 'Email Sent' : 'Failed to Send'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={sendPasswords}
          disabled={loading || users.length === 0}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating and Sending...' : 'Generate and Send New Passwords'}
        </button>
      </div>
    </div>
  );
} 