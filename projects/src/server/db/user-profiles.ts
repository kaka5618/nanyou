import { getDbPool } from '@/server/db/pg';

export interface UserProfileRecord {
  profile_id: number;
  auth_id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
}

/**
 * 确保 Neon 中存在 user_profiles 表，并补齐关键字段。
 */
export async function ensureUserProfilesTable(): Promise<void> {
  const pool = getDbPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      profile_id BIGSERIAL PRIMARY KEY,
      auth_id VARCHAR(64) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      nickname VARCHAR(50) NOT NULL,
      avatar_url VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
  `);
  await pool.query(`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
  `);
  await pool.query(`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
  `);
}

/**
 * 根据 auth_id 查询用户资料。
 */
export async function getUserProfileByAuthId(
  authId: string,
): Promise<UserProfileRecord | null> {
  await ensureUserProfilesTable();
  const pool = getDbPool();
  const { rows } = await pool.query<UserProfileRecord>(
    `
      SELECT profile_id, auth_id, email, nickname, avatar_url
      FROM user_profiles
      WHERE auth_id = $1
      LIMIT 1
    `,
    [authId],
  );
  return rows[0] ?? null;
}

/**
 * 注册后写入（或幂等更新）用户资料到 Neon。
 */
export async function upsertUserProfile(input: {
  authId: string;
  email: string;
  nickname: string;
  avatarUrl?: string | null;
}): Promise<UserProfileRecord> {
  await ensureUserProfilesTable();
  const pool = getDbPool();
  const { rows } = await pool.query<UserProfileRecord>(
    `
      INSERT INTO user_profiles (auth_id, email, nickname, avatar_url, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (auth_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        nickname = EXCLUDED.nickname,
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
        updated_at = NOW()
      RETURNING profile_id, auth_id, email, nickname, avatar_url
    `,
    [input.authId, input.email, input.nickname, input.avatarUrl ?? null],
  );
  return rows[0];
}

/**
 * 更新用户资料字段并返回最新数据；若不存在返回 null。
 */
export async function updateUserProfileByAuthId(
  authId: string,
  input: { nickname?: string; avatar_url?: string | null },
): Promise<UserProfileRecord | null> {
  await ensureUserProfilesTable();
  const pool = getDbPool();
  const updates: string[] = [];
  const values: Array<string | null> = [];
  let idx = 1;

  if (input.nickname !== undefined) {
    updates.push(`nickname = $${idx++}`);
    values.push(input.nickname);
  }
  if (input.avatar_url !== undefined) {
    updates.push(`avatar_url = $${idx++}`);
    values.push(input.avatar_url);
  }

  if (updates.length === 0) {
    return getUserProfileByAuthId(authId);
  }

  updates.push('updated_at = NOW()');

  const sql = `
    UPDATE user_profiles
    SET ${updates.join(', ')}
    WHERE auth_id = $${idx}
    RETURNING profile_id, auth_id, email, nickname, avatar_url
  `;
  values.push(authId);

  const { rows } = await pool.query<UserProfileRecord>(sql, values);
  return rows[0] ?? null;
}
