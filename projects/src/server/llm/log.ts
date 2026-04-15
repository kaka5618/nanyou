/**
 * LLM 调用可观测日志（单行 JSON，便于检索；勿记录密钥与完整 prompt）
 */

export function llmLog(
  event: 'request_start' | 'request_end',
  fields: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    scope: 'llm',
    event,
    ...fields,
  });
  console.log('[llm]', line);
}

/**
 * 从 Error 或未知值中提取可安全记入日志的短摘要
 */
export function summarizeError(err: unknown): string {
  if (err instanceof Error) {
    return err.name + ': ' + err.message.slice(0, 200);
  }
  return String(err).slice(0, 200);
}
