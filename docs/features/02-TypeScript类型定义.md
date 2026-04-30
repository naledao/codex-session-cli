# 02 - TypeScript 类型定义

## 概述

本文档定义项目中使用的所有 TypeScript 类型。类型定义是项目的基础，确保代码的类型安全和可维护性。

## 开发顺序

**优先级：P0（必须）**  
**预计时间：0.5天**  
**前置依赖：01-项目初始化和基础框架搭建**

## 文件位置

- `src/types/session.ts` - Session 相关类型
- `src/types/index.ts` - 类型导出

---

## 2.1 Session 核心类型

### Session 接口

Session 基本信息，用于表示一个 codex session。

```typescript
export interface Session {
  id: string;                    // Session ID
  filePath: string;              // 文件路径
  directory: string;             // 工作目录
  timestamp: Date;               // 时间戳
  summary: string;               // 摘要
  messageCount: number;          // 消息数量
  duration: number;              // 持续时间（毫秒）
  tags: string[];                // 标签
}
```

### SessionDetail 接口

Session 详细信息，继承自 Session。

```typescript
export interface SessionDetail extends Session {
  events: SessionEvent[];        // 事件列表
  metadata: SessionMetadata;     // 元数据
}
```

### SessionMetadata 接口

Session 元数据。

```typescript
export interface SessionMetadata {
  sessionId: string;             // Session ID
  startTime: Date;               // 开始时间
  endTime: Date;                 // 结束时间
  directory: string;             // 工作目录
  model: string;                 // 使用的模型
  totalTokens: number;           // 总 token 数
  userMessageCount: number;      // 用户消息数量
  agentMessageCount: number;     // 代理消息数量
  functionCallCount: number;     // 函数调用数量
}
```

### SessionStats 接口

Session 统计信息。

```typescript
export interface SessionStats {
  totalSessions: number;         // 总 session 数
  totalMessages: number;         // 总消息数
  totalTokens: number;           // 总 token 数
  averageSessionDuration: number;// 平均 session 时长
  mostActiveDay: Date;           // 最活跃的一天
  mostUsedCommands: CommandStat[];// 最常用的命令
}
```

### CommandStat 接口

命令统计信息。

```typescript
export interface CommandStat {
  command: string;               // 命令名称
  count: number;                 // 使用次数
  percentage: number;            // 使用百分比
}
```

---

## 2.2 Session 事件类型

### SessionEvent 接口

Session 事件，表示 session 中的一个操作。

```typescript
export interface SessionEvent {
  timestamp: string;             // 时间戳
  type: 'event_msg' | 'response_item'; // 事件类型
  payload: EventPayload;         // 事件负载
}
```

### EventPayload 类型

事件负载的联合类型。

```typescript
export type EventPayload =
  | UserMessagePayload
  | AgentMessagePayload
  | FunctionCallPayload
  | FunctionCallOutputPayload
  | TokenCountPayload
  | ExecCommandEndPayload
  | ReasoningPayload;
```

---

## 2.3 消息负载类型

### UserMessagePayload 接口

用户消息负载。

```typescript
export interface UserMessagePayload {
  type: 'user_message';
  message: string;               // 消息内容
  images: string[];              // 图片列表
  local_images: string[];        // 本地图片路径
  text_elements: TextElement[];  // 文本元素
}
```

### AgentMessagePayload 接口

代理消息负载。

```typescript
export interface AgentMessagePayload {
  type: 'agent_message';
  message: string;               // 消息内容
  phase: 'commentary' | 'response'; // 阶段
  memory_citation: string | null;// 记忆引用
}
```

### FunctionCallPayload 接口

函数调用负载。

```typescript
export interface FunctionCallPayload {
  type: 'function_call';
  name: string;                  // 函数名称
  arguments: string;             // 参数（JSON 字符串）
  call_id: string;               // 调用 ID
}
```

### FunctionCallOutputPayload 接口

函数调用输出负载。

```typescript
export interface FunctionCallOutputPayload {
  type: 'function_call_output';
  call_id: string;               // 调用 ID
  output: string;                // 输出内容
}
```

### TokenCountPayload 接口

Token 计数负载。

```typescript
export interface TokenCountPayload {
  type: 'token_count';
  info: TokenInfo | null;        // Token 信息
  rate_limits: RateLimits;       // 速率限制
}
```

### ExecCommandEndPayload 接口

执行命令结束负载。

```typescript
export interface ExecCommandEndPayload {
  type: 'exec_command_end';
  call_id: string;               // 调用 ID
  turn_id: string;               // 轮次 ID
  command: string[];             // 命令
  cwd: string;                   // 工作目录
  parsed_cmd: ParsedCommand[];   // 解析后的命令
  source: 'agent' | 'user';     // 来源
  stdout: string;                // 标准输出
  stderr: string;                // 标准错误
  aggregated_output: string;     // 聚合输出
  exit_code: number;             // 退出码
  duration: Duration;            // 持续时间
  formatted_output: string;      // 格式化输出
  status: 'completed' | 'failed' | 'timeout'; // 状态
}
```

