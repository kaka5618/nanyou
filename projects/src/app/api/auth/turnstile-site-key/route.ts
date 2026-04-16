import { NextResponse } from 'next/server';

/**
 * 向浏览器返回 Turnstile 站点密钥（公开值）。
 * 在 Vercel 上优先读 `TURNSTILE_SITE_KEY`，避免仅配置服务端可见变量时
 *客户端 bundle 未包含 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 而导致组件无法渲染。
 */
export async function GET() {
  const siteKey =
    process.env.TURNSTILE_SITE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    '';

  return NextResponse.json({ siteKey });
}
