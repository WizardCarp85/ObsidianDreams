"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Eye, EyeOff } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Authentication not configured yet. Add your Supabase environment variables.");
      setLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        await authApi.sync(data.user);
      } catch {
        /* non-fatal */
      }
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0b1024 0%, #1b2a6b 45%, #0f1535 100%)" }}
    >
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6c8eff, #b9a6f5)" }}
            >
              <Moon size={20} className="text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
            >
              Star<span style={{ color: "#6bc2ff" }}>drift</span>
            </span>
          </Link>
        </div>

        <div className="glass-card p-8">
          <h1
            className="text-2xl font-bold mb-2 text-center"
            style={{ fontFamily: "Quicksand, sans-serif" }}
          >
            Welcome back
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: "#7781ac" }}>
            Sign in to your dream journal
          </p>

          {!isSupabaseConfigured && (
            <div
              className="rounded-xl p-4 mb-4 text-sm"
              style={{
                background: "rgba(243,217,139,0.1)",
                border: "1px solid rgba(243,217,139,0.25)",
                color: "#f3d98b",
              }}
            >
              ⚠️ Supabase not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code>.env.local</code>.
            </div>
          )}

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glass"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#7781ac" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#f2a6c5" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: "#7781ac" }}>
          New here?{" "}
          <Link href="/sign-up" style={{ color: "#8fa8ff" }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
