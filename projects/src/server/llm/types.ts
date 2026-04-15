/**
 * LLM 适配层公共类型（与具体供应商解耦）
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: ChatRole;
  content: string;
}

export interface LlmChatParams {
  messages: LlmMessage[];
  temperature?: number;
  /** 覆盖环境变量中的默认模型 */
  model?: string;
}

export interface LlmChatResult {
  text: string;
  rawModel?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export type LlmErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT'
  | 'UPSTREAM'
  | 'TIMEOUT'
  | 'BAD_RESPONSE'
  | 'CONFIG'
  | 'UNKNOWN';

/**
 * 结构化 LLM 错误，供路由映射为 HTTP 状态与前端文案
 */
export class LlmError extends Error {
  constructor(
    public readonly code: LlmErrorCode,
    message: string,
    public readonly httpStatus?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}
