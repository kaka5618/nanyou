import { Pool } from 'pg';

/**
 * 返回去除首尾引号的数据库连接串，兼容 .env 中可能写成 "xxx" 的情况。
 */
function readDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error('DATABASE_URL 未配置，无法连接数据库');
  }
  return raw.replace(/^["']|["']$/g, '');
}

declare global {
  // eslint-disable-next-line no-var
  var __neonPool: Pool | undefined;
}

/**
 * 获取进程级单例连接池，避免开发模式热更新重复创建连接。
 */
export function getDbPool(): Pool {
  if (!global.__neonPool) {
    global.__neonPool = new Pool({
      connectionString: readDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return global.__neonPool;
}
