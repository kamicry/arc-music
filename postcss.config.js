// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {}, // 如果你需要 @import 支持
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: { // 生产环境压缩 CSS
        preset: 'default',
      }
    } : {})
  },
}