### ReasoningPayload 接口

推理负载。

```typescript
export interface ReasoningPayload {
  type: 'reasoning';
  summary: string[];             // 推理摘要
  content: string | null;        // 推理内容
  encrypted_content: string;     // 加密内容
}
```

---

## 2.4 辅助类型

### TextElement 接口

文本元素。

```typescript
export interface TextElement {
  byte_range: {
    start: number;
    end: number;
  };
  placeholder: string;           // 占位符
}
```

### TokenInfo 接口

Token 信息。

```typescript
export interface TokenInfo {
  total_token_usage: TokenUsage; // 总 token 使用
  last_token_usage: TokenUsage;  // 最近 token 使用
  model_context_window: number;  // 模型上下文窗口
}
```

### TokenUsage 接口

Token 使用情况。

```typescript
export interface TokenUsage {
  input_tokens: number;          // 输入 token
  cached_input_tokens: number;   // 缓存输入 token
  output_tokens: number;         // 输出 token
  reasoning_output_tokens: number;// 推理输出 token
  total_tokens: number;          // 总 token
}
```

### RateLimits 接口

速率限制。

```typescript
export interface RateLimits {
  limit_id: string;              // 限制 ID
  limit_name: string | null;     // 限制名称
  primary: RateLimit | null;     // 主要限制
  secondary: RateLimit | null;   // 次要限制
  credits: number | null;        // 积分
  plan_type: string | null;      // 计划类型
}
```

### RateLimit 接口

单个速率限制。

```typescript
export interface RateLimit {
  limit: number;                 // 限制值
  remaining: number;             // 剩余额度
  reset: number;                 // 重置时间
}
```

### ParsedCommand 接口

解析后的命令。

```typescript
export interface ParsedCommand {
  type: 'unknown' | 'shell' | 'file_read' | 'file_write' | 'file_edit';
  cmd: string;                   // 命令内容
}
```

### Duration 接口

持续时间。

```typescript
export interface Duration {
  secs: number;                  // 秒
  nanos: number;                 // 纳秒
}
```

---

## 2.5 搜索相关类型

### SearchQuery 接口

搜索查询参数。

```typescript
export interface SearchQuery {
  query: string;                 // 搜索关键词
  directory?: string;            // 目录过滤
  afterDate?: Date;              // 开始日期
  beforeDate?: Date;             // 结束日期
  messageType?: 'user' | 'agent' | 'all'; // 消息类型
  useRegex?: boolean;            // 使用正则表达式
  limit?: number;                // 结果数量限制
  offset?: number;               // 偏移量
}
```

### SearchResult 接口

搜索结果。

```typescript
export interface SearchResult {
  sessionId: string;             // Session ID
  sessionTimestamp: Date;        // Session 时间
  directory: string;             // 目录
  matchedText: string;           // 匹配的文本
  context: string;               // 上下文
  lineNumber: number;            // 行号
  relevanceScore: number;        // 相关性分数
}
```

---

## 2.6 导出相关类型

### ExportFormat 类型

导出格式。

```typescript
export type ExportFormat = 'json' | 'text' | 'markdown' | 'csv';
```

### ExportOptions 接口

导出选项。

```typescript
export interface ExportOptions {
  format: ExportFormat;          // 导出格式
  outputPath?: string;           // 输出路径
  includeMetadata?: boolean;     // 包含元数据
  includeEvents?: boolean;       // 包含事件
  prettyPrint?: boolean;         // 格式化输出
  dateFormat?: string;           // 日期格式
}
```

---

## 2.7 配置相关类型

### Config 接口

应用配置。

```typescript
export interface Config {
  sessionsPath: string;          // Session 路径
  defaultExportFormat: ExportFormat; // 默认导出格式
  maxResults: number;            // 最大结果数
  theme: 'default' | 'dark' | 'light' | 'colorful'; // 主题
  dateFormat: string;            // 日期格式
  showTimestamps: boolean;       // 显示时间戳
  highlightMatches: boolean;     // 高亮匹配
  language: 'zh' | 'en';        // 语言
}
```

---

## 2.8 命令行参数类型

### ListCommandOptions 接口

list 命令选项。

```typescript
export interface ListCommandOptions {
  all?: boolean;                 // 显示所有目录
  limit?: number;                // 限制数量
  sort?: 'date' | 'name' | 'size'; // 排序方式
  directory?: string;            // 指定目录
}
```

### ViewCommandOptions 接口

view 命令选项。

```typescript
export interface ViewCommandOptions {
  id: string;                    // Session ID
  format?: 'detailed' | 'summary' | 'raw'; // 显示格式
  output?: string;               // 输出路径
}
```

