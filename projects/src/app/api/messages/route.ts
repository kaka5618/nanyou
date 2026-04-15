import { NextRequest, NextResponse } from 'next/server';
import { insertMessage, listMessages } from '@/server/db/chat-messages';

interface CreateMessageBody {
  role?: 'user' | 'character';
  content?: string;
  characterId?: string;
}

/**
 * 查询最近消息，默认 20 条，最大 100 条。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? Number(limitRaw) : 20;
    const messages = await listMessages(Number.isFinite(limit) ? limit : 20);
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '查询消息失败';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

/**
 * 写入一条消息到 Neon。
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateMessageBody = await request.json();
    const role = body.role;
    const content = body.content?.trim();

    if (role !== 'user' && role !== 'character') {
      return NextResponse.json(
        { error: 'role 必须是 user 或 character' },
        { status: 400 },
      );
    }
    if (!content) {
      return NextResponse.json(
        { error: 'content 不能为空' },
        { status: 400 },
      );
    }

    const message = await insertMessage({
      role,
      content,
      characterId: body.characterId,
    });
    return NextResponse.json({ message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '写入消息失败';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
