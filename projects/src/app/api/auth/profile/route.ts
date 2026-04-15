import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
    const updateData: { nickname?: string; avatar_url?: string; updated_at?: string } = {};
    
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
    
    updateData.updated_at = new Date().toISOString();

    const { data, error: updateError } = await client
      .from('user_profiles')
      .update(updateData)
      .eq('auth_id', user.id)
      .select('profile_id, auth_id, email, nickname, avatar_url')
      .maybeSingle();

    if (updateError) {
      console.error('Update profile error:', updateError);
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      );
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
