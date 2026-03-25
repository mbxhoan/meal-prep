"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({
  disabled,
  compact = false,
}: {
  disabled?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={async () => {
        const client = createSupabaseBrowserClient();

        if (!client) {
          return;
        }

        setPending(true);
        await client.auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      title="Đăng xuất"
      className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "h-10 w-10" : "px-4 py-2"
      }`}
    >
      {pending ? (
        compact ? (
          "..."
        ) : (
          "Đang đăng xuất..."
        )
      ) : compact ? (
        <FaArrowRightFromBracket />
      ) : (
        "Đăng xuất"
      )}
    </button>
  );
}
