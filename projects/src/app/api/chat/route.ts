import { NextRequest, NextResponse } from 'next/server';
import { CharacterId } from '@/types/chat';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

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
        { error: 'Missing system prompt' },
        { status: 400 }
      );
    }

    // 提取请求头（用于请求追踪和认证）
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建配置和LLM客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建消息列表，包含系统消息
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // 如果限制了发图，在系统提示词中追加提示
    if (limitImage) {
      chatMessages[0].content += '\n\n【重要】这轮对话请不要发图片，已经发过很多照片了。';
    }

    // 调用LLM
    const response = await client.invoke(chatMessages, {
      model: 'doubao-seed-1-8-251228', // 使用正确的模型ID
      temperature: 0.8,
    });

    // 检查响应
    if (!response || !response.content) {
      return NextResponse.json({
        reply: '嗯...让我想想怎么说～',
      });
    }

    return NextResponse.json({ reply: response.content });
  } catch (error) {
    console.error('Chat API error:', error);
    
    // 返回友好的错误消息
    return NextResponse.json(
      { error: '网络不太好，等一下再试试～' },
      { status: 200 } // 返回200，前端会显示默认回复
    );
  }
}

// 设置路由超时
export const maxDuration = 30;
