import fs from 'fs-extra';
import path from 'path';
import {
  Session,
  SessionDetail,
  SessionStats,
  SessionMetadata,
  SessionEvent,
} from '@/types/session';
import {
  getSessionDirectory,
  extractSessionId,
  isSessionFile,
  getSessionDate,
  isPathInDirectory,
} from '@/utils/path';
import { isDateInRange } from '@/utils/date';
import { createLogger } from '@/utils/logger';

export class SessionService {
  private logger = createLogger('SessionService');
  private sessionsCache: Session[] | null = null;

  /**
   * 获取所有 session
   */
  async getAllSessions(): Promise<Session[]> {
    if (this.sessionsCache) {
      return this.sessionsCache;
    }

    const sessionDir = getSessionDirectory();
    const sessions: Session[] = [];

    try {
      await this.scanDirectory(sessionDir, sessions);

      // 按时间降序排序
      sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      this.sessionsCache = sessions;
      return sessions;
    } catch (error) {
      this.logger.error('Failed to get all sessions:', error);
      return [];
    }
  }

  /**
   * 获取当前目录的 session
   */
  async getCurrentDirectorySessions(): Promise<Session[]> {
    const currentDir = process.cwd();
    const allSessions = await this.getAllSessions();

    return allSessions.filter(session => {
      // 如果目录未知，跳过
      if (!session.directory || session.directory === 'Unknown') {
        return false;
      }

      try {
        // 规范化路径进行比较
        const normalizedSessionDir = path.resolve(session.directory);
        const normalizedCurrentDir = path.resolve(currentDir);

        // 只显示精确匹配当前目录的 session
        return normalizedSessionDir === normalizedCurrentDir;
      } catch {
        return false;
      }
    });
  }

  /**
   * 获取单个 session 详情
   */
  async getSessionById(sessionId: string): Promise<SessionDetail | null> {
    const allSessions = await this.getAllSessions();
    const session = allSessions.find(s => s.id === sessionId);

    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return null;
    }

    try {
      const events = await this.parseSessionEvents(session.filePath);
      const metadata = this.extractMetadata(session.filePath, events);

      return {
        ...session,
        events,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get session detail: ${sessionId}`, error);
      return null;
    }
  }

  /**
   * 获取 session 统计信息
   */
  async getSessionStats(): Promise<SessionStats> {
    const sessions = await this.getAllSessions();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalTokens: 0,
        averageSessionDuration: 0,
        mostActiveDay: new Date(),
        mostUsedCommands: [],
      };
    }

    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSessionDuration = totalDuration / sessions.length;

    // 找出最活跃的一天
    const dayCount = new Map<string, number>();
    sessions.forEach(s => {
      const dayKey = s.timestamp.toISOString().split('T')[0];
      dayCount.set(dayKey, (dayCount.get(dayKey) || 0) + 1);
    });

    let mostActiveDay = '';
    let maxCount = 0;
    dayCount.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalTokens: 0,
      averageSessionDuration,
      mostActiveDay: new Date(mostActiveDay),
      mostUsedCommands: [],
    };
  }

  /**
   * 删除 session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const allSessions = await this.getAllSessions();
    const session = allSessions.find(s => s.id === sessionId);

    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`);
      return false;
    }

    try {
      await fs.remove(session.filePath);
      this.sessionsCache = null; // 清除缓存
      this.logger.info(`Deleted session: ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete session: ${sessionId}`, error);
      return false;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.sessionsCache = null;
  }

  /**
   * 扫描目录
   */
  private async scanDirectory(dirPath: string, sessions: Session[]): Promise<void> {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) {
        return;
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // 递归扫描子目录
          await this.scanDirectory(fullPath, sessions);
        } else if (entry.isFile() && isSessionFile(entry.name)) {
          // 解析 session 文件
          const session = await this.parseSessionBasic(fullPath);
          if (session) {
            sessions.push(session);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scan directory: ${dirPath}`, error);
    }
  }

  /**
   * 解析 session 文件基本信息
   */
  private async parseSessionBasic(filePath: string): Promise<Session | null> {
    try {
      const sessionId = extractSessionId(filePath);
      const timestamp = getSessionDate(filePath);

      if (!timestamp) {
        this.logger.warn(`Invalid session file: ${filePath}`);
        return null;
      }

      // 提取摘要和目录（从文件名和第一行推断）
      const { summary, directory, messageCount } = await this.extractBasicInfo(filePath);

      return {
        id: sessionId,
        filePath,
        directory,
        timestamp,
        summary,
        messageCount,
        duration: 0,
        tags: [],
      };
    } catch (error) {
      this.logger.error(`Failed to parse session file: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 提取基本信息（摘要、目录、消息数）
   */
  private async extractBasicInfo(filePath: string): Promise<{
    summary: string;
    directory: string;
    messageCount: number;
  }> {
    let summary = 'No summary';
    let directory = 'Unknown';
    let messageCount = 0;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          messageCount++;

          // 提取第一条用户消息作为摘要
          if (summary === 'No summary' && event.payload?.type === 'user_message') {
            const msg = event.payload.message;
            summary = msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
          }

          // 提取工作目录
          if (directory === 'Unknown' && event.payload?.type === 'exec_command_end') {
            directory = event.payload.cwd || 'Unknown';
          }
        } catch {
          // 跳过解析失败的行
        }
      }
    } catch {
      // 文件读取失败
    }

    return { summary, directory, messageCount };
  }

  /**
   * 解析 session 事件
   */
  private async parseSessionEvents(filePath: string): Promise<SessionEvent[]> {
    const events: SessionEvent[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.timestamp && event.type && event.payload) {
            events.push(event);
          }
        } catch {
          // 跳过解析失败的行
        }
      }
    } catch (error) {
      this.logger.error(`Failed to parse session events: ${filePath}`, error);
    }

    return events;
  }

  /**
   * 提取元数据
   */
  private extractMetadata(filePath: string, events: SessionEvent[]): SessionMetadata {
    const userMessages = events.filter(
      e => e.type === 'event_msg' && e.payload.type === 'user_message',
    );
    const agentMessages = events.filter(
      e => e.type === 'event_msg' && e.payload.type === 'agent_message',
    );
    const functionCalls = events.filter(
      e => e.type === 'response_item' && e.payload.type === 'function_call',
    );

    const startTime = events.length > 0 ? new Date(events[0].timestamp) : new Date();
    const endTime = events.length > 0 ? new Date(events[events.length - 1].timestamp) : new Date();

    // 尝试从事件中提取目录
    let directory = 'Unknown';
    const execEvent = events.find(
      e => e.type === 'event_msg' && e.payload.type === 'exec_command_end',
    );
    if (execEvent && execEvent.payload.type === 'exec_command_end') {
      directory = execEvent.payload.cwd || 'Unknown';
    }

    // 尝试提取 token 使用信息
    let totalTokens = 0;
    const tokenEvent = events.find(e => e.type === 'event_msg' && e.payload.type === 'token_count');
    if (tokenEvent && tokenEvent.payload.type === 'token_count' && tokenEvent.payload.info) {
      totalTokens = tokenEvent.payload.info.total_token_usage?.total_tokens || 0;
    }

    return {
      sessionId: extractSessionId(filePath),
      startTime,
      endTime,
      directory,
      model: 'unknown',
      totalTokens,
      userMessageCount: userMessages.length,
      agentMessageCount: agentMessages.length,
      functionCallCount: functionCalls.length,
    };
  }
}
