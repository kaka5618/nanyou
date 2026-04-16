import type { Metadata } from 'next';
import './globals.css';
import { DevInspector } from '@/components/DevInspector';
import { ChatProvider } from '@/context/ChatContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: {
    default: '男友模拟器',
    template: '%s | 男友模拟器',
  },
  description:
    '选择你的专属AI虚拟男友，开始一段甜蜜的聊天体验。支持语音消息和AI生成照片，让对话更加真实有趣。',
  keywords: [
    'AI聊天',
    '虚拟男友',
    '男友模拟器',
    '角色扮演',
    '陪伴',
    '聊天机器人',
  ],
  authors: [{ name: '男友模拟器' }],
  generator: 'Coze Code',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cozeDevInspector = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <DevInspector enabled={cozeDevInspector} />
        <AuthProvider>
          <ChatProvider>{children}</ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
