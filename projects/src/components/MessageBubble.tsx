'use client';

import { useState } from 'react';
import { Message } from '@/types/chat';
import { VoicePlayer } from './VoicePlayer';
import { ImageViewer } from './ImageViewer';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  characterAvatar?: string;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  characterAvatar,
  showAvatar = true,
}: MessageBubbleProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isUser = message.role === 'user';

  // 用户头像
  const userAvatar = (
    <div className="w-10 h-10 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
      我
    </div>
  );

  // 处理图片错误
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <>
      <div className={cn('flex gap-2 px-4', isUser && 'flex-row-reverse')}>
        {/* 头像 */}
        {showAvatar && (
          isUser ? (
            userAvatar
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0 overflow-hidden">
              {characterAvatar ? (
                <img
                  src={characterAvatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>?</span>
              )}
            </div>
          )
        )}

        {/* 消息内容 */}
        <div className={cn('max-w-[70%] flex flex-col gap-1', isUser && 'items-end')}>
          {/* 文字/语音消息 */}
          {message.content && (
            <div
              className={cn(
                'px-4 py-2 rounded-2xl text-base leading-relaxed',
                isUser
                  ? 'bg-[#95EC69] text-gray-800 rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
              )}
            >
              {message.type === 'voice' && message.audioUri ? (
                <VoicePlayer audioUri={message.audioUri} text={message.content} />
              ) : (
                <p className="whitespace-pre-wrap break-all">{message.content}</p>
              )}
            </div>
          )}

          {/* 图片消息 */}
          {message.type === 'image' && message.imageUri && (
            <div
              className={cn(
                'rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-[1.02]',
                !isUser && 'rounded-bl-md'
              )}
              onClick={() => setViewingImage(message.imageUri!)}
            >
              <div className="relative bg-gray-100 rounded-2xl">
                {/* 加载占位 */}
                {!imageLoaded && !imageError && (
                  <div className="w-[240px] h-[160px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {/* 错误占位 */}
                {imageError && (
                  <div className="w-[240px] h-[160px] flex flex-col items-center justify-center bg-gray-200 rounded-2xl">
                    <span className="text-gray-400 text-sm">图片加载失败</span>
                  </div>
                )}
                
                {/* 图片 */}
                {!imageError && (
                  <img
                    src={message.imageUri}
                    alt="发送的图片"
                    className={cn(
                      'max-w-[240px] rounded-2xl transition-opacity duration-300',
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={handleImageError}
                  />
                )}
              </div>
            </div>
          )}

          {/* 时间戳 */}
          <span className="text-xs text-gray-400 px-1">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* 图片查看器 */}
      {viewingImage && (
        <ImageViewer imageUri={viewingImage} onClose={() => setViewingImage(null)} />
      )}
    </>
  );
}
