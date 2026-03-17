import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function createSupabaseServerClient() {
  const { configured, key, url } = getConfig();

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
