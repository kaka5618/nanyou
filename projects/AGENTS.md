# 男友模拟器 - 项目开发文档

## 1. 项目概述

AI虚拟恋爱聊天产品：用户选择一个有人设的虚拟男友角色，通过文字聊天互动。支持语音消息和AI生成照片，让对话更加真实有趣。

## 2. 技术栈

- **框架**: Next.js 16 (App Router)
- **核心**: React 19
- **语言**: TypeScript 5
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **AI集成**: coze-coding-dev-sdk (LLM + TTS + 图像生成)

## 3. 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # LLM对话生成API
│   │   ├── tts/route.ts       # TTS语音合成API
│   │   └── image/route.ts     # AI图像生成API
│   ├── layout.tsx             # 全局布局
│   └── page.tsx               # 主页面（角色选择/聊天界面）
├── components/
│   ├── ui/                   # shadcn/ui组件库
│   ├── CharacterSelect.tsx    # 角色选择界面
│   ├── ChatScreen.tsx         # 聊天主界面
│   ├── MessageBubble.tsx      # 消息气泡组件
│   ├── VoicePlayer.tsx        # 语音播放器
│   ├── ImageViewer.tsx        # 图片查看器
│   └── TypingIndicator.tsx    # 正在输入动画
├── context/
│   └── ChatContext.tsx        # 聊天状态管理
├── data/
│   └── characters.ts           # 角色数据和系统提示词
├── types/
│   └── chat.ts                 # 类型定义
└── utils/
    ├── parseReply.ts           # 解析LLM回复
    └── cleanText.ts            # 文本清理（TTS用）
```

## 4. 功能特性

### 4.1 角色选择
- 4个预设角色：林屿（温柔学长）、顾冽（高冷总监）、苏晨（阳光大男孩）、沈默（文艺音乐人）
- 每个角色有独立的性格、说话风格、系统提示词
- 角色头像使用emoji表示

### 4.2 聊天功能
- 微信风格的聊天界面
- 支持文字消息、语音消息、图片消息
- TTS自动生成语音，不同角色不同声线
- AI图像生成（角色自拍、生活照等）
- 消息自动滚动到最新

### 4.3 角色人设
每个角色都有完整的：
- 基本信息（名字、年龄、职业、外貌特征）
- 性格描述
- 说话风格（语气词、口头禅）
- 和用户的关系设定
- 发图规则

## 5. API接口

### 5.1 /api/chat
对话生成接口
```typescript
// 请求
{ characterId, systemPrompt, messages, limitImage? }

// 响应
{ reply: string } // 可能包含 [IMAGE: ...] 标记
```

### 5.2 /api/tts
语音合成接口
```typescript
// 请求
{ text, speaker, uid }

// 响应
{ audioUri: string, audioSize: number }
```

### 5.3 /api/image
图像生成接口
```typescript
// 请求
{ prompt, uid }

// 响应
{ imageUri: string }
```

## 6. 开发命令

```bash
# 开发环境
pnpm run dev   # 端口5000，支持HMR

# 生产构建
pnpm run build

# 生产环境
pnpm run start
```

## 7. 关键实现

### 7.1 图片标记解析
LLM回复中使用 `[IMAGE: 图片描述]` 标记发图请求，前端解析后调用图像生成API。

### 7.2 并行处理
- 文字消息立即显示
- TTS和图像生成并行处理
- 图片生成完成后异步显示

### 7.3 发图频率控制
- 约每3-5轮对话触发一次发图
- 用户明确要求时（如"想看你"）必须发图
- 系统提示词中明确限制发图频率

## 8. 注意事项

- 刷新页面后对话清空，不做数据持久化
- 不需要用户登录注册
- 不支持NSFW内容
- 只支持单人聊天
