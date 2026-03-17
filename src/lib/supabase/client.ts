"use client";

import { createBrowserClient } from "@supabase/ssr";

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    key,
    configured: Boolean(url && key),
  };
}

export function isSupabaseConfigured() {
  return getConfig().configured;
}

export function createSupabaseBrowserClient() {
  const { configured, key, url } = getConfig();

  if (!configured || !url || !key) {
    return null;
  }

  return createBrowserClient(url, key);
}
