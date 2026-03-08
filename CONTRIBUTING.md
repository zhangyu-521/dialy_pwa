# 贡献指南

感谢您对 Daily Diary 项目的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug
- 使用 GitHub Issues 提交问题
- 描述问题发生的步骤
- 提供浏览器版本和操作系统信息
- 如有错误信息请一并提供

### 提交功能请求
- 在 Issues 中描述您想要的功能
- 说明该功能的使用场景
- 如果可能，提供界面设计或交互说明

### 提交代码
1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 开发规范

### 代码风格
- 使用 TypeScript 编写代码
- 遵循 Vue 3 Composition API 风格
- 组件名使用 PascalCase
- 变量名使用 camelCase

### 提交信息规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

类型说明：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(editor): 添加图片拖拽上传功能

支持从文件管理器拖拽图片到编辑器
自动压缩大尺寸图片
```

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/zhangyu-521/dialy_pwa.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 联系方式

如有问题，欢迎通过 GitHub Issues 交流。
