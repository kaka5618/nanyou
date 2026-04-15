'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Character, Message, ChatState, ChatContextType } from '@/types/chat';
import { parseReply, enhanceImagePrompt } from '@/utils/parseReply';
import { cleanTextForSpeech, canGenerateSpeech } from '@/utils/cleanText';

// 初始状态
const initialState: ChatState = {
  character: null,
  messages: [],
  isTyping: false,
  isGeneratingImage: false,
  imageCount: 0,
};

// 创建Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 带超时和更完善错误处理的fetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw error;
  }
}

// Provider组件
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatState, setChatState] = useState<ChatState>(initialState);
  const isGeneratingRef = useRef(false);

  // 选择角色
  const selectCharacter = useCallback((character: Character) => {
    setChatState({
      ...initialState,
      character,
    });
  }, []);

  // 重置聊天
  const resetChat = useCallback(() => {
    setChatState(initialState);
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    // 防止重复请求
    if (isGeneratingRef.current || !chatState.character) return;
    isGeneratingRef.current = true;

    // 保存character引用
    const character = chatState.character;

    // 1. 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'text',
      content,
      timestamp: Date.now(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    try {
      // 2. 准备对话历史
      const chatHistory = chatState.messages.map(msg => ({
        role: msg.role === 'character' ? 'assistant' : 'user',
        content: msg.content,
      }));

      // 检查最近图片数量，控制发图频率
      const recentImages = chatState.messages.slice(-8).filter(m => m.imageUri).length;
      const shouldLimitImage = recentImages >= 2;

      // 3. 调用LLM
      const chatResponse = await fetchWithTimeout('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          systemPrompt: character.systemPrompt,
          messages: chatHistory,
          limitImage: shouldLimitImage,
        }),
      });

      if (!chatResponse.ok) {
        const raw = await chatResponse.text().catch(() => '');
        let apiMessage = '';
        try {
          const errJson = JSON.parse(raw) as { error?: string; code?: string };
          if (typeof errJson.error === 'string' && errJson.error) {
            apiMessage = errJson.error;
          }
        } catch {
          /* 非 JSON */
        }
        console.error('Chat API error:', chatResponse.status, raw);
        throw new Error(
          apiMessage || `请求失败（${chatResponse.status}），请稍后再试`,
        );
      }

      const data = await chatResponse.json();
      
      // 检查API返回的错误
      if (data.error) {
        throw new Error(data.error);
      }

      const { reply } = data;

      // 4. 解析回复
      const { text, imagePrompt, imageUri } = parseReply(reply || '');

      // 如果没有回复，使用默认回复
      const finalText = text || '嗯...让我想想怎么说～';

      // 5. 添加角色文字消息
      const characterMessage: Message = {
        id: `char-${Date.now()}`,
        role: 'character',
        type: 'text',
        content: finalText,
        timestamp: Date.now(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, characterMessage],
        isTyping: false,
      }));

      // 6. 并行处理：TTS + 图片生成
      const tasks: Promise<void>[] = [];

      // TTS 任务
      const cleanedText = cleanTextForSpeech(finalText);
      if (canGenerateSpeech(finalText)) {
        tasks.push(
          (async () => {
            try {
              const ttsResponse = await fetchWithTimeout('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: cleanedText,
                  speaker: character.speaker,
                  uid: `uid-${Date.now()}`,
                }),
              }, 15000);

              if (ttsResponse.ok) {
                const ttsData = await ttsResponse.json();
                if (ttsData.audioUri) {
                  setChatState(prev => ({
                    ...prev,
                    messages: prev.messages.map(msg =>
                      msg.id === characterMessage.id
                        ? { ...msg, audioUri: ttsData.audioUri, type: 'voice' as const }
                        : msg
                    ),
                  }));
                }
              }
            } catch (err) {
              // TTS失败静默处理，不影响用户体验
              console.warn('TTS generation failed:', err);
            }
          })()
        );
      }

      // 图片处理任务
      if (imagePrompt && !shouldLimitImage) {
        setChatState(prev => ({ ...prev, isGeneratingImage: true }));

        tasks.push(
          (async () => {
            try {
              const enhancedPrompt = enhanceImagePrompt(
                imagePrompt,
                character.appearance
              );

              const imageResponse = await fetchWithTimeout('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: enhancedPrompt,
                  uid: `uid-${Date.now()}`,
                }),
              }, 30000);

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                if (imageData.imageUri) {
                  const imageMessage: Message = {
                    id: `img-${Date.now()}`,
                    role: 'character',
                    type: 'image',
                    content: '',
                    imageUri: imageData.imageUri,
                    imagePrompt,
                    timestamp: Date.now(),
                  };

                  setChatState(prev => ({
                    ...prev,
                    messages: [...prev.messages, imageMessage],
                    imageCount: prev.imageCount + 1,
                    isGeneratingImage: false,
                  }));
                }
              }
            } catch (err) {
              console.warn('Image generation failed:', err);
              setChatState(prev => ({ ...prev, isGeneratingImage: false }));
            }
          })()
        );
      } else if (imageUri) {
        // LLM直接返回了图片URL
        const imageMessage: Message = {
          id: `img-${Date.now()}`,
          role: 'character',
          type: 'image',
          content: '',
          imageUri,
          timestamp: Date.now(),
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, imageMessage],
          imageCount: prev.imageCount + 1,
        }));
      }

      await Promise.all(tasks);
    } catch (error) {
      console.error('Send message error:', error);
      
      // 失败时添加默认回复
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'character',
        type: 'text',
        content: '网络不太好，等一下再试试～',
        timestamp: Date.now(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        isGeneratingImage: false,
      }));
    } finally {
      isGeneratingRef.current = false;
    }
  }, [chatState.character, chatState.messages]);

  const value: ChatContextType = {
    chatState,
    selectCharacter,
    sendMessage,
    resetChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// 自定义hook
export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
