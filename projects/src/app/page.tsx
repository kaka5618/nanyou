'use client';

import { useChat } from '@/context/ChatContext';
import { CharacterSelect } from '@/components/CharacterSelect';
import { ChatScreen } from '@/components/ChatScreen';
import { Header } from '@/components/Header';

export default function Home() {
  const { chatState } = useChat();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      {/* 主内容区域 */}
      <main className="pt-14">
        {chatState.character ? (
          <ChatScreen />
        ) : (
          <CharacterSelect />
        )}
      </main>
    </div>
  );
}
