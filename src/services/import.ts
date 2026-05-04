import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExportedSession, ImportResult, SessionEvent } from '../types/session';
import { getSessionDirectory } from '../utils/path';
import { createLogger } from '../utils/logger';

type ImportFormat = 'json' | 'text' | 'markdown' | 'csv' | 'unknown';

export class ImportService {
  private logger = createLogger('ImportService');

  /**
   * 导入会话文件
   */
  async importSession(filePath: string): Promise<ImportResult> {
    try {
      // 1. 验证文件存在
      if (!(await fs.pathExists(filePath))) {
        return { success: false, error: '文件不存在' };
      }

      // 2. 检测格式
      const format = this.detectFormat(filePath);
      if (format === 'unknown') {
        return { success: false, error: '不支持的文件格式，请使用 .json, .txt, .md, .csv 文件' };
      }

      // 3. 读取并解析文件
      const content = await fs.readFile(filePath, 'utf-8');
      const events = this.parseContent(content, format);

      if (events.length === 0) {
        return { success: false, error: '文件中没有找到有效的会话数据' };
      }

      // 4. 生成 session 数据
      const sessionData = this.createSessionData(events, filePath);

      // 5. 写入文件
      const outputPath = await this.writeSession(sessionData);

      this.logger.info(`Imported session to: ${outputPath}`);

      return {
        success: true,
        sessionId: sessionData.session.id,
        filePath: outputPath,
      };
    } catch (error) {
      this.logger.error('Import failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '导入失败',
      };
    }
  }

