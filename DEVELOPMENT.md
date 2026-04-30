# Codex Session Viewer 开发文档

## 项目概述

### 项目名称
codex-session-viewer

### 项目描述
一个跨平台的终端工具，用于查看OpenAI Codex CLI在当前目录下的历史session记录。该工具通过npm安装，提供丰富的查看、搜索和导出功能，帮助开发者更好地管理和回顾与Codex的交互历史。

### 核心功能
1. **列出所有session** - 显示当前目录下所有codex cli的历史session列表
2. **查看session详情** - 查看特定session的详细内容和交互记录
3. **搜索session** - 根据关键词或时间范围搜索session
4. **导出session** - 将session导出为文件（如JSON、文本等）

### 界面要求
- 带颜色的格式化输出
- 交互式TUI（终端用户界面）
- 支持键盘导航和快捷键

## 快速开始

### 安装
```bash
npm install -g codex-session-viewer
```

### 基本使用
```bash
# 查看当前目录的session列表
codex-sessions list

# 启动交互式TUI界面
codex-sessions tui

# 搜索包含"bug"的session
codex-sessions search "bug"

# 导出特定session为JSON文件
codex-sessions export <session-id> --format json --output session.json
```

### 代码示例

#### 1. 获取当前目录的session列表
```typescript
import { SessionService } from './services/session';

const sessionService = new SessionService();
const sessions = await sessionService.getCurrentDirectorySessions();

console.log(`找到 ${sessions.length} 个session:`);
sessions.forEach(session => {
  console.log(`- ${session.id}: ${session.summary}`);
});
```

#### 2. 解析session文件
```typescript
import { ParserService } from './services/parser';

const parserService = new ParserService();
const events = await parserService.parseSessionFile('path/to/session.jsonl');

// 过滤用户消息
const userMessages = events.filter(event => 
  event.type === 'event_msg' && 
  event.payload.type === 'user_message'
);

console.log(`Session包含 ${userMessages.length} 条用户消息`);
```

#### 3. 搜索session内容
```typescript
import { SearchService } from './services/search';

const searchService = new SearchService();
const results = await searchService.searchSessions({
  query: '数据库',
  directory: process.cwd(),
  afterDate: new Date('2026-04-01')
});

console.log(`找到 ${results.length} 个匹配结果:`);
results.forEach(result => {
  console.log(`- ${result.sessionId}: ${result.matchedText}`);
});
```

#### 4. 导出session为Markdown
```typescript
import { ExportService } from './services/export';

const exportService = new ExportService();
const markdown = await exportService.exportSession(
  'session-id',
  'markdown'
);

// 保存到文件
import { writeFile } from 'fs/promises';
await writeFile('session.md', markdown);
console.log('Session已导出为Markdown格式');
```

## 技术栈

### 核心技术
- **运行时**: Node.js 18+
- **语言**: TypeScript 5.x
- **包管理器**: npm
- **构建工具**: tsup 或 esbuild

### 依赖库
- **CLI框架**: commander.js - 命令行参数解析
- **TUI框架**: ink (React for CLI) - 构建交互式终端界面
- **颜色输出**: chalk - 终端颜色输出
- **文件系统**: fs-extra - 增强的文件系统操作
- **JSON解析**: jsonstream - 流式JSONL解析
- **日期处理**: date-fns - 日期格式化和处理
- **进度条**: ora - 终端进度指示器
- **表格输出**: cli-table3 - 终端表格渲染

### 开发依赖
- **TypeScript**: 类型检查和编译
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Vitest**: 单元测试框架
- **ts-node**: TypeScript执行环境

## 项目结构

```
codex-session-viewer/
├── src/
│   ├── commands/           # 命令实现
│   │   ├── list.ts         # 列出session命令
│   │   ├── view.ts         # 查看session详情命令
│   │   ├── search.ts       # 搜索session命令
│   │   ├── export.ts       # 导出session命令
│   │   └── index.ts        # 命令导出
│   ├── components/         # TUI组件
│   │   ├── SessionList.tsx # session列表组件
│   │   ├── SessionView.tsx # session详情组件
│   │   ├── SearchPanel.tsx # 搜索面板组件
│   │   ├── ExportDialog.tsx # 导出对话框组件
│   │   └── App.tsx         # 主应用组件
│   ├── services/           # 业务逻辑服务
│   │   ├── session.ts      # session数据服务
│   │   ├── parser.ts       # JSONL解析服务
│   │   ├── search.ts       # 搜索服务
│   │   ├── export.ts       # 导出服务
│   │   └── config.ts       # 配置服务
│   ├── utils/              # 工具函数
│   │   ├── path.ts         # 路径处理工具
│   │   ├── format.ts       # 格式化工具
│   │   ├── date.ts         # 日期处理工具
│   │   └── logger.ts       # 日志工具
│   ├── types/              # TypeScript类型定义
│   │   ├── session.ts      # session相关类型
│   │   ├── command.ts      # 命令相关类型
│   │   └── index.ts        # 类型导出
│   └── index.ts            # 主入口文件
├── tests/                  # 测试文件
│   ├── unit/               # 单元测试
│   └── integration/        # 集成测试
├── docs/                   # 文档
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
├── .eslintrc.js            # ESLint配置
├── .prettierrc             # Prettier配置
└── README.md               # 项目说明
```

