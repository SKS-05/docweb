'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/password-input';

// Admin email constant
const ADMIN_EMAIL = 'kssinchana715@gmail.com';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clear any existing login state
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');

      // Authenticate with Supabase Auth
      const { data: _authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // After successful auth, fetch user metadata from docs table
      const { data: docUser, error: docError } = await supabase
        .from('docs')
        .select('first_login') // Only select first_login if that's all you need
        .eq('email', email)
        .single();

      if (docError || !docUser) {
        // This case might happen if a user is in auth.users but not in docs table
        // Consider handling this by creating an entry in docs table if necessary.
        console.error('User metadata not found in docs table:', docError?.message);
        // For now, proceed with general login, but this indicates a data inconsistency.
      }

      // Store login state in localStorage and cookie
      localStorage.setItem('userEmail', email);
      localStorage.setItem('isLoggedIn', 'true');
      document.cookie = 'isLoggedIn=true; path=/';
      
      // Redirect based on user type and first_login status
      if (email === ADMIN_EMAIL) {
        router.push('/send-passwords');
      } else if (docUser?.first_login) {
        router.push('/change-password');
      } else {
        router.push('/');
      }

    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border w-96">
        <h1 className="text-2xl font-bold text-foreground text-center mb-6">
          Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              required
            />
          </div>

          <div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
} 