export * from './session';

import {
  Session,
  SessionDetail,
  SessionEvent,
  SessionMetadata,
  SessionStats,
  SessionSummary,
  SearchQuery,
  SearchResult,
  ExportFormat,
  ExportOptions,
  Config,
} from './session';

// 命令行参数类型
export interface ListCommandOptions {
  all?: boolean;
  limit?: number;
  sort?: 'date' | 'name' | 'size';
  directory?: string;
}

export interface ViewCommandOptions {
  id: string;
  format?: 'detailed' | 'summary' | 'raw';
  output?: string;
}

export interface SearchCommandOptions {
  query: string;
  regex?: boolean;
  after?: string;
  before?: string;
  type?: 'user' | 'agent' | 'all';
  limit?: number;
  directory?: string;
}

export interface ExportCommandOptions {
  id: string;
  format?: 'json' | 'text' | 'markdown' | 'csv';
  output?: string;
  pretty?: boolean;
  metadata?: boolean;
}

export interface TuiCommandOptions {
  directory?: string;
  theme?: string;
}

// 组件属性类型
export interface SessionListProps {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onSearch: (query: string) => void;
  onExport: (session: Session) => void;
  loading?: boolean;
  error?: string;
}

export interface SessionViewProps {
  session: SessionDetail;
  onBack: () => void;
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
}

export interface SearchPanelProps {
  onSearch: (query: SearchQuery) => void;
  onClose: () => void;
  initialQuery?: string;
}

export interface ExportDialogProps {
  session: Session;
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
  loading?: boolean;
}

// 服务接口
export interface ISessionService {
  getAllSessions(): Promise<Session[]>;
  getCurrentDirectorySessions(): Promise<Session[]>;
  getSessionById(sessionId: string): Promise<SessionDetail>;
  getSessionStats(): Promise<SessionStats>;
  deleteSession(sessionId: string): Promise<boolean>;
}

export interface IParserService {
  parseSessionFile(filePath: string): Promise<SessionEvent[]>;
  parseSessionStream(filePath: string): AsyncGenerator<SessionEvent>;
  extractSessionSummary(filePath: string): Promise<SessionSummary>;
  validateSessionFile(filePath: string): Promise<boolean>;
}

export interface ISearchService {
  searchSessions(query: SearchQuery): Promise<SearchResult[]>;
  highlightMatches(text: string, query: string): string;
  saveSearchHistory(query: SearchQuery): Promise<void>;
  getSearchHistory(): Promise<SearchQuery[]>;
}

export interface IExportService {
  exportSession(sessionId: string, format: ExportFormat): Promise<string>;
  exportMultipleSessions(sessionIds: string[], format: ExportFormat): Promise<string>;
  exportToFile(sessionId: string, format: ExportFormat, outputPath: string): Promise<void>;
  getSupportedFormats(): ExportFormat[];
}

// 工具函数类型
export interface PathUtils {
  getSessionDirectory(): string;
  normalizeSessionPath(filePath: string): string;
  extractSessionId(filePath: string): string;
  isSessionFile(filePath: string): boolean;
  getSessionDate(filePath: string): Date;
}

export interface FormatUtils {
  formatDate(date: Date, format: string): string;
  formatDuration(ms: number): string;
  formatFileSize(bytes: number): string;
  formatTokenCount(count: number): string;
  truncateText(text: string, maxLength: number): string;
}

export interface LoggerUtils {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  setLevel(level: 'info' | 'warn' | 'error' | 'debug'): void;
}

// 错误类型
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

// 事件类型
export interface SessionEventEmitter {
  on(event: 'sessionFound', listener: (session: Session) => void): this;
  on(event: 'sessionParsed', listener: (session: SessionDetail) => void): this;
  on(event: 'searchComplete', listener: (results: SearchResult[]) => void): this;
  on(event: 'exportComplete', listener: (outputPath: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
}

// 配置管理
export interface ConfigManager {
  getConfig(): Promise<Config>;
  updateConfig(updates: Partial<Config>): Promise<void>;
  resetConfig(): Promise<void>;
  getConfigPath(): string;
}

// 主题配置
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    text: string;
    background: string;
    border: string;
  };
  symbols: {
    bullet: string;
    arrow: string;
    check: string;
    cross: string;
    spinner: string;
  };
}

// 国际化
export interface I18n {
  t(key: string, ...args: unknown[]): string;
  getLocale(): string;
  setLocale(locale: string): void;
  getAvailableLocales(): string[];
}
