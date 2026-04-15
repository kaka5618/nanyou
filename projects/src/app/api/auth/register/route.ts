import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { upsertUserProfile } from '@/server/db/user-profiles';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname } = await request.json();

    if (!email || !password || !nickname) {
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
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
