export function parseJsonField<T>(formData: FormData, key: string): T {
  const raw = formData.get(key);

  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Missing ${key}`);
  }

  return JSON.parse(raw) as T;
}

export function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toNullableText(value: unknown): string | null {
  const text = toText(value);

  return text.length > 0 ? text : null;
}

