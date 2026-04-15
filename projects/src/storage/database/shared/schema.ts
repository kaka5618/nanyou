import { pgTable, serial, timestamp, varchar, index } from "drizzle-orm/pg-core"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户资料表 - 与Supabase Auth关联
export const userProfiles = pgTable(
  "user_profiles",
  {
    profile_id: serial("profile_id").primaryKey(), // 自增ID：1, 2, 3, 4...
    auth_id: varchar("auth_id", { length: 36 }).notNull().unique(), // 对应 auth.users.id
    email: varchar("email", { length: 255 }).notNull().unique(),
    nickname: varchar("nickname", { length: 50 }).notNull(),
    avatar_url: varchar("avatar_url", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("user_profiles_auth_id_idx").on(table.auth_id),
    index("user_profiles_email_idx").on(table.email),
    index("user_profiles_created_at_idx").on(table.created_at),
  ]
);

// 聊天会话表
export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: serial("id").primaryKey(), // 自增ID：1, 2, 3, 4...
    user_auth_id: varchar("user_auth_id", { length: 36 }).notNull(), // 对应 auth.users.id
    character_id: varchar("character_id", { length: 50 }).notNull(),
    title: varchar("title", { length: 100 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("chat_sessions_user_auth_id_idx").on(table.user_auth_id),
    index("chat_sessions_created_at_idx").on(table.created_at),
  ]
);

// 聊天消息表
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(), // 自增ID：1, 2, 3, 4...
    session_id: serial("session_id").notNull(), // 对应 chat_sessions.id
    role: varchar("role", { length: 20 }).notNull(), // 'user' | 'character'
    content: varchar("content", { length: 4000 }),
    message_type: varchar("message_type", { length: 20 }).default("text"), // 'text' | 'voice' | 'image'
    audio_uri: varchar("audio_uri", { length: 500 }),
    image_uri: varchar("image_uri", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_session_id_idx").on(table.session_id),
    index("chat_messages_created_at_idx").on(table.created_at),
  ]
);
