import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!router.isReady) return; // ✅ Prevents errors
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error fetching user:", error);
      
      setUser(data?.user || null);
      setLoading(false);

      if (!data?.user) router.push("/login"); // ✅ Redirect only if no user
    };

    fetchUser();
  }, [router.isReady]);

  return (
    <div className="flex items-center justify-center h-screen">
      {loading ? (
        <p className="text-lg">Loading...</p>
      ) : user ? (
        <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
      ) : null}
    </div>
  );
}
