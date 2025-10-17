// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 配置content选项，指定Tailwind CSS需要扫描哪些文件中的类名
  content: [
    // 扫描pages目录下的所有JS、TS、JSX、TSX文件
    "./pages/**/*.{js,ts,jsx,tsx}",
    // 如果您使用的是Next.js 13+的App Router，请包含app目录
    "./app/**/*.{js,ts,jsx,tsx}",
    // 扫描components目录下的所有组件文件
    "./components/**/*.{js,ts,jsx,tsx}",
    // 如果您的样式类名存在于其他目录或文件中，请务必在此添加路径
  ],
  theme: {
    extend: {
      // 您可以在这里扩展自定义的主题配置，例如颜色、字体等
      colors: {
        // 定义自定义颜色
      },
      animation: {
        // 定义自定义动画
      }
    },
  },
  plugins: [],
}
