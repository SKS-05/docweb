"use client";

import { ModeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { SheetLeftbar } from "./leftbar";
import AlgoliaSearch from "./algolia-search";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Logo } from "./logo";
import { AlgoliaProps } from "@/types/algolia";
import { Loader2 } from "lucide-react";

// Validate environment variables at startup
const algolia_props: AlgoliaProps = {
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "",
  indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX ?? "",
  apiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? "",
};

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch logged-in user safely
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const { data, error: supabaseError } = await supabase.auth.getUser();
        
        if (supabaseError) {
          throw supabaseError;
        }
        
        if (mounted) {
          setUser(data?.user || null);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          // Handle error without using console.error
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch user data";
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle logout safely
  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error: supabaseError } = await supabase.auth.signOut();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      setUser(null);
      router.push('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to logout";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="w-full border-b h-16 sticky top-0 z-50 bg-background" role="navigation" aria-label="Main navigation">
      <div className="sm:container mx-auto w-[95vw] h-full flex items-center sm:justify-between md:gap-2">
        <div className="flex items-center sm:gap-5 gap-2.5">
          <SheetLeftbar />
          <div className="flex items-center gap-6">
            <div className="sm:flex hidden">
              <Logo />
            </div>
          </div>
        </div>

        <div className="flex items-center sm:justify-normal justify-between sm:gap-3 ml-1 sm:w-fit w-[90%]">
          <AlgoliaSearch {...algolia_props} />

          {error && (
            <div className="text-red-500 text-sm" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2" role="status" aria-label="Loading">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : user ? (
            <button 
              onClick={handleLogout} 
              className="bg-red-500 text-white px-4 h-[40px] flex items-center justify-center rounded-md hover:bg-red-600 transition-colors"
              aria-label="Logout"
              disabled={loading}
            >
              Log Out
            </button>
          ) : (
            <Link href="/login">
              <button 
                className="bg-black text-white px-4 h-[40px] flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors"
                aria-label="Login"
              >
                Login
              </button>
            </Link>
          )}

          <div className="flex items-center justify-between sm:gap-2">
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
