'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { PasswordInput } from '@/components/ui/password-input';

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');

    if (!isLoggedIn || !userEmail) {
      router.push('/login');
      return;
    }

    // Check if user exists in docs table
    const checkUser = async () => {
      const { data: docUser, error: docError } = await supabase
        .from('docs')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (docError || !docUser) {
        router.push('/login');
        return;
      }
    };

    checkUser();
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setError("User not found");
        setLoading(false);
        return;
      }

      // Update password in docs table
      const { error: updateError } = await supabase
        .from('docs')
        .update({ 
          password: password,
          first_login: false 
        })
        .eq('email', userEmail);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Clear login state and redirect to login
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      router.push('/login');
    } catch (_err) {
      setError('An error occurred while changing password');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border w-96 text-foreground">
        <h2 className="text-2xl font-bold text-foreground text-center mb-6">
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="mt-6 flex flex-col gap-4">
          <div>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="New Password"
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirm New Password"
              placeholder="Confirm new password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
} 