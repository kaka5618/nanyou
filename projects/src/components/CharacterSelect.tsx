'use client';

import { Character } from '@/types/chat';
import { getAllCharacters } from '@/data/characters';
import { useChat } from '@/context/ChatContext';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { GradientCard } from '@/components/ui/gradient-card';

/**
 * 角色卡片图（Unsplash）。
 */
const CARD_IMAGES: Record<string, string> = {
  'warm-boy':
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
  'cool-guy':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
  sunshine:
    'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80',
  artsy:
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
};

/**
 * 角色卡片样式映射。
 */
const CARD_STYLE: Record<
  string,
  {
    gradient: 'orange' | 'gray' | 'purple' | 'green';
    badgeColor: string;
  }
> = {
  'warm-boy': { gradient: 'orange', badgeColor: '#F59E0B' },
  'cool-guy': { gradient: 'gray', badgeColor: '#4B5563' },
  sunshine: { gradient: 'green', badgeColor: '#10B981' },
  artsy: { gradient: 'purple', badgeColor: '#8B5CF6' },
};

export function CharacterSelect() {
  const { selectCharacter } = useChat();
  const characters = getAllCharacters();

  return (
    <AuroraBackground
      showRadialGradient={false}
      className="h-[calc(100vh-3.5rem)] overflow-hidden bg-transparent p-6"
    >
      {/* 标题 */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold text-gray-800 dark:text-gray-100">
          男友模拟器
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-300">
          选择你的专属男友，开始聊天吧
        </p>
      </div>

      {/* 角色卡片网格 */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onSelect={() => selectCharacter(character)}
          />
        ))}
      </div>

      {/* 底部提示 */}
      <p className="mt-10 text-center text-sm text-gray-400 dark:text-gray-500">
        刷新页面后对话将清空，请放心体验
      </p>
    </AuroraBackground>
  );
}

interface CharacterCardProps {
  character: Character;
  onSelect: () => void;
}

function CharacterCard({ character, onSelect }: CharacterCardProps) {
  const cardImage = CARD_IMAGES[character.id];
  const style = CARD_STYLE[character.id];

  return (
    <GradientCard
      badgeText={character.tags[0] || '可互动'}
      badgeColor={style.badgeColor}
      title={character.name}
      description={character.tagline}
      ctaText="和他聊天"
      ctaHref="#"
      imageUrl={cardImage}
      gradient={style.gradient}
      onCtaClick={onSelect}
    />
  );
}
