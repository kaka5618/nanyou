import { LlmError, type LlmErrorCode } from '@/server/llm/types';

/**
 * 将 LlmError 映射为对用户可读的文案与 HTTP 状态码
 */
export function userFacingMessage(code: LlmErrorCode): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return '服务鉴权失败，请检查 API 配置';
    case 'FORBIDDEN':
      return '没有权限访问该模型或服务';
    case 'RATE_LIMIT':
      return '请求过于频繁，请稍后再试';
    case 'UPSTREAM':
      return 'AI 服务暂时不可用，请稍后再试';
    case 'TIMEOUT':
      return '回复超时，请稍后再试';
    case 'BAD_RESPONSE':
      return '回复格式异常，请重试';
    case 'CONFIG':
      return '服务未正确配置，请联系管理员';
    case 'UNKNOWN':
    default:
      return '网络不太好，等一下再试试～';
  }
}

export function httpStatusForLlmError(err: LlmError): number {
  if (
    err.httpStatus !== undefined &&
    err.httpStatus >= 400 &&
    err.httpStatus < 600
  ) {
    return err.httpStatus;
  }
  switch (err.code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'RATE_LIMIT':
      return 429;
    case 'TIMEOUT':
      return 504;
    case 'CONFIG':
      return 503;
    case 'BAD_RESPONSE':
      return 502;
    case 'UPSTREAM':
      return 502;
    default:
      return 502;
  }
}
