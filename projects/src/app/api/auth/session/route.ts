import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 获取当前用户会话
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ user: null });
    }

    // 获取用户资料
    const { data: profile, error: profileError } = await client
      .from('user_profiles')
      .select('profile_id, auth_id, email, nickname, avatar_url')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Get profile error:', profileError);
    }

    if (profile) {
      return NextResponse.json({
        user: {
          id: profile.auth_id,
          profile_id: profile.profile_id,
          email: profile.email,
          nickname: profile.nickname,
          avatar_url: profile.avatar_url,
        }
      });
    }

    // 如果没有资料，可能是新登录用户
    return NextResponse.json({
      user: {
        id: user.id,
        profile_id: 0,
        email: user.email || '',
        nickname: '新用户',
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
