import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface ImageRequest {
  prompt: string;
  uid: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageRequest = await request.json();
    const { prompt, uid } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // 提取请求头（用于请求追踪和认证）
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建配置和客户端
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    // 调用图像生成
    const response = await client.generate({
      prompt,
      size: '2K',
      watermark: false,
      responseFormat: 'url',
    });

    // 使用响应帮助类来解析结果
    const helper = client.getResponseHelper(response);

    if (!helper.success || helper.imageUrls.length === 0) {
      const errorMsg = helper.errorMessages.join(', ') || 'Unknown error';
      console.error('Image generation failed:', errorMsg);
      return NextResponse.json(
        { error: 'Image generation failed: ' + errorMsg },
        { status: 200 }
      );
    }

    // 返回第一个图片URL
    return NextResponse.json({
      imageUri: helper.imageUrls[0],
    });
  } catch (error) {
    console.error('Image generation API error:', error);
    
    // 图片生成失败，返回200但带有错误标志
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 200 }
    );
  }
}

export const maxDuration = 60;