### SearchCommandOptions 接口

search 命令选项。

```typescript
export interface SearchCommandOptions {
  query: string;                 // 搜索关键词
  regex?: boolean;               // 使用正则
  after?: string;                // 开始日期
  before?: string;               // 结束日期
  type?: 'user' | 'agent' | 'all'; // 消息类型
  limit?: number;                // 限制数量
  directory?: string;            // 指定目录
}
```

### ExportCommandOptions 接口

export 命令选项。

```typescript
export interface ExportCommandOptions {
  id: string;                    // Session ID
  format?: 'json' | 'text' | 'markdown' | 'csv'; // 导出格式
  output?: string;               // 输出路径
  pretty?: boolean;              // 格式化输出
  metadata?: boolean;            // 包含元数据
}
```

### TuiCommandOptions 接口

tui 命令选项。

```typescript
export interface TuiCommandOptions {
  directory?: string;            // 指定目录
  theme?: string;                // 主题
}
```

---

## 2.9 组件属性类型

### SessionListProps 接口

Session 列表组件属性。

```typescript
export interface SessionListProps {
  sessions: Session[];           // Session 列表
  onSelect: (session: Session) => void; // 选择回调
  onSearch: (query: string) => void;    // 搜索回调
  onExport: (session: Session) => void; // 导出回调
  loading?: boolean;             // 加载状态
  error?: string;                // 错误信息
}
```

### SessionViewProps 接口

Session 详情组件属性。

```typescript
export interface SessionViewProps {
  session: SessionDetail;        // Session 详情
  onBack: () => void;            // 返回回调
  onExport: (format: ExportFormat) => void; // 导出回调
  loading?: boolean;             // 加载状态
}
```

### SearchPanelProps 接口

搜索面板组件属性。

```typescript
export interface SearchPanelProps {
  onSearch: (query: SearchQuery) => void; // 搜索回调
  onClose: () => void;           // 关闭回调
  initialQuery?: string;         // 初始查询
}
```

### ExportDialogProps 接口

导出对话框组件属性。

```typescript
export interface ExportDialogProps {
  session: Session;              // Session
  onExport: (options: ExportOptions) => void; // 导出回调
  onClose: () => void;           // 关闭回调
  loading?: boolean;             // 加载状态
}
```

---

## 2.10 服务接口

### ISessionService 接口

Session 服务接口。

```typescript
export interface ISessionService {
  getAllSessions(): Promise<Session[]>;
  getCurrentDirectorySessions(): Promise<Session[]>;
  getSessionById(sessionId: string): Promise<SessionDetail>;
  getSessionStats(): Promise<SessionStats>;
  deleteSession(sessionId: string): Promise<boolean>;
}
```

### IParserService 接口

解析服务接口。

```typescript
export interface IParserService {
  parseSessionFile(filePath: string): Promise<SessionEvent[]>;
  parseSessionStream(filePath: string): AsyncGenerator<SessionEvent>;
  extractSessionSummary(filePath: string): Promise<SessionSummary>;
  validateSessionFile(filePath: string): Promise<boolean>;
}
```

### ISearchService 接口

搜索服务接口。

```typescript
export interface ISearchService {
  searchSessions(query: SearchQuery): Promise<SearchResult[]>;
  highlightMatches(text: string, query: string): string;
  saveSearchHistory(query: SearchQuery): Promise<void>;
  getSearchHistory(): Promise<SearchQuery[]>;
}
```

### IExportService 接口

导出服务接口。

```typescript
export interface IExportService {
  exportSession(sessionId: string, format: ExportFormat): Promise<string>;
  exportMultipleSessions(sessionIds: string[], format: ExportFormat): Promise<string>;
  exportToFile(sessionId: string, format: ExportFormat, outputPath: string): Promise<void>;
  getSupportedFormats(): ExportFormat[];
}
```

---

## 2.11 错误类型

### 自定义错误类

```typescript
export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class InvalidSessionError extends Error {
  constructor(filePath: string, reason: string) {
    super(`Invalid session file: ${filePath} - ${reason}`);
    this.name = 'InvalidSessionError';
  }
}

export class SearchError extends Error {
  constructor(query: string, reason: string) {
    super(`Search error for query "${query}": ${reason}`);
    this.name = 'SearchError';
  }
}

export class ExportError extends Error {
  constructor(sessionId: string, format: ExportFormat, reason: string) {
    super(`Export error for session ${sessionId} in format ${format}: ${reason}`);
    this.name = 'ExportError';
  }
}
```

---

## 完成标准

- [x] 所有接口已定义
- [x] 所有类型已定义
- [x] 类型导出正确
- [x] 类型定义符合实际数据结构
- [x] 无 TypeScript 编译错误

## 下一步

完成本文档后，继续进行 [03-工具函数实现](./03-工具函数实现.md)。