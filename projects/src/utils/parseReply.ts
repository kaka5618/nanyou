/**
 * 解析LLM回复，提取文字内容和图片标记
 */

export interface ParsedReply {
  text: string;
  imagePrompt: string | null;
  imageUri: string | null; // 直接返回的图片URL
}

/**
 * 从LLM回复中解析出文字内容和图片描述
 * @param reply LLM原始回复
 * @returns 解析后的文字和图片描述
 */
export function parseReply(reply: string): ParsedReply {
  let text = reply;
  let imagePrompt: string | null = null;
  let imageUri: string | null = null;

  // 匹配 [IMAGE: 图片描述] 标记
  const imageMatch = reply.match(/\[IMAGE:\s*([^\]]+)\]/);
  
  if (imageMatch) {
    imagePrompt = imageMatch[1].trim();
    // 移除 [IMAGE: ...] 标记
    text = reply.replace(/\[IMAGE:\s*[^\]]+\]/, '').trim();
  }

  // 匹配直接返回的图片URL (http/https开头)
  const urlMatch = reply.match(/(https?:\/\/[^\s\)\]"'\]]+\.(?:jpg|jpeg|png|gif|webp))/gi);
  if (urlMatch) {
    // 找到第一个图片URL
    const firstImageUrl = urlMatch[0];
    // 检查这个URL是否在 [IMAGE: ...] 标记之外
    const imageTagIndex = reply.indexOf('[IMAGE:');
    const urlIndex = reply.indexOf(firstImageUrl);
    
    if (imageTagIndex === -1 || urlIndex < imageTagIndex || urlIndex > imageTagIndex + 100) {
      // URL不在标记内，是直接返回的图片URL
      imageUri = firstImageUrl;
      // 从文本中移除URL
      text = text.replace(firstImageUrl, '').trim();
    }
  }

  return {
    text,
    imagePrompt,
    imageUri,
  };
}

/**
 * 增强图片描述，添加角色外貌特征
 * @param rawPrompt 原始图片描述
 * @param characterAppearance 角色外貌描述
 * @returns 增强后的图片描述
 */
export function enhanceImagePrompt(
  rawPrompt: string,
  characterAppearance: string
): string {
  return `${rawPrompt}。人物特征：${characterAppearance}。画风要求：动漫风格，高质量，精细，暖色调。不要出现文字或水印。`;
}
