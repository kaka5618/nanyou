import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { upsertUserProfile } from '@/server/db/user-profiles';

interface TurnstileVerifyResponse {
  success: boolean;
}

/**
 * 校验 Cloudflare Turnstile token 是否有效。
 */
async function verifyTurnstileToken(token: string, remoteIp: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('Missing TURNSTILE_SECRET_KEY');
    return false;
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    params.append('remoteip', remoteIp);
  }

  try {
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      cache: 'no-store',
    });

    if (!verifyResponse.ok) {
      console.error('Turnstile verify request failed:', verifyResponse.status);
      return false;
    }

    const verifyResult = (await verifyResponse.json()) as TurnstileVerifyResponse;
    return verifyResult.success === true;
  } catch (error) {
    console.error('Turnstile verify error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.COZE_SUPABASE_URL?.trim();
    const supabaseAnon = process.env.COZE_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnon) {
      console.error(
        'Register: missing COZE_SUPABASE_URL or COZE_SUPABASE_ANON_KEY (set them in Vercel project env)',
      );
      return NextResponse.json(
        {
          error:
            '注册服务未就绪：请在部署平台（如 Vercel）配置 COZE_SUPABASE_URL 与 COZE_SUPABASE_ANON_KEY 后重新部署',
        },
        { status: 503 },
      );
    }

    const { email, password, nickname, turnstileToken } = await request.json();

    if (!email || !password || !nickname || !turnstileToken) {
      return NextResponse.json(
        { error: '请填写所有必填项' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6个字符' },
        { status: 400 }
      );
    }

    if (nickname.length > 20) {
      return NextResponse.json(
        { error: '昵称不能超过20个字符' },
        { status: 400 }
      );
    }

    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const isTurnstileValid = await verifyTurnstileToken(turnstileToken, remoteIp);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: '人机验证失败，请重试' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 使用Supabase Auth注册
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        }
      }
    });

    if (authError) {
      console.error('Register auth error:', authError);
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: '注册失败，请稍后重试' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '注册失败' },
        { status: 400 }
      );
    }

    /** 注册成功后，将用户资料写入 Neon。 */
    let profileId = 0;
    try {
      const profile = await upsertUserProfile({
        authId: authData.user.id,
        email,
        nickname,
      });
      profileId = profile.profile_id;
    } catch (profileError) {
      console.error('Create profile in Neon error:', profileError);
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        profile_id: profileId,
        email: email,
        nickname: nickname,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    const message =
      error instanceof Error ? error.message : String(error);
    /** 常见：Supabase 未配置或网络异常，便于在日志中区分 */
    if (message.includes('COZE_SUPABASE') || message.includes('is not set')) {
      return NextResponse.json(
        {
          error:
            '注册服务未就绪：请检查服务端是否已配置 COZE_SUPABASE_URL 与 COZE_SUPABASE_ANON_KEY',
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
