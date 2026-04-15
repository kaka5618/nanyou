import type { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { summarizeError } from '@/server/llm/log';
import type { LlmChatParams, LlmChatResult } from '@/server/llm/types';
import { LlmError } from '@/server/llm/types';

/**
 * 使用 coze-coding-dev-sdk 完成对话（兼容旧链路，供 LLM_PROVIDER=coze 或回退）
 */
export async function completeCozeSdkChat(
  params: LlmChatParams,
  request: NextRequest,
): Promise<LlmChatResult> {
  const model =
    process.env.COZE_LLM_MODEL?.trim() || 'doubao-seed-1-8-251228';
  const temperature = params.temperature ?? 0.8;

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  try {
    const response = await client.invoke(
      params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        model: params.model || model,
        temperature,
      },
    );

    if (!response?.content?.trim()) {
      throw new LlmError('BAD_RESPONSE', '模型返回内容为空');
    }

    return {
      text: response.content,
      rawModel: params.model || model,
    };
  } catch (e) {
    if (e instanceof LlmError) throw e;
    throw new LlmError(
      'UNKNOWN',
      '对话服务暂时不可用，请稍后再试',
      undefined,
      summarizeError(e),
    );
  }
}
