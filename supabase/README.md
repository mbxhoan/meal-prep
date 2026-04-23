# Supabase Notes

## Chạy migration
Dùng SQL Editor hoặc Supabase CLI để chạy:
- `migrations/0001_init.sql`

## Chạy seed
- `seed.sql`

## Khi production
Bản starter này dùng policy full access cho authenticated để đi nhanh.
Khi vào production thật, nên tách:
- admin
- operator
- viewer
và policy theo role.
