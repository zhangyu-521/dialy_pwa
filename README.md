# 📔 Daily Diary - 本地日记 PWA

[![Vue 3](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Supported-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 🎯 **Vibe Coding Project** - 使用 AI 辅助编程构建的纯前端日记应用

一个简洁优雅的本地日记应用，支持富文本编辑、图片上传、标签管理、数据导入导出，可安装为 PWA 离线使用。所有数据存储在浏览器本地，保护隐私。

![Diary PWA Screenshot](./screenshot.png)

## ✨ 功能特性

### 📝 日记编辑
- 富文本编辑器，支持 Markdown 语法
- 图片上传（文件选择/粘贴/拖拽）
- 多图片支持，可预览和删除
- 标签系统，支持多标签分类
- 自动保存日期时间

### 🔍 日记管理
- 按时间倒序展示日记列表
- 全文搜索（标题/内容/标签）
- 按标签筛选日记
- 显示日记字数和图片数量

### 💾 数据管理
- **导出功能**：支持 JSON 和 ZIP 两种格式
  - ZIP 格式：体积小，适合图片多的日记
  - JSON 格式：单文件，适合纯文字日记
- **导入功能**：从备份文件恢复数据
- **重复处理**：导入时自动检测重复，支持跳过/覆盖/重命名

### 📱 PWA 支持
- 可安装到桌面/主屏幕
- 离线使用
- 响应式设计，适配移动端

## 🛠️ 技术栈

| 领域 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 | Composition API，响应式编程 |
| **构建工具** | Vite | 快速开发，热更新 |
| **类型系统** | TypeScript | 类型安全，更好的 IDE 支持 |
| **样式方案** | Tailwind CSS | 原子化 CSS，快速开发 |
| **数据存储** | IndexedDB | 浏览器本地数据库，大容量存储 |
| **图片存储** | IndexedDB (Blob) | 二进制存储，高效存取 |
| **PWA** | vite-plugin-pwa | Service Worker，离线缓存 |
| **文件处理** | JSZip | ZIP 压缩/解压，导入导出 |

## 🤖 AI 辅助编程 (Vibe Coding)

本项目使用 **Kimi AI** 辅助开发，采用 Vibe Coding 模式：

- **AI 模型**: Kimi (Moonshot AI)
- **开发方式**: 自然语言描述需求，AI 生成代码
- **迭代优化**: 通过对话不断调整和完善功能
- **代码审查**: AI 帮助检查错误和优化建议

### Vibe Coding 优势
- 快速原型开发
- 减少样板代码编写
- 专注产品逻辑而非语法细节
- 适合个人项目和 MVP 开发

## 📁 项目结构

```
dialy_pwa/
├── public/                     # 静态资源
│   ├── manifest.json          # PWA 配置
│   ├── favicon.svg            # 网站图标
│   ├── icon-192x192.png       # PWA 图标
│   └── icon-512x512.png       # PWA 大图标
├── src/
│   ├── assets/
│   │   └── style.css          # 全局样式
│   ├── components/
│   │   ├── DiaryList.vue      # 日记列表组件
│   │   └── Editor.vue         # 编辑器组件
│   ├── utils/
│   │   ├── db.ts              # IndexedDB 日记数据操作
│   │   ├── imageStore.ts      # IndexedDB 图片存储
│   │   └── exportImport.ts    # 导入导出功能
│   ├── App.vue                # 主应用组件
│   ├── main.ts                # 入口文件
│   └── vite-env.d.ts          # 类型声明
├── index.html                 # HTML 入口
├── package.json               # 依赖配置
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
├── .gitignore                 # Git 忽略文件
└── README.md                  # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:5173

### 构建生产版本
```bash
npm run build
```
构建输出在 `dist/` 目录

### 预览生产版本
```bash
npm run preview
```

## 📦 部署

### GitHub Pages（推荐）
本项目已配置 GitHub Actions 自动部署到 GitHub Pages：

1. 在仓库设置中启用 GitHub Pages
   - 进入 Settings → Pages
   - Source 选择 "GitHub Actions"

2. 每次 push 到 main 分支会自动触发部署

3. 访问地址：`https://zhangyu-521.github.io/dialy_pwa/`

### 手动部署到其他平台
将 `dist/` 目录部署到任何静态托管服务：
- Vercel
- Netlify
- Cloudflare Pages

### PWA 安装
1. 使用 Chrome/Edge/Safari 访问网站
2. 浏览器会提示"添加到主屏幕"
3. 安装后可离线使用

## 🔄 数据备份与恢复

### 导出数据
1. 点击右上角「备份」按钮
2. 选择导出格式（ZIP/JSON）
3. 下载备份文件

### 导入数据
1. 点击「备份」→「导入日记」
2. 选择之前导出的 `.json` 或 `.zip` 文件
3. 自动导入，重复的日记会被跳过

### 数据格式
```json
{
  "version": "1.0.0",
  "exportAt": 1709836800000,
  "app": "daily-diary",
  "format": "json",
  "data": {
    "diaries": [...]
  },
  "meta": {
    "totalDiaries": 100,
    "totalImages": 50,
    "totalSize": 1024000
  }
}
```

## 🛣️ 路线图

- [x] 基础日记功能
- [x] 图片上传支持
- [x] 标签系统
- [x] 数据导入导出
- [x] PWA 支持
- [ ] 日记加密
- [ ] Markdown 预览模式
- [ ] 日记统计图表
- [ ] 多设备同步

## 🤝 贡献

欢迎提交 Issue 和 PR！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [JSZip](https://stuk.github.io/jszip/) - JavaScript ZIP 库
- [Kimi AI](https://kimi.moonshot.cn/) - AI 辅助编程

---

Made with ❤️ using Vibe Coding
