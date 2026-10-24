"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  Moon,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { authApi } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setError(
          "Authentication isn't configured yet. Add your Supabase environment variables."
        );
        return;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      let activeUser = signUpData.user;
      let hasSession = Boolean(signUpData.session);

      // If confirmation is disabled, try signing in if signUp returned no session.
      if (!hasSession) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (!signInError && signInData.session) {
          hasSession = true;
          activeUser = signInData.user;
        }
      }

      if (hasSession) {
        if (activeUser) {
          try {
            await authApi.sync(activeUser);
          } catch {
            // Profile sync is non-fatal; Supabase authentication has succeeded.
          }
        }

        router.push("/dashboard");
        return;
      }

      setNotice(
        "Your account was created. Check your inbox for a confirmation link, then sign in."
      );
    } catch {
      setError("Something went wrong while creating your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section
        aria-labelledby="signup-title"
        className="auth-cartoon-card rounded-[28px] bg-[#162e59] p-6 sm:p-8"
      >
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#64dfd0] shadow-[0_4px_0_0_#081326]">
            <Moon
              size={26}
              className="text-[#081326]"
              fill="#ffe082"
              strokeWidth={2.5}
            />
          </div>
        </div>

        <h1
          id="signup-title"
          className="mb-2 text-center text-2xl font-extrabold text-white"
        >
          Begin your dream journal
        </h1>
        <p className="mb-6 text-center text-sm font-medium text-[#a9c7ec]">
          Create a cozy place to save your nighttime stories.
        </p>

        {!isSupabaseConfigured && (
          <div
            role="status"
            className="mb-4 flex gap-3 rounded-2xl border-2 border-[#081326] bg-[#ffe082]/10 p-3.5 text-sm font-medium leading-relaxed text-[#ffe9a8]"
          >
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              Supabase isn&apos;t configured. Add{" "}
              <code className="font-bold">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              to your <code className="font-bold">.env.local</code>.
            </p>
          </div>
        )}

        {notice && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 flex gap-3 rounded-2xl border-2 border-[#081326] bg-[#64dfd0]/10 px-4 py-3 text-sm font-semibold leading-relaxed text-[#b7fff0]"
          >
            <Mail size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </p>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="signup-name"
              className="mb-2 block text-sm font-bold text-[#cfe3fc]"
            >
              Your name <span className="font-medium text-[#8fb2de]">(optional)</span>
            </label>
            <div className="relative">
              <UserRound
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6bc2ff]"
                aria-hidden="true"
              />
              <input
                id="signup-name"
                name="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="auth-cartoon-input has-leading-icon"
                placeholder="Luna Dreamer"
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-2 block text-sm font-bold text-[#cfe3fc]"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6bc2ff]"
                aria-hidden="true"
              />
              <input
                id="signup-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="auth-cartoon-input has-leading-icon"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-2 block text-sm font-bold text-[#cfe3fc]"
            >
              Password
            </label>
            <div className="relative">
              <LockKeyhole
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6bc2ff]"
                aria-hidden="true"
              />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="auth-cartoon-input has-leading-icon has-trailing-icon"
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8fb2de] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="rounded-xl border-2 border-[#ff859d]/40 bg-[#ff859d]/10 px-4 py-3 text-sm font-semibold text-[#ffd2db]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-cartoon-primary mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-[#081326]/30 border-t-[#081326]"
                  aria-hidden="true"
                />
                Creating account…
              </>
            ) : (
              <>
                Create free account
                <ArrowRight size={17} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
      </section>

      <p className="mt-6 text-center text-sm font-semibold text-[#a9c7ec]">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-extrabold text-[#75c6ff] underline decoration-[#75c6ff]/40 underline-offset-4 hover:text-white"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}