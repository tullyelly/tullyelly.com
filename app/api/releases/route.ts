import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// curl -s http://localhost:3000/api/releases

export async function GET() {
  try {
    const sql = `
      select * from dojo.v_shaolin_scrolls
      order by created_at desc
      limit 100
    `;
    const { rows } = await query(sql);
    return NextResponse.json(rows);
  } catch (err: any) {
    if (process.env.VERCEL_ENV === 'production') {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
