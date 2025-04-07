'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { PasswordInput } from '@/components/ui/password-input';

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border w-96 text-foreground">
        <h2 className="text-2xl font-bold text-foreground text-center mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-4">
          <div>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="New Password"
              placeholder="Enter new password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          {message && (
            <p className="text-green-500 text-sm">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
} 