# 更新日志

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2024-03-08

### 新增
- 基础日记编辑功能（标题、内容）
- 富文本编辑器，支持 Markdown 语法
- 图片上传功能（文件选择、粘贴、拖拽）
- 多图片支持，可预览和删除
- 标签系统，支持多标签分类和筛选
- 日记列表按时间倒序展示
- 全文搜索功能（标题/内容/标签）
- 数据导出功能（JSON 和 ZIP 格式）
- 数据导入功能，支持重复检测
- PWA 支持，可离线使用
- 响应式设计，适配移动端

### 技术实现
- Vue 3 + Composition API
- TypeScript 类型支持
- IndexedDB 本地数据存储
- IndexedDB Blob 图片存储
- JSZip 文件压缩/解压
- Tailwind CSS 样式框架
- vite-plugin-pwa PWA 支持

## [Unreleased]

### 计划中
- 日记加密功能
- Markdown 预览模式
- 日记统计图表
- 多设备同步
- 主题切换（暗黑模式）
