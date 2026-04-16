'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Heart } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * `NEXT_PUBLIC_*` 仅在构建时写入客户端；Vercel 上若漏配或部署未重建，浏览器里会为空。
   * 通过 `/api/auth/turnstile-site-key` 在请求时读取 `TURNSTILE_SITE_KEY`（或回退到 NEXT_PUBLIC）以拿到密钥。
   */
  const [turnstileKeyFromApi, setTurnstileKeyFromApi] = useState<string | null>(null);

  const bakedTurnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();

  const { login, register } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // 切换tab时清空表单
  useEffect(() => {
    setEmail('');
    setPassword('');
    setNickname('');
    setTurnstileToken('');
    setError('');
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'register') {
      setTurnstileKeyFromApi(null);
      return;
    }
    let cancelled = false;
    setTurnstileKeyFromApi(null);
    void fetch('/api/auth/turnstile-site-key')
      .then((res) => res.json() as Promise<{ siteKey?: string }>)
      .then((data) => {
        if (!cancelled) setTurnstileKeyFromApi(data.siteKey?.trim() ?? '');
      })
      .catch(() => {
        if (!cancelled) setTurnstileKeyFromApi('');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab]);

  const effectiveTurnstileSiteKey = (
    turnstileKeyFromApi !== null
      ? turnstileKeyFromApi || bakedTurnstileSiteKey
      : bakedTurnstileSiteKey
  ).trim();

  const isTurnstileKeyPending =
    activeTab === 'register' && isOpen && turnstileKeyFromApi === null && !bakedTurnstileSiteKey;

  // ESC关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const result = await login(email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || '登录失败');
        }
      } else {
        if (!nickname.trim()) {
          setError('请输入昵称');
          setIsLoading(false);
          return;
        }
        if (!effectiveTurnstileSiteKey) {
          setError(
            '当前环境未配置验证码：请在 Vercel 设置 TURNSTILE_SITE_KEY 或 NEXT_PUBLIC_TURNSTILE_SITE_KEY 后重新部署',
          );
          setIsLoading(false);
          return;
        }
        if (!turnstileToken) {
          setError('请在下方的验证框中完成人机验证');
          setIsLoading(false);
          return;
        }
        const result = await register(email, password, nickname, turnstileToken);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || '注册失败');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗主体 */}
      <div 
        ref={modalRef}
        className="relative flex max-h-[min(92dvh,760px)] w-full max-w-[400px] flex-col mx-4 overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 顶部装饰 */}
        <div className="flex h-24 shrink-0 items-center justify-center bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
              <h2 className="text-2xl font-bold text-white">男友模拟器</h2>
              <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
            </div>
            <p className="text-white/80 text-sm">和心仪的男孩谈恋爱吧~</p>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Tab切换 */}
        <div className="flex shrink-0 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('login')}
            className={cn(
              'flex-1 py-4 text-center font-medium transition-colors relative',
              activeTab === 'login' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            登录
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={cn(
              'flex-1 py-4 text-center font-medium transition-colors relative',
              activeTab === 'register' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            注册
            {activeTab === 'register' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>

        {/* 表单内容 */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-6"
        >
          {/* 昵称（仅注册） */}
          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">昵称</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="给自己取个甜蜜的昵称"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  maxLength={20}
                />
              </div>
            </div>
          )}

          {/* 邮箱 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入你的邮箱地址"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* 密码 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">人机验证</p>
              {isTurnstileKeyPending ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-600">
                  正在加载验证组件…
                </div>
              ) : !effectiveTurnstileSiteKey ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  未检测到站点密钥：请在 Vercel → Settings → Environment Variables 添加{' '}
                  <code className="rounded bg-amber-100/80 px-1">TURNSTILE_SITE_KEY</code>（推荐，与
                  Cloudflare 站点密钥相同）或{' '}
                  <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>
                  ，保存后执行 <strong>Redeploy</strong>。Cloudflare 里请把{' '}
                  <code className="rounded bg-amber-100/80 px-1">nanyou-ten.vercel.app</code>{' '}
                  加入站点的主机名列表，小组件类型建议用「托管」。
                </div>
              ) : (
                <div className="flex min-h-[72px] w-full justify-center overflow-visible py-1">
                  <Turnstile
                    key={`${isOpen}-${activeTab}-${effectiveTurnstileSiteKey.slice(0, 8)}`}
                    siteKey={effectiveTurnstileSiteKey}
                    options={{
                      appearance: 'always',
                      theme: 'auto',
                      size: 'normal',
                      language: 'zh-CN',
                    }}
                    scriptOptions={{ appendTo: 'body' }}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setError('');
                    }}
                    onExpire={() => {
                      setTurnstileToken('');
                    }}
                    onError={() => {
                      setTurnstileToken('');
                      setError('人机验证加载失败，请检查网络或域名是否在 Cloudflare 站点密钥的主机名列表中');
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                处理中...
              </span>
            ) : activeTab === 'login' ? (
              '登录'
            ) : (
              '注册'
            )}
          </button>

          {/* 提示文字 */}
          <p className="text-center text-sm text-gray-400">
            {activeTab === 'login' ? (
              <>还没有账号？<button type="button" onClick={() => setActiveTab('register')} className="text-purple-500 hover:underline">立即注册</button></>
            ) : (
              <>已有账号？<button type="button" onClick={() => setActiveTab('login')} className="text-purple-500 hover:underline">直接登录</button></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