## 功能模块设计

### 1. Session数据服务 (session.ts)

#### 功能
- 扫描和识别session文件
- 解析session元数据
- 过滤当前目录相关的session
- 按时间排序session列表

#### 核心方法
```typescript
class SessionService {
  // 获取所有session
  async getAllSessions(): Promise<Session[]>
  
  // 获取当前目录的session
  async getCurrentDirectorySessions(): Promise<Session[]>
  
  // 获取单个session详情
  async getSessionById(sessionId: string): Promise<SessionDetail>
  
  // 获取session统计信息
  async getSessionStats(): Promise<SessionStats>
}
```

### 2. JSONL解析服务 (parser.ts)

#### 功能
- 流式解析JSONL文件
- 提取关键信息（用户消息、代理消息、工具调用等）
- 处理大型session文件（支持流式处理）

#### 核心方法
```typescript
class ParserService {
  // 解析session文件
  async parseSessionFile(filePath: string): Promise<SessionEvent[]>
  
  // 流式解析（用于大型文件）
  async parseSessionStream(filePath: string): AsyncGenerator<SessionEvent>
  
  // 提取session摘要
  async extractSessionSummary(filePath: string): Promise<SessionSummary>
}
```

### 3. 搜索服务 (search.ts)

#### 功能
- 全文搜索session内容
- 按时间范围过滤
- 按消息类型过滤
- 正则表达式支持

#### 核心方法
```typescript
class SearchService {
  // 搜索session
  async searchSessions(query: SearchQuery): Promise<SearchResult[]>
  
  // 高亮搜索结果
  highlightMatches(text: string, query: string): string
  
  // 保存搜索历史
  async saveSearchHistory(query: SearchQuery): Promise<void>
}
```

### 4. 导出服务 (export.ts)

#### 功能
- 导出为JSON格式
- 导出为纯文本格式
- 导出为Markdown格式
- 支持批量导出

#### 核心方法
```typescript
class ExportService {
  // 导出单个session
  async exportSession(sessionId: string, format: ExportFormat): Promise<string>
  
  // 批量导出
  async exportMultipleSessions(sessionIds: string[], format: ExportFormat): Promise<string>
  
  // 导出到文件
  async exportToFile(sessionId: string, format: ExportFormat, outputPath: string): Promise<void>
}
```

## 实现细节

### 1. Session文件识别

Codex CLI的session文件存储在`~/.codex/sessions/`目录下，按年/月/日组织：
```
~/.codex/sessions/
├── 2026/
│   ├── 04/
│   │   ├── 02/
│   │   │   ├── rollout-2026-04-02T10-00-10-019d4beb-62bd-7050-a28a-79bc0f6586e7.jsonl
│   │   │   └── rollout-2026-04-02T15-54-55-019d4d30-2b46-76b0-9ba1-9c399b0e7200.jsonl
│   │   └── 03/
│   └── 03/
└── 2025/
```

文件名格式：`rollout-{ISO时间戳}-{UUID}.jsonl`

### 2. Session文件解析

每个session文件是JSONL格式，每行是一个JSON对象，包含以下类型：

#### 用户消息
```json
{
  "timestamp": "2026-04-02T02:07:51.725Z",
  "type": "event_msg",
  "payload": {
    "type": "user_message",
    "message": "用户输入内容",
    "images": [],
    "local_images": ["图片路径"],
    "text_elements": []
  }
}
```

#### 代理消息
```json
{
  "timestamp": "2026-04-02T02:08:07.326Z",
  "type": "event_msg",
  "payload": {
    "type": "agent_message",
    "message": "代理回复内容",
    "phase": "commentary"
  }
}
```

#### 工具调用
```json
{
  "timestamp": "2026-04-02T02:08:07.328Z",
  "type": "response_item",
  "payload": {
    "type": "function_call",
    "name": "shell_command",
    "arguments": "{\"command\":\"ls -la\"}",
    "call_id": "call_xxx"
  }
}
```

### 3. 当前目录匹配

要识别当前目录相关的session，需要：
1. 从session事件中提取`workdir`字段
2. 与当前工作目录进行比较
3. 支持相对路径和绝对路径匹配

### 4. TUI界面设计

使用Ink框架构建React风格的TUI界面：

