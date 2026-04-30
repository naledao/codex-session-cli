# Codex Session Viewer

一个跨平台的终端工具，用于查看OpenAI Codex CLI在当前目录下的历史session记录。

## 功能特性

- 📋 **列出所有session** - 显示当前目录下所有codex cli的历史session列表
- 🔍 **查看session详情** - 查看特定session的详细内容和交互记录
- 🔎 **搜索session** - 根据关键词或时间范围搜索session
- 📤 **导出session** - 将session导出为文件（如JSON、文本、Markdown等）
- 🎨 **交互式TUI** - 带颜色的格式化输出和交互式终端界面

## 安装

```bash
npm install -g codex-session-viewer
```

## 快速开始

### 查看当前目录的session列表
```bash
codex-sessions list
```

### 启动交互式TUI界面
```bash
codex-sessions tui
```

### 搜索包含特定关键词的session
```bash
codex-sessions search "bug"
```

### 导出session为JSON文件
```bash
codex-sessions export <session-id> --format json --output session.json
```

## 命令行接口

### 基本命令

```bash
# 列出当前目录的session
codex-sessions list [options]

# 查看特定session详情
codex-sessions view <session-id>

# 搜索session
codex-sessions search <query> [options]

# 导出session
codex-sessions export <session-id> [options]

# 启动交互式TUI
codex-sessions tui
```

### 命令选项

#### list 命令
```bash
codex-sessions list --all          # 显示所有目录的session
codex-sessions list --limit 10     # 限制显示数量
codex-sessions list --sort date    # 按日期排序
```

#### search 命令
```bash
codex-sessions search "关键词" --regex     # 使用正则表达式
codex-sessions search "关键词" --after 2026-04-01  # 时间范围过滤
codex-sessions search "关键词" --type user  # 按消息类型过滤
```

#### export 命令
```bash
codex-sessions export <id> --format json    # JSON格式
codex-sessions export <id> --format text    # 纯文本格式
codex-sessions export <id> --format md      # Markdown格式
codex-sessions export <id> --output file.json  # 输出到文件
```

## 开发

### 环境要求
- Node.js 18+
- npm 9+

### 开发设置
```bash
# 克隆仓库
git clone https://github.com/yourusername/codex-session-viewer.git
cd codex-session-viewer

# 安装依赖
npm install

# 运行测试
npm test

# 启动开发模式
npm run dev
```

### 构建
```bash
npm run build
```

### 发布
```bash
npm publish
```

## 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.x
- **CLI框架**: commander.js
- **TUI框架**: ink (React for CLI)
- **颜色输出**: chalk
- **文件系统**: fs-extra
- **JSON解析**: jsonstream
- **日期处理**: date-fns
- **测试框架**: vitest

## 项目结构

```
codex-session-viewer/
├── src/
│   ├── commands/           # 命令实现
│   ├── components/         # TUI组件
│   ├── services/           # 业务逻辑服务
│   ├── utils/              # 工具函数
│   └── types/              # TypeScript类型定义
├── tests/                  # 测试文件
├── docs/                   # 文档
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 配置

配置文件位置：`~/.codex-session-viewer/config.json`

```json
{
  "sessionsPath": "~/.codex/sessions",
  "defaultExportFormat": "json",
  "maxResults": 50,
  "theme": "default",
  "dateFormat": "yyyy-MM-dd HH:mm",
  "showTimestamps": true,
  "highlightMatches": true
}
```

## 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

### 贡献步骤
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- 感谢 OpenAI 提供的 Codex CLI 工具
- 感谢所有贡献者的支持

## 联系方式

- 项目链接: https://github.com/yourusername/codex-session-viewer
- 问题反馈: https://github.com/yourusername/codex-session-viewer/issues

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。