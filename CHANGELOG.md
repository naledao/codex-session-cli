# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 项目初始化
- 基础项目结构
- 开发文档
- README.md
- package.json 配置
- TypeScript 配置
- ESLint 配置
- Prettier 配置
- .gitignore 文件

## [1.0.0] - 2026-04-30

### Added
- 列出当前目录的session功能
- 查看session详情功能
- 搜索session功能
- 导出session功能（JSON、文本、Markdown格式）
- 交互式TUI界面
- 带颜色的格式化输出
- 键盘导航和快捷键支持
- 跨平台支持（Windows、macOS、Linux）

### Changed
- 无

### Deprecated
- 无

### Removed
- 无

### Fixed
- 无

### Security
- 无

## [0.1.0] - 2026-04-30

### Added
- 项目概念设计
- 需求分析
- 技术栈选择
- 项目结构设计

---

## 版本说明

### 版本格式
- **主版本号 (MAJOR)**: 不兼容的 API 更改
- **次版本号 (MINOR)**: 以向后兼容的方式添加功能
- **修订号 (PATCH)**: 向后兼容的问题修复

### 变更类型
- **Added**: 新功能
- **Changed**: 对现有功能的更改
- **Deprecated**: 即将删除的功能
- **Removed**: 已删除的功能
- **Fixed**: 任何修复
- **Security**: 安全相关的更改

### 示例格式
```markdown
## [1.2.0] - 2026-05-01

### Added
- 新增批量导出功能
- 支持自定义主题配置

### Changed
- 优化大型session文件的解析性能
- 改进搜索结果的排序算法

### Fixed
- 修复在Windows系统下路径识别问题
- 修复特殊字符导致的解析错误
```