#### 主界面布局
```
┌─────────────────────────────────────────────────────────┐
│ Codex Session Viewer - /path/to/current/directory       │
├─────────────────────────────────────────────────────────┤
│ [1] 2026-04-02 10:00 - 用户询问前端地址配置问题         │
│ [2] 2026-04-02 15:54 - 用户询问状态枚举定义            │
│ [3] 2026-04-07 13:20 - 用户询问API接口设计             │
│ [4] 2026-04-10 17:17 - 用户询问数据库迁移方案          │
│ [5] 2026-04-13 17:45 - 用户询问部署配置问题            │
├─────────────────────────────────────────────────────────┤
│ ↑↓: 导航 | Enter: 查看详情 | /: 搜索 | e: 导出 | q: 退出 │
└─────────────────────────────────────────────────────────┘
```

#### 详情界面布局
```
┌─────────────────────────────────────────────────────────┐
│ Session: 2026-04-02 10:00                               │
│ Directory: E:\BOD                                       │
│ Duration: 45分钟                                        │
│ Messages: 23条                                          │
├─────────────────────────────────────────────────────────┤
│ [用户] 10:00:15                                         │
│ 前端地址配置问题，文件是后端地址...                      │
│                                                         │
│ [代理] 10:00:25                                         │
│ 我来帮您查看配置文件...                                 │
│                                                         │
│ [工具] 10:00:30 - shell_command                         │
│ $ Get-Content config.json                               │
│                                                         │
│ [代理] 10:00:35                                         │
│ 找到了配置文件，地址配置在...                           │
├─────────────────────────────────────────────────────────┤
│ ↑↓: 滚动 | Esc: 返回 | /: 搜索 | e: 导出              │
└─────────────────────────────────────────────────────────┘
```

## 开发计划

### 阶段1：基础框架搭建（1-2天）
1. 初始化npm项目
2. 配置TypeScript
3. 搭建项目结构
4. 实现基础CLI命令框架

### 阶段2：核心服务实现（2-3天）
1. 实现SessionService
2. 实现ParserService
3. 实现路径匹配逻辑
4. 实现基础搜索功能

### 阶段3：TUI界面开发（3-4天）
1. 实现SessionList组件
2. 实现SessionView组件
3. 实现SearchPanel组件
4. 实现键盘导航和快捷键

### 阶段4：导出和高级功能（2-3天）
1. 实现ExportService
2. 支持多种导出格式
3. 实现高级搜索功能
4. 添加配置选项

### 阶段5：测试和优化（2-3天）
1. 编写单元测试
2. 编写集成测试
3. 性能优化
4. 文档完善

## 配置文件

### 配置文件位置
`~/.codex-session-viewer/config.json`

### 配置项
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

## 命令行接口

### 基本用法
```bash
# 列出当前目录的session
codex-sessions list

# 查看特定session详情
codex-sessions view <session-id>

# 搜索session
codex-sessions search "关键词"

# 导出session
codex-sessions export <session-id> --format json

# 启动交互式TUI
codex-sessions tui
```

### 命令选项
```bash
# 列出命令选项
codex-sessions list --all          # 显示所有目录的session
codex-sessions list --limit 10     # 限制显示数量
codex-sessions list --sort date    # 按日期排序

# 搜索命令选项
codex-sessions search "关键词" --regex     # 使用正则表达式
codex-sessions search "关键词" --after 2026-04-01  # 时间范围过滤
codex-sessions search "关键词" --type user  # 按消息类型过滤

# 导出命令选项
codex-sessions export <id> --format json    # JSON格式
codex-sessions export <id> --format text    # 纯文本格式
codex-sessions export <id> --format md      # Markdown格式
codex-sessions export <id> --output file.json  # 输出到文件
```

## 测试策略

### 单元测试
- 测试各个服务的核心功能
- 测试工具函数
- 测试类型定义

### 集成测试
- 测试CLI命令
- 测试TUI组件
- 测试文件系统操作

### 端到端测试
- 测试完整工作流程
- 测试跨平台兼容性

## 部署和发布

### 构建
```bash
npm run build
```

### 发布到npm
```bash
npm publish
```

### 全局安装
```bash
npm install -g codex-session-viewer
```

## 未来扩展

### 可能的扩展功能
1. **Session对比** - 比较两个session的差异
2. **Session统计** - 生成使用统计报告
3. **Session回放** - 按时间顺序回放session
4. **插件系统** - 支持自定义插件扩展
5. **云同步** - 支持session云同步
6. **AI摘要** - 使用AI生成session摘要

### 性能优化
1. **索引系统** - 建立session索引加速搜索
2. **缓存机制** - 缓存解析结果
3. **流式处理** - 大型文件流式处理
4. **并行处理** - 多文件并行解析

## 贡献指南

### 开发环境设置
1. 克隆仓库
2. 安装依赖：`npm install`
3. 运行测试：`npm test`
4. 启动开发模式：`npm run dev`

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写清晰的注释和文档

### 提交规范
- 使用语义化提交信息
- 关联相关issue
- 包含测试用例
- 更新相关文档