"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { SmartImage } from "@/shared";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export function ImageUploader({
  value,
  onChange,
  bucket = "product-media",
  pathPrefix = "menu",
  title = "Ảnh xem trước",
  label = "URL ảnh đại diện",
  emptyText = "Chưa có ảnh đại diện.",
  uploadLabel = "Tải ảnh lên Supabase Storage",
  helpText,
  placeholder = "https://... hoặc /assets/...",
}: {
  value: string;
  onChange: (value: string) => void;
  bucket?: string;
  pathPrefix?: string;
  title?: string;
  label?: string;
  emptyText?: string;
  uploadLabel?: string;
  helpText?: ReactNode;
  placeholder?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const configured = isSupabaseConfigured();
  const canPreview = useMemo(
    () => value.startsWith("/") || value.startsWith("http"),
    [value],
  );

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative aspect-square w-full overflow-hidden rounded-[24px] border border-dashed border-slate-200 bg-white lg:w-[220px]">
          {canPreview ? (
            <SmartImage
              src={value}
              alt={title}
              fill
              sizes="220px"
              className="object-contain p-4"
            />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-slate-400">
              {emptyText}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              {label}
            </span>
            <input
              type="url"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#51724f]"
              placeholder={placeholder}
            />
          </label>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4">
            <p className="text-sm font-medium text-slate-700">
              {uploadLabel}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {helpText ?? (
                <>
                  Dùng bucket <code>{bucket}</code>. Nếu chưa cấu hình biến môi
                  trường, bạn vẫn có thể dán URL ảnh thủ công.
                </>
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                disabled={!configured || uploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  const client = createSupabaseBrowserClient();

                  if (!file || !client) {
                    setMessage("Supabase chưa sẵn sàng để tải lên.");
                    return;
                  }

                  if (!file.type.startsWith("image/")) {
                    setMessage("Vui lòng chọn file ảnh hợp lệ.");
                    return;
                  }

                  setUploading(true);
                  setMessage(null);

                  const fileExt =
                    (file.name.split(".").pop() ?? "webp").toLowerCase();
                  const filePath = `${pathPrefix}/${crypto.randomUUID()}.${fileExt}`;
                  const { error } = await client.storage
                    .from(bucket)
                    .upload(filePath, file, { upsert: true });

                  if (error) {
                    setUploading(false);
                    setMessage(error.message);
                    return;
                  }

                  const { data } = client.storage.from(bucket).getPublicUrl(filePath);
                  onChange(data.publicUrl);
                  setUploading(false);
                  setMessage("Đã tải ảnh lên và cập nhật URL.");
                  event.target.value = "";
                }}
                className="max-w-full text-sm text-slate-500"
              />
              {value ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setMessage("Đã xoá ảnh khỏi biểu mẫu.");
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Xóa ảnh
                </button>
              ) : null}
              {!configured ? (
                <span className="text-xs text-amber-700">
                  Thiếu biến môi trường Supabase, chức năng tải lên bị tắt.
                </span>
              ) : null}
            </div>
            {message ? (
              <p className="mt-3 text-sm text-slate-500">{message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
