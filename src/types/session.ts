// Session 基本信息
export interface Session {
  id: string;
  filePath: string;
  directory: string;
  timestamp: Date;
  summary: string;
  messageCount: number;
  duration: number; // 毫秒
  tags: string[];
}

// Session 详情
export interface SessionDetail extends Session {
  events: SessionEvent[];
  metadata: SessionMetadata;
}

// Session 事件
export interface SessionEvent {
  timestamp: string;
  type: 'event_msg' | 'response_item';
  payload: EventPayload;
}

// 事件负载
export type EventPayload =
  | UserMessagePayload
  | AgentMessagePayload
  | FunctionCallPayload
  | FunctionCallOutputPayload
  | TokenCountPayload
  | ExecCommandEndPayload
  | ReasoningPayload;

// 用户消息负载
export interface UserMessagePayload {
  type: 'user_message';
  message: string;
  images: string[];
  local_images: string[];
  text_elements: TextElement[];
}

// 代理消息负载
export interface AgentMessagePayload {
  type: 'agent_message';
  message: string;
  phase: 'commentary' | 'response';
  memory_citation: string | null;
}

// 函数调用负载
export interface FunctionCallPayload {
  type: 'function_call';
  name: string;
  arguments: string;
  call_id: string;
}

// 函数调用输出负载
export interface FunctionCallOutputPayload {
  type: 'function_call_output';
  call_id: string;
  output: string;
}

// Token 计数负载
export interface TokenCountPayload {
  type: 'token_count';
  info: TokenInfo | null;
  rate_limits: RateLimits;
}

// 执行命令结束负载
export interface ExecCommandEndPayload {
  type: 'exec_command_end';
  call_id: string;
  turn_id: string;
  command: string[];
  cwd: string;
  parsed_cmd: ParsedCommand[];
  source: 'agent' | 'user';
  stdout: string;
  stderr: string;
  aggregated_output: string;
  exit_code: number;
  duration: Duration;
  formatted_output: string;
  status: 'completed' | 'failed' | 'timeout';
}

// 推理负载
export interface ReasoningPayload {
  type: 'reasoning';
  summary: string[];
  content: string | null;
  encrypted_content: string;
}

// 文本元素
export interface TextElement {
  byte_range: {
    start: number;
    end: number;
  };
  placeholder: string;
}

// Token 信息
export interface TokenInfo {
  total_token_usage: TokenUsage;
  last_token_usage: TokenUsage;
  model_context_window: number;
}

// Token 使用情况
export interface TokenUsage {
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  reasoning_output_tokens: number;
  total_tokens: number;
}

// 速率限制
export interface RateLimits {
  limit_id: string;
  limit_name: string | null;
  primary: RateLimit | null;
  secondary: RateLimit | null;
  credits: number | null;
  plan_type: string | null;
}

// 单个速率限制
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

// 解析后的命令
export interface ParsedCommand {
  type: 'unknown' | 'shell' | 'file_read' | 'file_write' | 'file_edit';
  cmd: string;
}

// 持续时间
export interface Duration {
  secs: number;
  nanos: number;
}

// Session 元数据
export interface SessionMetadata {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  directory: string;
  model: string;
  totalTokens: number;
  userMessageCount: number;
  agentMessageCount: number;
  functionCallCount: number;
}

// Session 统计
export interface SessionStats {
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  averageSessionDuration: number;
  mostActiveDay: Date;
  mostUsedCommands: CommandStat[];
}

// 命令统计
export interface CommandStat {
  command: string;
  count: number;
  percentage: number;
}

// 搜索查询
export interface SearchQuery {
  query: string;
  directory?: string;
  afterDate?: Date;
  beforeDate?: Date;
  messageType?: 'user' | 'agent' | 'all';
  useRegex?: boolean;
  limit?: number;
  offset?: number;
}

// 搜索结果
export interface SearchResult {
  sessionId: string;
  sessionTimestamp: Date;
  directory: string;
  matchedText: string;
  context: string;
  lineNumber: number;
  relevanceScore: number;
}

// 导出格式
export type ExportFormat = 'json' | 'text' | 'markdown' | 'csv';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  includeMetadata?: boolean;
  includeEvents?: boolean;
  prettyPrint?: boolean;
  dateFormat?: string;
}

// 配置
export interface Config {
  sessionsPath: string;
  defaultExportFormat: ExportFormat;
  maxResults: number;
  theme: 'default' | 'dark' | 'light' | 'colorful';
  dateFormat: string;
  showTimestamps: boolean;
  highlightMatches: boolean;
  language: 'zh' | 'en';
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxFileSize?: number;
  concurrentParsing?: number;
}

// Session 摘要
export interface SessionSummary {
  filePath: string;
  summary: string;
  directory: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  userMessageCount: number;
  agentMessageCount: number;
  totalEvents: number;
}

// 导出的会话文件格式（.codex-session）
export interface ExportedSession {
  version: string;
  exportedAt: string;
  exportedBy: string;
  session: {
    id: string;
    directory: string;
    timestamp: string;
    summary: string;
    messageCount: number;
    duration: number;
  };
  events: SessionEvent[];
  metadata: SessionMetadata;
}

// 导入结果
export interface ImportResult {
  success: boolean;
  sessionId?: string;
  filePath?: string;
  error?: string;
}
