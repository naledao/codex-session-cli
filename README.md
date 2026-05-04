# Codex Session Viewer

一个交互式终端工具，用于查看、搜索和导出 OpenAI Codex CLI 的历史 session 记录。

## 功能特性

- 🖥️ **交互式终端界面** - 全键盘操作，无需记忆命令
- 📋 **Session 列表** - 浏览当前目录的所有 session
- 📖 **Session 详情** - 查看完整的对话内容
- 🔍 **全文搜索** - 支持关键词和正则搜索
- 📤 **多格式导出** - JSON、纯文本、Markdown、CSV
- 🌈 **彩色显示** - 带颜色的消息类型标识
- 💻 **跨平台** - 支持 Windows、macOS、Linux

## 安装

```bash
npm install -g codex-session-cli
```

## 使用

### 启动

```bash
# 进入你的项目目录
cd /path/to/your/project

# 启动工具（显示当前目录的 session）
codex-sessions

# 或指定目录
codex-sessions --dir /path/to/project
```

### 键盘快捷键

#### Session 列表

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 导航列表 |
| `Enter` | 查看选中的 session |
| `/` | 搜索 |
| `e` | 导出 |
| `r` | 刷新列表 |
| `q` | 退出 |

#### Session 详情

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 滚动内容 |
| `Esc` | 返回列表 |
| `e` | 导出 |
| `/` | 搜索 |
| `q` | 退出 |

#### 搜索

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 搜索 |
| `r` | 切换搜索模式（全部/用户消息/代理消息） |
| `Esc` | 取消 |

#### 导出

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 选择格式 |
| `Enter` | 确认导出 |
| `Esc` | 取消 |

## 界面预览

### Session 列表

```
┌─────────────────────────────────────────────────────────────┐
│  Codex Session Viewer - /home/user/project                  │
├─────────────────────────────────────────────────────────────┤
│  共 5 个 session                                             │
│                                                              │
│  ▸ 2026-04-02 10:00 - 用户询问数据库迁移问题                │
│    2026-04-02 15:54 - 讨论 API 接口设计                     │
│    2026-04-07 13:20 - 前端组件开发调试                       │
│    2026-04-10 17:17 - 部署配置问题排查                       │
│    2026-04-13 14:30 - 性能优化讨论                           │
├─────────────────────────────────────────────────────────────┤
│  ↑↓: 导航  Enter: 查看  /: 搜索  e: 导出  q: 退出           │
└─────────────────────────────────────────────────────────────┘
```

### Session 详情

```
┌─────────────────────────────────────────────────────────────┐
│  Session: 2026-04-02 10:00  | 目录: /home/user/project      │
│  | 时长: 5m 23s  | 消息: 12条  | 滚动: 13%                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [用户] 10:00:15                                             │
│  如何迁移数据库？                                            │
│                                                              │
│  [代理] 10:00:20                                             │
│  我来帮您查看当前的数据库结构...                             │
│                                                              │
│  [命令] 10:00:25 - shell_command                             │
│  $ ls -la migrations/                                        │
│                                                              │
│  [代理] 10:00:30                                             │
│  找到了迁移文件，我来创建新的迁移...                         │
├─────────────────────────────────────────────────────────────┤
│  ↑↓: 滚动  Esc: 返回  /: 搜索  e: 导出  q: 退出             │
└─────────────────────────────────────────────────────────────┘
```

## 导出格式

### JSON

```json
{
  "id": "rollout-2026-04-02T10-00-10-uuid",
  "timestamp": "2026-04-02T10:00:10.000Z",
  "directory": "/home/user/project",
  "duration": 300000,
  "messageCount": 12,
  "events": [...]
}
```

### Markdown

```markdown
# Session: 2026-04-02 10:00

## Metadata

| Key | Value |
|-----|-------|
| ID | rollout-2026-04-02T10-00-10-uuid |
| 目录 | /home/user/project |
| 时长 | 5m 0s |
| 消息数 | 12 |

## 对话内容

#### 用户 (10:00:15)
如何迁移数据库？

#### 代理 (10:00:20)
我来帮您查看当前的数据库结构...
```

## Session 存储位置

```
~/.codex/sessions/
├── 2026/
│   ├── 04/
│   │   ├── 02/
│   │   │   ├── rollout-2026-04-02T10-00-10-uuid.jsonl
│   │   │   └── rollout-2026-04-02T15-54-55-uuid.jsonl
│   │   └── 03/
│   └── 03/
└── 2025/
```

## 开发

### 环境要求

- Node.js 18+
- npm 9+

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/naledao/codex-session-cli.git
cd codex-session-cli

# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build

# 本地运行
node dist/index.mjs
```

### 项目结构

```
src/
├── index.ts              # 入口文件
├── components/
│   └── App.tsx           # 主应用组件
├── services/
│   ├── session.ts        # Session 数据服务
│   ├── parser.ts         # JSONL 解析
│   ├── search.ts         # 搜索服务
│   └── export.ts         # 导出服务
├── utils/
│   ├── path.ts           # 路径工具
│   ├── format.ts         # 格式化工具
│   └── logger.ts         # 日志工具
└── types/
    └── index.ts          # 类型定义
```

## 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript
- **TUI 框架**: Ink (React for CLI)
- **日期处理**: date-fns
- **文件操作**: fs-extra

## 许可证

MIT License

## 相关链接

- [npm 包](https://www.npmjs.com/package/codex-session-cli)
- [GitHub 仓库](https://github.com/naledao/codex-session-cli)
- [Codex CLI](https://github.com/openai/codex)
