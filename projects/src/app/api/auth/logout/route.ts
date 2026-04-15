import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST() {
  try {
    const client = getSupabaseClient();
    
    // 登出
    const { error } = await client.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // 即使失败也返回成功
  }
}
