/**
 * Supabase client instances for frontend use.
 * Uses @supabase/ssr for cookie-based sessions compatible with Next.js App Router.
 *
 * Falls back gracefully when env vars aren't set yet (no errors thrown at startup).
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a null-safe stub when Supabase isn't configured yet.
    // The app will show "not configured" state instead of crashing.
    return null;
  }
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
