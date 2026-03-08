# 日记软件开发需求说明

## 🎯 核心目标
开发一个 **纯前端实现的日记应用**，支持：
- ✅ 网页版（桌面/手机浏览器）
- ✅ 安装为 PWA App（iOS/Android）
- ✅ 数据本地存储（不依赖后端）
- ✅ 简洁易用的写作体验

## 🛠️ 技术栈要求（你已掌握）
| 领域 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 + Vite | 你熟悉 Vue 3 Composition API |
| **存储方案** | IndexedDB | 你已了解其原理（见之前讨论） |
| **PWA** | `vite-plugin-pwa` | 你已学习过 PWA 基础 |
| **UI** | Tailwind CSS | 你已用过，简洁美观 |

## 📝 功能清单（优先级从高到低）

### ✅ 基础功能（必须实现）
1. **新建日记**  
   - 富文本编辑器（支持 Markdown）
   - 保存到 IndexedDB
   - 显示日期/时间（自动）

2. **查看日记**  
   - 按时间倒序列表
   - 点击进入详情页
   - 支持搜索（按内容/日期）

3. **PWA 安装**  
   - 浏览器提示“添加到主屏幕”
   - 安装后可离线使用

### ✅ 进阶功能（可选）
1. **标签系统**  
   - 为日记添加标签（如 #工作 #旅行）
   - 按标签筛选

2. **加密日记**  
   - 为特定日记设置密码
   - 用 `crypto.subtle` 实现前端加密

3. **导出功能**  
   - 导出为 Markdown 文件
   - 导出为 PDF（用 `pdf-lib`）

## ⚠️ 禁止事项
- ❌ 不要后端/数据库（你已明确不擅长）
- ❌ 不要依赖第三方 API（如 Firebase）
- ❌ 不要复杂认证（只做本地存储）

## 📂 项目结构建议


├── public/
│ └── manifest.json # PWA 配置
├── src/
│ ├── assets/
│ ├── components/
│ │ ├── DiaryList.vue
│ │ └── Editor.vue
│ ├── utils/
│ │ └── db.ts # IndexedDB 操作
│ ├── App.vue
│ └── main.ts
├── vite.config.ts
└── package.json
