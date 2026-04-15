import { NextRequest, NextResponse } from 'next/server';
import { summarizeError } from '@/server/llm/log';
import {
  httpStatusForLlmError,
  userFacingMessage,
} from '@/server/llm/mapLlmErrorResponse';
import { runChatLlmWithOptionalFallback } from '@/server/llm/runChatLlm';
import { LlmError } from '@/server/llm/types';
import { CharacterId } from '@/types/chat';

interface ChatRequest {
  characterId: CharacterId;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  limitImage?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { systemPrompt, messages, limitImage } = body;

    if (!systemPrompt) {
      return NextResponse.json(
        { error: '缺少 system prompt', code: 'BAD_REQUEST' },
        { status: 400 },
      );
    }

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    if (limitImage) {
      chatMessages[0].content +=
        '\n\n【重要】这轮对话请不要发图片，已经发过很多照片了。';
    }

    /**
     * 统一回复兜底约束，减少跑题与“客服话术”。
     */
    chatMessages[0].content +=
      '\n\n【回复要求】先直接回答用户当前问题，再自然延展；不要使用客服/职场官方口吻。';

    const result = await runChatLlmWithOptionalFallback(
      {
        messages: chatMessages,
        temperature: 0.8,
      },
      request,
    );

    const reply = result.text?.trim();
    if (!reply) {
      return NextResponse.json({
        reply: '嗯...让我想想怎么说～',
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', summarizeError(error));

    if (error instanceof LlmError) {
      const status = httpStatusForLlmError(error);
      const message = userFacingMessage(error.code);
      return NextResponse.json(
        { error: message, code: error.code },
        { status },
      );
    }

    return NextResponse.json(
      { error: userFacingMessage('UNKNOWN'), code: 'UNKNOWN' },
      { status: 502 },
    );
  }
}

export const maxDuration = 30;
