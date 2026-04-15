import { getDbPool } from '@/server/db/pg';

export interface StoredMessage {
  id: number;
  role: 'user' | 'character';
  content: string;
  characterId: string | null;
  createdAt: string;
}

/**
 * 确保演示消息表存在，便于小白直接验证 Neon 的增删改查链路。
 */
export async function ensureMessagesTable(): Promise<void> {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGSERIAL PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('user', 'character')),
      content TEXT NOT NULL,
      character_id TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS character_id TEXT NULL;
  `);
  await pool.query(`
    ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
}

/**
 * 插入一条消息并返回持久化后的记录。
 */
export async function insertMessage(input: {
  role: 'user' | 'character';
  content: string;
  characterId?: string;
}): Promise<StoredMessage> {
  await ensureMessagesTable();
  const pool = getDbPool();
  const { rows } = await pool.query<{
    id: string;
    role: 'user' | 'character';
    content: string;
    character_id: string | null;
    created_at: string;
  }>(
    `
      INSERT INTO chat_messages (role, content, character_id)
      VALUES ($1, $2, $3)
      RETURNING id, role, content, character_id, created_at
    `,
    [input.role, input.content, input.characterId ?? null],
  );

  const row = rows[0];
  return {
    id: Number(row.id),
    role: row.role,
    content: row.content,
    characterId: row.character_id,
    createdAt: row.created_at,
  };
}

/**
 * 按时间倒序查询最近消息。
 */
export async function listMessages(limit: number): Promise<StoredMessage[]> {
  await ensureMessagesTable();
  const pool = getDbPool();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const { rows } = await pool.query<{
    id: string;
    role: 'user' | 'character';
    content: string;
    character_id: string | null;
    created_at: string;
  }>(
    `
      SELECT id, role, content, character_id, created_at
      FROM chat_messages
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [safeLimit],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    role: row.role,
    content: row.content,
    characterId: row.character_id,
    createdAt: row.created_at,
  }));
}
