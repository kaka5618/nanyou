/**
 * 文本清理工具，用于TTS语音合成
 */

/**
 * 清理文本中的特殊标记和格式，使其适合语音朗读
 * @param text 原始文本
 * @returns 清理后的文本
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return text
    // 去掉 [IMAGE: ...] 标记
    .replace(/\[IMAGE:\s*.+?\]/g, '')
    // 去掉中文括号内容
    .replace(/（[^）]*）/g, '')
    .replace(/\([^）]*\)/g, '')
    // 去掉英文括号内容
    .replace(/\([^)]*\)/g, '')
    // 去掉中括号内容
    .replace(/\[[^\]]*\]/g, '')
    // 去掉其他标点符号
    .replace(/[「」『』【】《》]/g, '')
    // 去掉多余空格
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 检查清理后的文本是否为空
 * @param text 原始文本
 * @returns 是否可以生成语音
 */
export function canGenerateSpeech(text: string): boolean {
  const cleaned = cleanTextForSpeech(text);
  return cleaned.length > 0;
}

/**
 * 格式化语音时长
 * @param seconds 秒数
 * @returns 格式化的时长字符串
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 估算语音时长（基于文本长度）
 * @param text 文本
 * @returns 估算的秒数
 */
export function estimateDuration(text: string): number {
  // 粗略估算：中文每字约0.4秒
  const cleaned = cleanTextForSpeech(text);
  return Math.max(1, Math.ceil(cleaned.length * 0.4));
}
