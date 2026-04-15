import type { NextRequest } from 'next/server';
import { llmLog, summarizeError } from '@/server/llm/log';
import { completeArkChat } from '@/server/llm/providers/arkChatCompletion';
import { completeCozeSdkChat } from '@/server/llm/providers/cozeSdkChat';
import type { LlmChatParams, LlmChatResult } from '@/server/llm/types';
import { LlmError } from '@/server/llm/types';

export type LlmProviderName = 'ark' | 'coze';

function resolveProvider(): LlmProviderName {
  const v = (process.env.LLM_PROVIDER || 'ark').toLowerCase().trim();
  return v === 'coze' ? 'coze' : 'ark';
}

function newRequestId(request: NextRequest): string {
  return (
    request.headers.get('x-request-id') ||
    request.headers.get('X-Request-Id') ||
    crypto.randomUUID()
  );
}

/**
 * 统一入口：按环境变量选择 Ark或 Coze，并记录耗时与结果摘要
 */
export async function runChatLlm(
  params: LlmChatParams,
  request: NextRequest,
): Promise<LlmChatResult> {
  const provider = resolveProvider();
  const reqId = newRequestId(request);
  const started = Date.now();

  llmLog('request_start', {
    reqId,
    provider,
    messageCount: params.messages.length,
  });

  try {
    let result: LlmChatResult;
    if (provider === 'coze') {
      result = await completeCozeSdkChat(params, request);
    } else {
      result = await completeArkChat(params);
    }

    llmLog('request_end', {
      reqId,
      provider,
      ms: Date.now() - started,
      ok: true,
      model: result.rawModel,
      usage: result.usage,
    });

    return result;
  } catch (err) {
    const code = err instanceof LlmError ? err.code : 'UNKNOWN';
    llmLog('request_end', {
      reqId,
      provider,
      ms: Date.now() - started,
      ok: false,
      code,
      err: summarizeError(err),
    });
    throw err;
  }
}

/**
 * Ark 失败时可选回退 Coze（需显式 LLM_FALLBACK_COZE=true）
 */
export async function runChatLlmWithOptionalFallback(
  params: LlmChatParams,
  request: NextRequest,
): Promise<LlmChatResult> {
  const provider = resolveProvider();
  const fallback =
    (process.env.LLM_FALLBACK_COZE || '').toLowerCase() === 'true';

  if (provider !== 'ark' || !fallback) {
    return runChatLlm(params, request);
  }

  try {
    return await runChatLlm(params, request);
  } catch (first) {
    if (!(first instanceof LlmError)) throw first;
    const retryable =
      first.code === 'UPSTREAM' ||
      first.code === 'TIMEOUT' ||
      first.code === 'RATE_LIMIT';
    if (!retryable) throw first;

    const reqId = newRequestId(request);
    const started = Date.now();
    llmLog('request_start', {
      reqId,
      provider: 'coze',
      messageCount: params.messages.length,
      reason: 'fallback_after_ark',
      afterCode: first.code,
    });

    try {
      const result = await completeCozeSdkChat(params, request);
      llmLog('request_end', {
        reqId,
        provider: 'coze',
        ms: Date.now() - started,
        ok: true,
        model: result.rawModel,
        fallback: true,
      });
      return result;
    } catch (second) {
      llmLog('request_end', {
        reqId,
        provider: 'coze',
        ms: Date.now() - started,
        ok: false,
        code: second instanceof LlmError ? second.code : 'UNKNOWN',
        err: summarizeError(second),
        fallback: true,
      });
      throw first;
    }
  }
}
