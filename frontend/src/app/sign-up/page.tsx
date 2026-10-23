"use client";

import { useState } from "react";
import Link from "next/link";
import { Moon, Eye, EyeOff } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Authentication not configured. Add your Supabase environment variables.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      try { await authApi.sync(data.user); } catch { /* non-fatal */ }
      if (data.session) {
        router.push("/dashboard");
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0b1024 0%, #1b2a6b 45%, #0f1535 100%)" }}
    >
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
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
              Obsidian<span style={{ color: "#b9a6f5" }}>Dreams</span>
            </span>
          </Link>
        </div>

        <div className="glass-card p-8">
          <h1
            className="text-2xl font-bold mb-2 text-center"
            style={{ fontFamily: "Quicksand, sans-serif" }}
          >
            Begin your journey
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: "#7781ac" }}>
            Create your free dream journal
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
              ⚠️ Supabase not configured. Add your environment variables to enable sign-up.
            </div>
          )}

          {success ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: "rgba(111,227,217,0.08)", border: "1px solid rgba(111,227,217,0.2)" }}
            >
              <p className="text-3xl mb-3">🌙</p>
              <p className="font-semibold mb-1" style={{ color: "#6fe3d9", fontFamily: "Quicksand, sans-serif" }}>
                Check your email
              </p>
              <p className="text-sm" style={{ color: "#aeb8e0" }}>
                We sent a confirmation link to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-glass"
                  placeholder="Luna Dreamer"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
                  Email address
                </label>
                <input
                  id="signup-email"
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
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-glass pr-12"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                    Creating account…
                  </span>
                ) : (
                  "Create account"
                )}
              </button>

              <p className="text-xs text-center mt-1" style={{ color: "#7781ac" }}>
                By signing up you agree to keep your dreams private and wonderful.
              </p>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: "#7781ac" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "#8fa8ff" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
