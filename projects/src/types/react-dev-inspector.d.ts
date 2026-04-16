declare module 'react-dev-inspector' {
  import type { ComponentType } from 'react';

  /**
   * 开发依赖在仅生产依赖的构建中可不安装；此处仅满足类型检查。
   */
  export const Inspector: ComponentType;
}
