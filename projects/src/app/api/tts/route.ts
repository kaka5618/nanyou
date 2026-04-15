import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface TTSRequest {
  text: string;
  speaker: string;
  uid: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, speaker, uid } = body;

    if (!text || !speaker) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 提取请求头（用于请求追踪和认证）
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建配置和TTS客户端
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 调用TTS
    const response = await client.synthesize({
      text,
      speaker,
      uid,
      audioFormat: 'mp3',
    });

    // 检查响应
    if (!response || !response.audioUri) {
      throw new Error('No audio URI in response');
    }

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize || 0,
    });
  } catch (error) {
    console.error('TTS API error:', error);
    
    // TTS失败不影响主流程，返回空结果
    return NextResponse.json(
      { error: 'TTS generation failed' },
      { status: 200 } // 返回200但带有错误标志，前端可以静默处理
    );
  }
}

export const maxDuration = 15;
