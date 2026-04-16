'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

type DevInspectorProps = {
  /** 由服务端根据 `COZE_PROJECT_ENV` 传入，与原先 layout 行为一致 */
  enabled: boolean;
};

/**
 * 仅在本地 Coze 开发环境且 `NODE_ENV` 为 development 时动态加载 Inspector，
 * 避免根布局对 `react-dev-inspector` 做静态解析（利于仅安装生产依赖的构建场景）。
 */
export function DevInspector({ enabled }: DevInspectorProps) {
  const [Inspector, setInspector] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;
    let cancelled = false;
    void import('react-dev-inspector')
      .then((mod) => {
        if (!cancelled) setInspector(() => mod.Inspector);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!Inspector) return null;
  return <Inspector />;
}
