import { NextRequest, NextResponse } from 'next/server';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const maxDuration = 60;

interface ImageRequest {
  prompt: string;
  uid: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageRequest = await request.json();
    const { prompt, uid } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const response = await client.generate({
      prompt,
      size: '2K',
      watermark: false,
      responseFormat: 'url',
    });

    const helper = client.getResponseHelper(response);

    if (!helper.success || helper.imageUrls.length === 0) {
      const errorMsg = helper.errorMessages.join(', ') || 'Unknown error';
      console.error('Image generation failed:', errorMsg);
      return NextResponse.json(
        { error: 'Image generation failed: ' + errorMsg },
        { status: 502 },
      );
    }

    return NextResponse.json({
      imageUri: helper.imageUrls[0],
    });
  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 },
    );
  }
}
