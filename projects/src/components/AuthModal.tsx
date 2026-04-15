'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Heart } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // 切换tab时清空表单
  useEffect(() => {
    setEmail('');
    setPassword('');
    setNickname('');
    setError('');
  }, [activeTab]);

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
        const result = await register(email, password, nickname);
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
        className="relative w-full max-w-[400px] mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 顶部装饰 */}
        <div className="h-24 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 flex items-center justify-center">
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
        <div className="flex border-b border-gray-100">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* 错误提示 */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
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
