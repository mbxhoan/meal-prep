import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function isSupabaseConfigured() {
  return getSupabaseConfig().configured;
}

export async function createSupabaseServerClient() {
  const { configured, key, url } = getSupabaseConfig();

  if (!configured || !url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        for (const item of items) {
          try {
            cookieStore.set(item.name, item.value, item.options);
          } catch {
            return;
          }
        }
      },
    },
  });
}
