import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  getUserProfileByAuthId,
  upsertUserProfile,
  updateUserProfileByAuthId,
} from '@/server/db/user-profiles';

export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, avatar_url } = body;

    // 更新用户资料
    const updateData: { nickname?: string; avatar_url?: string } = {};
    
    if (nickname !== undefined) {
      if (nickname.length > 20) {
        return NextResponse.json(
          { error: '昵称不能超过20个字符' },
          { status: 400 }
        );
      }
      updateData.nickname = nickname;
    }
    
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }
    
    /** 优先更新 Neon；若资料不存在则补建一条。 */
    let data = await updateUserProfileByAuthId(user.id, {
      nickname: updateData.nickname,
      avatar_url: updateData.avatar_url,
    });
    if (!data) {
      const existing = await getUserProfileByAuthId(user.id);
      data = await upsertUserProfile({
        authId: user.id,
        email: existing?.email || user.email || '',
        nickname: updateData.nickname || existing?.nickname || '新用户',
        avatarUrl: updateData.avatar_url ?? existing?.avatar_url ?? null,
      });
    }

    return NextResponse.json({
      user: {
        id: data?.auth_id || user.id,
        profile_id: data?.profile_id || 0,
        email: data?.email || '',
        nickname: data?.nickname || '',
        avatar_url: data?.avatar_url,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
