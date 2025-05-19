"use client";

import { ModeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { SheetLeftbar } from "./leftbar";
import AlgoliaSearch from "./algolia-search";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "./logo";
import { AlgoliaProps } from "@/types/algolia";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

// Validate environment variables at startup
const algolia_props: AlgoliaProps = {
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "",
  indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "",
  apiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY ?? "",
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check login status
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
      const email = localStorage.getItem('userEmail');
      setIsLoggedIn(loginStatus);
      setUserEmail(email);
    };

    // Check initially
    checkLoginStatus();

    // Add event listener for storage changes
    window.addEventListener('storage', checkLoginStatus);

    // Check every 1 second for changes
    const interval = setInterval(checkLoginStatus, 1000);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserEmail(null);
    router.push('/');
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

        <div className="flex items-center gap-4">
          <AlgoliaSearch {...algolia_props} />

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {userEmail === 'kssinchana715@gmail.com' && pathname === '/' && (
                <Link
                  href="/send-passwords"
                  className={buttonVariants({
                    variant: "outline",
                    size: "default",
                  })}
                >
                  Send Passwords
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
              <button 
                onClick={handleLogout} 
                className={buttonVariants({
                  variant: "destructive",
                  size: "default",
                })}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button 
                className={buttonVariants({
                  size: "default",
                })}
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
