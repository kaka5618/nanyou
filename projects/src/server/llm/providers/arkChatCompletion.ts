import { summarizeError } from '@/server/llm/log';
import { LlmChatParams, LlmChatResult, LlmError } from '@/server/llm/types';

/**方舟 chat/completions 响应（仅用到的字段） */
interface ArkChoice {
  message?: { content?: string; role?: string };
  finish_reason?: string;
}

interface ArkCompletionResponse {
  choices?: ArkChoice[];
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; code?: string; type?: string };
}

function getArkConfig(): { apiKey: string; baseUrl: string; model: string; timeoutMs: number } {
  const apiKey = process.env.ARK_API_KEY?.trim();
  if (!apiKey) {
    throw new LlmError(
      'CONFIG',
      '服务端未配置 ARK_API_KEY，无法调用火山方舟对话接口',
    );
  }
  const baseUrl = (
    process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
  ).replace(/\/$/, '');
  const model = process.env.ARK_CHAT_MODEL || 'doubao-1-5-pro-32k-250115';
  const timeoutMs = Math.min(
    parseInt(process.env.ARK_TIMEOUT_MS || '28000', 10) || 28000,
    120_000,
  );
  return { apiKey, baseUrl, model, timeoutMs };
}

function mapHttpStatusToLlmError(status: number, bodySnippet: string): LlmError {
  if (status === 401) {
    return new LlmError('UNAUTHORIZED', 'API Key 无效或未授权', status, bodySnippet);
  }
  if (status === 403) {
    return new LlmError('FORBIDDEN', '没有权限访问该模型或服务', status, bodySnippet);
  }
  if (status === 429) {
    return new LlmError('RATE_LIMIT', '请求过于频繁，请稍后再试', status, bodySnippet);
  }
  if (status >= 500) {
    return new LlmError('UPSTREAM', 'AI 服务暂时不可用，请稍后再试', status, bodySnippet);
  }
  return new LlmError('UPSTREAM', 'AI 服务返回异常', status, bodySnippet);
}

/**
 * 调用火山方舟 OpenAI 兼容 Chat Completions 接口
 */
export async function completeArkChat(params: LlmChatParams): Promise<LlmChatResult> {
  const { apiKey, baseUrl, model: defaultModel, timeoutMs } = getArkConfig();
  const model = params.model || defaultModel;
  const temperature = params.temperature ?? 0.8;

  const url = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        temperature,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new LlmError('TIMEOUT', '回复超时，请稍后再试',504);
    }
    throw new LlmError('UNKNOWN', '网络请求失败，请稍后再试', undefined, summarizeError(e));
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data: ArkCompletionResponse;
  try {
    data = text ? (JSON.parse(text) as ArkCompletionResponse) : {};
  } catch {
    throw mapHttpStatusToLlmError(response.status || 502, text.slice(0, 500));
  }

  if (!response.ok) {
    const msg =
      data.error?.message ||
      text.slice(0, 200) ||
      `HTTP ${response.status}`;
    throw mapHttpStatusToLlmError(response.status, msg);
  }

  if (data.error?.message) {
    throw new LlmError('UPSTREAM', data.error.message, response.status, data.error);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new LlmError('BAD_RESPONSE', '模型返回内容为空', response.status, {
      choicesLen: data.choices?.length ?? 0,
    });
  }

  return {
    text: content,
    rawModel: data.model || model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}
