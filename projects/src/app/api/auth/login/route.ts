import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserProfileByAuthId } from '@/server/db/user-profiles';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '请填写邮箱和密码' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 使用Supabase Auth登录
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Login auth error:', authError);
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '登录失败' },
        { status: 401 }
      );
    }

    /** 登录后从 Neon 获取用户资料。 */
    const profile = await getUserProfileByAuthId(authData.user.id).catch((profileError) => {
      console.error('Get profile from Neon error:', profileError);
      return null;
    });

    return NextResponse.json({
      user: {
        id: authData.user.id,
        profile_id: profile?.profile_id || 0,
        email: profile?.email || authData.user.email || email,
        nickname: profile?.nickname || '新用户',
        avatar_url: profile?.avatar_url,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
