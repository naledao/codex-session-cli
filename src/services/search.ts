import { SearchQuery, SearchResult, SessionEvent } from '@/types/session';
import { SessionService } from './session';
import { ParserService } from './parser';
import { createLogger } from '@/utils/logger';
import { isDateInRange } from '@/utils/date';

export class SearchService {
  private sessionService: SessionService;
  private parserService: ParserService;
  private logger = createLogger('SearchService');
  private searchHistory: SearchQuery[] = [];

  constructor() {
    this.sessionService = new SessionService();
    this.parserService = new ParserService();
  }

  /**
   * 搜索 session
   */
  async searchSessions(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      // 获取要搜索的 session 列表
      let sessions = await this.sessionService.getAllSessions();

      // 按目录过滤
      if (query.directory) {
        sessions = sessions.filter(s => s.directory.startsWith(query.directory!));
      }

      // 按日期过滤
      if (query.afterDate || query.beforeDate) {
        sessions = sessions.filter(s =>
          isDateInRange(s.timestamp, query.afterDate, query.beforeDate),
        );
      }

      // 搜索每个 session
      for (const session of sessions) {
        const sessionResults = await this.searchInSession(session.filePath, session.id, query);
        results.push(...sessionResults);

        // 检查是否达到限制
        if (query.limit && results.length >= query.limit) {
          break;
        }
      }

      // 按相关性排序
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // 应用偏移量
      const offsetResults = query.offset ? results.slice(query.offset) : results;

      // 应用限制
      const limitedResults = query.limit ? offsetResults.slice(0, query.limit) : offsetResults;

      // 保存搜索历史
      await this.saveSearchHistory(query);

      return limitedResults;
    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * 在单个 session 中搜索
   */
  private async searchInSession(
    filePath: string,
    sessionId: string,
    query: SearchQuery,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const events = await this.parserService.parseSessionFile(filePath);
      const sessionDate = events.length > 0 ? new Date(events[0].timestamp) : new Date();

      for (let i = 0; i < events.length; i++) {
        const event = events[i];

        // 按消息类型过滤
        if (query.messageType && query.messageType !== 'all') {
          if (query.messageType === 'user' && event.payload.type !== 'user_message') {
            continue;
          }
          if (query.messageType === 'agent' && event.payload.type !== 'agent_message') {
            continue;
          }
        }

        // 提取消息内容
        const content = this.extractEventContent(event);
        if (!content) continue;

        // 搜索匹配
        const matchResult = this.matchContent(content, query.query, query.useRegex);
        if (matchResult) {
          results.push({
            sessionId,
            sessionTimestamp: sessionDate,
            directory: filePath,
            matchedText: matchResult.matchedText,
            context: matchResult.context,
            lineNumber: i + 1,
            relevanceScore: matchResult.score,
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to search in session: ${filePath}`, error);
      return [];
    }
  }

  /**
   * 提取事件内容
   */
  private extractEventContent(event: SessionEvent): string | null {
    if (event.type === 'event_msg') {
      switch (event.payload.type) {
        case 'user_message':
          return event.payload.message;
        case 'agent_message':
          return event.payload.message;
        case 'exec_command_end':
          return event.payload.stdout || event.payload.stderr;
        default:
          return null;
      }
    }

    if (event.type === 'response_item') {
      switch (event.payload.type) {
        case 'function_call':
          return event.payload.arguments;
        case 'function_call_output':
          return event.payload.output;
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * 匹配内容
   */
  private matchContent(
    content: string,
    query: string,
    useRegex?: boolean,
  ): { matchedText: string; context: string; score: number } | null {
    if (!content || !query) return null;

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let matched = false;
    let matchedText = '';
    let score = 0;

    if (useRegex) {
      try {
        const regex = new RegExp(query, 'gi');
        const match = content.match(regex);
        if (match) {
          matched = true;
          matchedText = match[0];
          score = 1;
        }
      } catch {
        // 正则表达式无效，回退到普通搜索
        if (lowerContent.includes(lowerQuery)) {
          matched = true;
          matchedText = query;
          score = 0.8;
        }
      }
    } else {
      if (lowerContent.includes(lowerQuery)) {
        matched = true;
        matchedText = query;

        // 计算相关性分数
        if (lowerContent === lowerQuery) {
          score = 1;
        } else if (lowerContent.startsWith(lowerQuery)) {
          score = 0.9;
        } else {
          score = 0.7;
        }
      }
    }

    if (!matched) return null;

    // 提取上下文
    const context = this.extractContext(content, matchedText, 50);

    return { matchedText, context, score };
  }

  /**
   * 提取上下文
   */
  private extractContext(content: string, matchedText: string, contextLength: number): string {
    const index = content.toLowerCase().indexOf(matchedText.toLowerCase());
    if (index === -1) return content.substring(0, contextLength * 2);

    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + matchedText.length + contextLength);

    let context = '';
    if (start > 0) context += '...';
    context += content.substring(start, end);
    if (end < content.length) context += '...';

    return context;
  }

  /**
   * 高亮匹配文本
   */
  highlightMatches(text: string, query: string): string {
    if (!query || !text) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '\x1b[43m\x1b[30m$1\x1b[0m');
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 保存搜索历史
   */
  async saveSearchHistory(query: SearchQuery): Promise<void> {
    this.searchHistory.unshift(query);

    // 只保留最近 100 条
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(0, 100);
    }
  }

  /**
   * 获取搜索历史
   */
  async getSearchHistory(): Promise<SearchQuery[]> {
    return [...this.searchHistory];
  }

  /**
   * 清除搜索历史
   */
  async clearSearchHistory(): Promise<void> {
    this.searchHistory = [];
  }

  /**
   * 获取热门搜索词
   */
  async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    const termCount = new Map<string, number>();

    this.searchHistory.forEach(query => {
      const count = termCount.get(query.query) || 0;
      termCount.set(query.query, count + 1);
    });

    return Array.from(termCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term]) => term);
  }
}
