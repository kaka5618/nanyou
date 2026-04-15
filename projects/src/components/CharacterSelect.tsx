'use client';

import { Character } from '@/types/chat';
import { getAllCharacters } from '@/data/characters';
import { useChat } from '@/context/ChatContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 角色头像图片路径
const AVATAR_IMAGES: Record<string, string> = {
  'warm-boy': '/avatars/warm-boy.jpg',
  'cool-guy': '/avatars/cool-guy.jpg',
  'sunshine': '/avatars/sunshine.jpg',
  'artsy': '/avatars/artsy.jpg',
};

export function CharacterSelect() {
  const { selectCharacter } = useChat();
  const characters = getAllCharacters();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col items-center justify-center p-6">
      {/* 标题 */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          男友模拟器
        </h1>
        <p className="text-gray-500 text-lg">
          选择你的专属男友，开始聊天吧
        </p>
      </div>

      {/* 角色卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onSelect={() => selectCharacter(character)}
          />
        ))}
      </div>

      {/* 底部提示 */}
      <p className="mt-10 text-sm text-gray-400 text-center">
        刷新页面后对话将清空，请放心体验
      </p>
    </div>
  );
}

interface CharacterCardProps {
  character: Character;
  onSelect: () => void;
}

function CharacterCard({ character, onSelect }: CharacterCardProps) {
  const avatarImage = AVATAR_IMAGES[character.id];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative bg-white rounded-3xl p-6 shadow-lg',
        'hover:shadow-xl transition-all duration-300',
        'hover:scale-[1.02] hover:-translate-y-1',
        'text-left w-full',
        'focus:outline-none focus:ring-4 focus:ring-purple-300'
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'w-24 h-24 rounded-full overflow-hidden mb-4',
          'ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all',
          'shadow-lg'
        )}
      >
        <img
          src={avatarImage}
          alt={character.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 如果图片加载失败，显示首字母
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.fallback-avatar')) {
              const fallback = document.createElement('div');
              fallback.className = 'fallback-avatar w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold';
              fallback.textContent = character.name.charAt(0);
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* 名字 */}
      <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
        {character.name}
      </h2>

      {/* 一句话介绍 */}
      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
        {character.tagline}
      </p>

      {/* 性格标签 */}
      <div className="flex flex-wrap gap-1.5">
        {character.tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* 悬停效果 */}
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-purple-300 transition-colors pointer-events-none" />
    </button>
  );
}
