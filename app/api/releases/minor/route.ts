import { query } from '@/app/lib/db';

// curl -s -X POST -H 'Content-Type: application/json' \
//   -d '{"label":"First minor"}' http://localhost:3000/api/releases/minor

interface DbRow {
  scroll_id: number;
  generated_name: string;
}

export type Row = {
  id: string;
  generated_name: string;
};

export async function POST(req: Request) {
  let label: string;
  try {
    const body = await req.json();
    label = typeof body.label === 'string' ? body.label.trim() : '';
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!label || label.length > 120) {
    return Response.json({ error: 'invalid label' }, { status: 400 });
  }

  const sql = 'SELECT * FROM dojo.fn_next_minor($1::text);';
  try {
    const { rows } = await query<DbRow>(sql, [label]);
    const row = rows[0];
    const item: Row = { id: String(row.scroll_id), generated_name: row.generated_name };
    return Response.json(item);
  } catch (err) {
    console.error('fn_next_minor failed:', err);
    return Response.json({ error: 'database error' }, { status: 500 });
  }
}
