export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { executeMasterDataImport } from '@/lib/import/executor';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const client = getAdminClient();

  if (!client) {
    return NextResponse.json(
      {
        ok: false,
        summary: { sheets: 0, insertedOrUpdated: 0, errors: 1 },
        detail: [{ sheet: 'system', row: 0, message: 'Missing Supabase env for server import.' }]
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        summary: { sheets: 0, insertedOrUpdated: 0, errors: 1 },
        detail: [{ sheet: 'system', row: 0, message: 'No file uploaded.' }]
      },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await executeMasterDataImport(client, buffer);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        summary: { sheets: 0, insertedOrUpdated: 0, errors: 1 },
        detail: [
          {
            sheet: 'system',
            row: 0,
            message: error instanceof Error ? error.message : 'Import failed unexpectedly.'
          }
        ]
      },
      { status: 500 }
    );
  }
}
