import { NextResponse } from 'next/server';
import { getDbPool } from '@/server/db/pg';

/**
 * 数据库健康检查：验证当前服务端是否能使用 DATABASE_URL 连通 Neon。
 */
export async function GET() {
  try {
    const pool = getDbPool();
    const { rows } = await pool.query<{
      ok: number;
      db: string;
      schema: string;
      now: string;
    }>(
      'SELECT 1 AS ok, current_database() AS db, current_schema() AS schema, NOW()::text AS now',
    );

    return NextResponse.json({
      connected: true,
      ...rows[0],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '数据库连接失败';
    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
