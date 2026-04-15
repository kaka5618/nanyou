import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserProfileByAuthId } from '@/server/db/user-profiles';

export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 获取当前用户会话
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ user: null });
    }

    /** 从 Neon 读取用户资料。 */
    const profile = await getUserProfileByAuthId(user.id).catch((profileError) => {
      console.error('Get profile from Neon error:', profileError);
      return null;
    });

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
