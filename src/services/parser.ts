import fs from 'fs-extra';
import readline from 'readline';
import {
  SessionEvent,
  SessionSummary,
  UserMessagePayload,
  AgentMessagePayload,
  FunctionCallPayload,
} from '@/types/session';
import { createLogger } from '@/utils/logger';

export class ParserService {
  private logger = createLogger('ParserService');

  /**
   * 解析 session 文件
   * 返回所有事件
   */
  async parseSessionFile(filePath: string): Promise<SessionEvent[]> {
    const events: SessionEvent[] = [];

    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        this.logger.warn(`File not found: ${filePath}`);
        return [];
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line) as SessionEvent;
          if (event.timestamp && event.type && event.payload) {
            events.push(event);
          }
        } catch (parseError) {
          this.logger.warn(`Failed to parse line in ${filePath}`);
        }
      }

      return events;
    } catch (error) {
      this.logger.error(`Failed to parse session file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 流式解析（用于大型文件）
   */
  async *parseSessionStream(filePath: string): AsyncGenerator<SessionEvent> {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        this.logger.warn(`File not found: ${filePath}`);
        return;
      }

      const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line) as SessionEvent;
            if (event.timestamp && event.type && event.payload) {
              yield event;
            }
          } catch (parseError) {
            this.logger.warn(`Failed to parse line in ${filePath}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to parse session file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 提取 session 摘要
   */
  async extractSessionSummary(filePath: string): Promise<SessionSummary> {
    const events = await this.parseSessionFile(filePath);

    // 提取第一条用户消息作为摘要
    const firstUserMessage = events.find(
      e => e.type === 'event_msg' && e.payload.type === 'user_message',
    );

    // 提取工作目录
    const execEvent = events.find(
      e => e.type === 'event_msg' && e.payload.type === 'exec_command_end',
    );

    // 统计消息数量
    const userMessageCount = events.filter(
      e => e.type === 'event_msg' && e.payload.type === 'user_message',
    ).length;
    const agentMessageCount = events.filter(
      e => e.type === 'event_msg' && e.payload.type === 'agent_message',
    ).length;

    // 计算时间范围
    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    const startTime = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date();
    const endTime = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();

    return {
      filePath,
      summary:
        firstUserMessage?.payload.type === 'user_message'
          ? firstUserMessage.payload.message.substring(0, 100)
          : 'No summary',
      directory: execEvent?.payload.type === 'exec_command_end' ? execEvent.payload.cwd : 'Unknown',
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      userMessageCount,
      agentMessageCount,
      totalEvents: events.length,
    };
  }

  /**
   * 验证 session 文件
   */
  async validateSessionFile(filePath: string): Promise<boolean> {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return false;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter((line: string) => line.trim());

      let validLines = 0;

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.timestamp && event.type && event.payload) {
            validLines++;
          }
        } catch {
          // 无效行
        }
      }

      // 至少 50% 的行应该是有效的
      return lines.length > 0 && validLines / lines.length >= 0.5;
    } catch (error) {
      this.logger.error(`Failed to validate session file: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 提取用户消息
   */
  async extractUserMessages(filePath: string): Promise<UserMessagePayload[]> {
    const events = await this.parseSessionFile(filePath);
    return events
      .filter(e => e.type === 'event_msg' && e.payload.type === 'user_message')
      .map(e => e.payload as UserMessagePayload);
  }

  /**
   * 提取代理消息
   */
  async extractAgentMessages(filePath: string): Promise<AgentMessagePayload[]> {
    const events = await this.parseSessionFile(filePath);
    return events
      .filter(e => e.type === 'event_msg' && e.payload.type === 'agent_message')
      .map(e => e.payload as AgentMessagePayload);
  }

  /**
   * 提取函数调用
   */
  async extractFunctionCalls(filePath: string): Promise<FunctionCallPayload[]> {
    const events = await this.parseSessionFile(filePath);
    return events
      .filter(e => e.type === 'response_item' && e.payload.type === 'function_call')
      .map(e => e.payload as FunctionCallPayload);
  }

  /**
   * 提取执行的命令
   */
  async extractExecutedCommands(filePath: string): Promise<string[]> {
    const events = await this.parseSessionFile(filePath);
    const commands: string[] = [];

    events.forEach(event => {
      if (event.type === 'event_msg' && event.payload.type === 'exec_command_end') {
        const payload = event.payload;
        if (payload.command && Array.isArray(payload.command)) {
          commands.push(payload.command.join(' '));
        }
      }
    });

    return commands;
  }

  /**
   * 搜索文本内容
   */
  async searchInFile(filePath: string, query: string): Promise<number[]> {
    const matchingLines: number[] = [];

    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return [];
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      const lowerQuery = query.toLowerCase();

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          matchingLines.push(index + 1);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to search in file: ${filePath}`, error);
    }

    return matchingLines;
  }
}

// 导出类型
export type { SessionSummary };
