"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function isSupabaseConfigured() {
  return getSupabaseConfig().configured;
}

export function createSupabaseBrowserClient() {
  const { configured, key, url } = getSupabaseConfig();

  if (!configured || !url || !key) {
    return null;
  }

  return createBrowserClient(url, key);
}
