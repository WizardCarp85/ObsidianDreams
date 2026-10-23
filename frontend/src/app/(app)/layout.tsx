"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, MobileTabBar } from "@/components/Navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function initAuth() {
      // If returning with an email confirmation / magic link code in URL, exchange it first
      const search = typeof window !== "undefined" ? window.location.search : "";
      const code = new URLSearchParams(search).get("code");
      if (code && supabase) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        } catch (err) {
          console.warn("Could not exchange code:", err);
        }
      }

      const res = await supabase.auth.getSession();
      if (!res.data.session) {
        router.push("/sign-in");
      } else {
        setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      if (!session) {
        router.push("/sign-in");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm" style={{ color: "#7781ac" }}>
            Loading journal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <MobileTabBar />
      <main className="app-content fade-up">{children}</main>
    </>
  );
}