  /**
   * 检测文件格式
   */
  private detectFormat(filePath: string): ImportFormat {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
      case '.codex-session':
        return 'json';
      case '.txt':
        return 'text';
      case '.md':
        return 'markdown';
      case '.csv':
        return 'csv';
      default:
        return 'unknown';
    }
  }

  /**
   * 解析内容
   */
  private parseContent(content: string, format: ImportFormat): SessionEvent[] {
    switch (format) {
      case 'json':
        return this.parseJson(content);
      case 'text':
        return this.parseText(content);
      case 'markdown':
        return this.parseMarkdown(content);
      case 'csv':
        return this.parseCsv(content);
      default:
        return [];
    }
  }

  /**
   * 解析 JSON 格式
   */
  private parseJson(content: string): SessionEvent[] {
    try {
      const data = JSON.parse(content);

      // 标准 .codex-session 格式
      if (data.version && data.events && Array.isArray(data.events)) {
        return data.events;
      }

      // 简化 JSON 格式（导出的 json 格式）
      if (data.events && Array.isArray(data.events)) {
        return data.events.map((e: any) => ({
          timestamp: e.timestamp,
          type: e.type,
          payload: this.reconstructPayload(e),
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * 重建 payload
   */
  private reconstructPayload(event: any): any {
    if (event.payloadType === 'user_message') {
      return {
        type: 'user_message',
        message: event.content,
        images: [],
        local_images: [],
        text_elements: [],
      };
    }
    if (event.payloadType === 'agent_message') {
      return {
        type: 'agent_message',
        message: event.content,
        phase: 'response',
        memory_citation: null,
      };
    }
    if (event.payloadType === 'exec_command_end') {
      return {
        type: 'exec_command_end',
        command: event.content.split(' '),
        stdout: '',
        stderr: '',
        exit_code: 0,
      };
    }
    if (event.payloadType === 'function_call') {
      return { type: 'function_call', name: 'unknown', arguments: event.content, call_id: '' };
    }
    return event.payload || { type: event.payloadType, message: event.content };
  }

  /**
   * 解析纯文本格式
   */
  private parseText(content: string): SessionEvent[] {
    const events: SessionEvent[] = [];
    const lines = content.split('\n');
    let currentEvent: Partial<SessionEvent> | null = null;
    let contentLines: string[] = [];

    for (const line of lines) {
      // 检测事件类型标记
      const userMatch = line.match(/^\[User\]\s+(\d{2}:\d{2}:\d{2})/);
      const agentMatch = line.match(/^\[Agent\]\s+(\d{2}:\d{2}:\d{2})/);
      const commandMatch = line.match(/^\[Command\]\s+(\d{2}:\d{2}:\d{2})/);
      const toolMatch = line.match(/^\[Tool\]\s+(\d{2}:\d{2}:\d{2})/);

      if (userMatch || agentMatch || commandMatch || toolMatch) {
        // 保存之前的事件
        if (currentEvent && contentLines.length > 0) {
          this.finalizeEvent(currentEvent, contentLines, events);
        }

        // 开始新事件
        const timestamp = this.createTimestamp(
          userMatch?.[1] || agentMatch?.[1] || commandMatch?.[1] || toolMatch?.[1],
        );

        if (userMatch) {
          currentEvent = { timestamp, type: 'event_msg', payload: { type: 'user_message' } };
        } else if (agentMatch) {
          currentEvent = { timestamp, type: 'event_msg', payload: { type: 'agent_message' } };
        } else if (commandMatch) {
          currentEvent = { timestamp, type: 'event_msg', payload: { type: 'exec_command_end' } };
        } else if (toolMatch) {
          currentEvent = { timestamp, type: 'response_item', payload: { type: 'function_call' } };
        }
        contentLines = [];
      } else if (line.trim() && currentEvent) {
        contentLines.push(line);
      }
    }

    // 保存最后一个事件
    if (currentEvent && contentLines.length > 0) {
      this.finalizeEvent(currentEvent, contentLines, events);
    }

    return events;
  }

  /**
   * 解析 Markdown 格式
   */
  private parseMarkdown(content: string): SessionEvent[] {
    const events: SessionEvent[] = [];
    const lines = content.split('\n');
    let currentEvent: Partial<SessionEvent> | null = null;
    let contentLines: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // 检测事件类型标题
      const userMatch = line.match(/^####\s+User\s+\((\d{2}:\d{2}:\d{2})\)/);
      const agentMatch = line.match(/^####\s+Agent\s+\((\d{2}:\d{2}:\d{2})\)/);
      const commandMatch = line.match(/^####\s+Command\s+\((\d{2}:\d{2}:\d{2})\)/);
      const toolMatch = line.match(/^####\s+Tool:\s+.+\s+\((\d{2}:\d{2}:\d{2})\)/);
      const toolOutputMatch = line.match(/^####\s+Tool Output\s+\((\d{2}:\d{2}:\d{2})\)/);

      if (userMatch || agentMatch || commandMatch || toolMatch || toolOutputMatch) {
        // 保存之前的事件
        if (currentEvent && contentLines.length > 0) {
          this.finalizeEvent(currentEvent, contentLines, events);
        }

        const timestamp = this.createTimestamp(
          userMatch?.[1] ||
            agentMatch?.[1] ||
            commandMatch?.[1] ||
            toolMatch?.[1] ||
            toolOutputMatch?.[1],
        );

        if (userMatch) {
          currentEvent = { timestamp, type: 'event_msg', payload: { type: 'user_message' } };
        } else if (agentMatch) {
          currentEvent = { timestamp, type: 'event_msg', payload: { type: 'agent_message' } };
        } else if (commandMatch) {
          currentEvent = { timestamp, type: 'event_msg', payload: { type: 'exec_command_end' } };
        } else if (toolMatch) {
          currentEvent = { timestamp, type: 'response_item', payload: { type: 'function_call' } };
        } else if (toolOutputMatch) {
          currentEvent = {
            timestamp,
            type: 'response_item',
            payload: { type: 'function_call_output' },
          };
        }
        contentLines = [];
        inCodeBlock = false;
      } else if (line.trim() === '```' || line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock && currentEvent) {
          // 代码块结束
        }
      } else if (line.trim() && currentEvent && !line.startsWith('#') && !line.startsWith('|')) {
        contentLines.push(line);
      }
    }

    // 保存最后一个事件
    if (currentEvent && contentLines.length > 0) {
      this.finalizeEvent(currentEvent, contentLines, events);
    }

    return events;
  }

  /**
   * 解析 CSV 格式
   */
  private parseCsv(content: string): SessionEvent[] {
    const events: SessionEvent[] = [];
    const lines = content.split('\n');

    // 跳过表头
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCsvLine(line);
      if (parts.length >= 3) {
        const [timestamp, type, ...contentParts] = parts;
        const eventContent = contentParts.join(',');

        events.push({
          timestamp,
          type:
            type === 'function_call' || type === 'function_call_output'
              ? 'response_item'
              : 'event_msg',
          payload: this.reconstructPayload({
            timestamp,
            payloadType: type,
            content: eventContent,
          }),
        });
      }
    }

    return events;
  }

  /**
   * 解析 CSV 行
   */
  private parseCsvLine(line: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    parts.push(current);
    return parts;
  }

  /**
   * 完善事件
   */
  private finalizeEvent(
    event: Partial<SessionEvent>,
    contentLines: string[],
    events: SessionEvent[],
  ): void {
    const content = contentLines.join('\n');

    if (event.payload?.type === 'user_message') {
      event.payload = {
        type: 'user_message',
        message: content,
        images: [],
        local_images: [],
        text_elements: [],
      };
    } else if (event.payload?.type === 'agent_message') {
      event.payload = {
        type: 'agent_message',
        message: content,
        phase: 'response',
        memory_citation: null,
      };
    } else if (event.payload?.type === 'exec_command_end') {
      event.payload = {
        type: 'exec_command_end',
        command: content.split(' '),
        stdout: '',
        stderr: '',
        exit_code: 0,
      };
    } else if (event.payload?.type === 'function_call') {
      event.payload = { type: 'function_call', name: 'unknown', arguments: content, call_id: '' };
    } else if (event.payload?.type === 'function_call_output') {
      event.payload = { type: 'function_call_output', call_id: '', output: content };
    }

    events.push(event as SessionEvent);
  }

  /**
   * 创建时间戳
   */
  private createTimestamp(timeStr: string): string {
    const today = new Date();
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    today.setHours(hours, minutes, seconds || 0, 0);
    return today.toISOString();
  }

  /**
   * 创建 session 数据
   */
  private createSessionData(events: SessionEvent[], filePath: string): ExportedSession {
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'codex-session-cli',
      session: {
        id: `rollout-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}-${uuidv4().substring(0, 8)}`,
        directory: 'Unknown',
        timestamp: firstEvent.timestamp,
        summary: this.extractSummary(events),
        messageCount: events.length,
        duration:
          new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime(),
      },
      events,
      metadata: {
        sessionId: '',
        startTime: new Date(firstEvent.timestamp),
        endTime: new Date(lastEvent.timestamp),
        directory: 'Unknown',
        model: 'unknown',
        totalTokens: 0,
        userMessageCount: events.filter(e => e.payload.type === 'user_message').length,
        agentMessageCount: events.filter(e => e.payload.type === 'agent_message').length,
        functionCallCount: events.filter(e => e.payload.type === 'function_call').length,
      },
    };
  }

  /**
   * 提取摘要
   */
  private extractSummary(events: SessionEvent[]): string {
    const userMessage = events.find(e => e.payload.type === 'user_message');
    if (userMessage && 'message' in userMessage.payload) {
      const msg = (userMessage.payload as any).message;
      return msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
    }
    return 'Imported session';
  }

  /**
   * 写入 session 文件
   */
  private async writeSession(data: ExportedSession): Promise<string> {
    const sessionDir = getSessionDirectory();
    await fs.ensureDir(sessionDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const uuid = uuidv4().substring(0, 8);
    const fileName = `rollout-${timestamp}-${uuid}.jsonl`;
    const outputPath = path.join(sessionDir, fileName);

    const lines = data.events.map(event => JSON.stringify(event));
    await fs.writeFile(outputPath, lines.join('\n') + '\n', 'utf-8');

    return outputPath;
  }

  /**
   * 验证文件
   */
  async validateFile(filePath: string): Promise<{
    valid: boolean;
    format?: ImportFormat;
    eventCount?: number;
    error?: string;
  }> {
    try {
      if (!(await fs.pathExists(filePath))) {
        return { valid: false, error: '文件不存在' };
      }

      const format = this.detectFormat(filePath);
      if (format === 'unknown') {
        return { valid: false, error: '不支持的文件格式' };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const events = this.parseContent(content, format);

      return {
        valid: events.length > 0,
        format,
        eventCount: events.length,
        error: events.length === 0 ? '文件中没有找到有效的会话数据' : undefined,
      };
    } catch {
      return { valid: false, error: '无法读取或解析文件' };
    }
  }
}
