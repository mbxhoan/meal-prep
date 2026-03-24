"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROFILE_ROLE_LABELS } from "@/lib/rbac/constants";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginForm({ reason }: { reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    reason === "permission" || reason === "role"
      ? "Tài khoản của bạn chưa được gán quyền truy cập admin hoặc shop hợp lệ."
      : null,
  );
  const [pending, setPending] = useState(false);
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-[36px] border border-white/60 bg-white/90 p-8 shadow-[0_25px_90px_-45px_rgba(15,23,42,0.65)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#51724f]">
        MealFit Admin
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        Đăng nhập quản trị
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-500">
        Dùng tài khoản Supabase đã được gán role{" "}
        <code>{PROFILE_ROLE_LABELS.system_admin}</code>,{" "}
        <code>{PROFILE_ROLE_LABELS.shop_admin}</code> hoặc{" "}
        <code>{PROFILE_ROLE_LABELS.employee}</code>. Nếu chưa cấu hình môi
        trường, bạn vẫn có thể mở dashboard ở demo mode.
      </p>

      {!configured ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-800">
          <p className="font-medium">Supabase env chưa có.</p>
          <p className="mt-2">
            Hệ thống đã tự rơi về demo mode để bạn kiểm tra UI, cost flow và order
            builder.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-flex rounded-full bg-[#18352d] px-5 py-3 font-medium text-white transition hover:opacity-90"
          >
            Vào dashboard demo
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const client = createSupabaseBrowserClient();

            if (!client) {
              setMessage("Không khởi tạo được Supabase client.");
              return;
            }

            setPending(true);
            setMessage(null);

            const { error } = await client.auth.signInWithPassword({
              email,
              password,
            });

            setPending(false);

            if (error) {
              setMessage(error.message);
              return;
            }

            router.replace("/admin");
            router.refresh();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#51724f] focus:bg-white"
              placeholder="admin@mealfit.vn"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Mật khẩu
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#51724f] focus:bg-white"
              placeholder="••••••••"
            />
          </label>

          {message ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#18352d] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      )}
    </div>
  );
}
