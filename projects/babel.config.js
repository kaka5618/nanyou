/**
 * 生产构建不加载 react-dev-inspector，避免 Vercel 上找不到 devDependency。
 * Next.js Babel loader 仅支持 `babel.config.js` / `.babelrc`，不支持 `.cjs` / `.mjs`。
 */
module.exports = function babelConfig(api) {
  api.cache(true);
  const isProd = process.env.NODE_ENV === 'production';

  return {
    presets: [
      [
        'next/babel',
        {
          'preset-react': {
            development: !isProd,
          },
        },
      ],
    ],
    plugins: isProd ? [] : ['@react-dev-inspector/babel-plugin'],
  };
};
