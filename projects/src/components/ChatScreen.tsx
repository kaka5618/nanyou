'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 角色头像颜色映射
const AVATAR_COLORS: Record<string, string> = {
  'warm-boy': 'from-amber-400 to-orange-500',
  'cool-guy': 'from-slate-600 to-slate-800',
  'sunshine': 'from-yellow-400 to-amber-500',
  'artsy': 'from-purple-500 to-indigo-600',
};

const AVATAR_EMOJI: Record<string, string> = {
  'warm-boy': '🌊',
  'cool-guy': '❄️',
  'sunshine': '☀️',
  'artsy': '🎸',
};

export function ChatScreen() {
  const { chatState, sendMessage, resetChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isGeneratingRef = useRef(false);

  const character = chatState.character;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, chatState.isTyping]);

  // 处理发送消息
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setInputValue('');
    
    await sendMessage(text);
    
    isGeneratingRef.current = false;
    inputRef.current?.focus();
  };

  // 处理键盘发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!character) {
    return null;
  }

  const colorClass = AVATAR_COLORS[character.id] || 'from-gray-400 to-gray-500';
  const emoji = AVATAR_EMOJI[character.id] || '👤';

  return (
    <div className="flex flex-col h-screen bg-[#EDEDED]">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={resetChat}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div
          className={cn(
            'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl',
            colorClass
          )}
        >
          {emoji}
        </div>
        
        <div className="flex-1">
          <h1 className="font-semibold text-gray-800">{character.name}</h1>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            在线
          </p>
        </div>
      </header>

      {/* 消息区域 */}
      <main className="flex-1 overflow-y-auto py-4">
        <div className="max-w-xl mx-auto space-y-4">
          {chatState.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              characterAvatar={character.avatar}
            />
          ))}

          {/* 正在输入指示器 */}
          {chatState.isTyping && (
            <div className="flex gap-2 px-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl',
                  colorClass
                )}
              >
                {emoji}
              </div>
              <TypingIndicator name={character.name} className="mt-2" />
            </div>
          )}

          {/* 图片生成中指示器 */}
          {chatState.isGeneratingImage && (
            <div className="flex gap-2 px-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl',
                  colorClass
                )}
              >
                {emoji}
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">正在生成照片...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 底部输入区域 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-2xl px-4 py-2.5',
              'bg-gray-100 border-0 focus:ring-2 focus:ring-purple-300',
              'text-gray-800 placeholder:text-gray-400',
              'max-h-32 overflow-y-auto'
            )}
            style={{
              minHeight: '42px',
            }}
          />
          
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || chatState.isTyping}
            size="icon"
            className={cn(
              'w-10 h-10 rounded-full flex-shrink-0',
              'bg-[#07C160] hover:bg-[#06AD56]',
              'transition-all duration-200',
              (!inputValue.trim() || chatState.isTyping) && 'opacity-50'
            )}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
