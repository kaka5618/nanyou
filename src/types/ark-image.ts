/** 火山方舟 images/generations 响应的最小子集 */
export type ArkImageGenerationBody = {
  model?: string;
  created?: number;
  data?: Array<{
    url?: string;
    size?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
  };
};

