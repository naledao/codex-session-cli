import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExportedSession, ImportResult, SessionEvent, EventPayload } from '../types/session';
import { getSessionDirectory } from '../utils/path';
import { createLogger } from '../utils/logger';

type ImportFormat = 'json' | 'text' | 'markdown' | 'csv' | 'unknown';

export class ImportService {
  private logger = createLogger('ImportService');

  async importSession(filePath: string): Promise<ImportResult> {
    try {
      if (!(await fs.pathExists(filePath))) {
        return { success: false, error: '文件不存在' };
      }

      const format = this.detectFormat(filePath);
      if (format === 'unknown') {
        return { success: false, error: '不支持的文件格式，请使用 .json, .txt, .md, .csv 文件' };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const events = this.parseContent(content, format);

      if (events.length === 0) {
        return { success: false, error: '文件中没有找到有效的会话数据' };
      }

      const sessionData = this.createSessionData(events);
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

  private parseJson(content: string): SessionEvent[] {
    try {
      const data = JSON.parse(content);

      if (data.version && data.events && Array.isArray(data.events)) {
        return data.events;
      }

      if (data.events && Array.isArray(data.events)) {
        return data.events.map((e: any) =>
          this.createEvent(e.payloadType || e.type || 'user_message', e.timestamp, e.content || ''),
        );
      }

      return [];
    } catch {
      return [];
    }
  }

  private parseText(content: string): SessionEvent[] {
    const events: SessionEvent[] = [];
    const lines = content.split('\n');
    let currentType: string | null = null;
    let currentTimestamp: string | null = null;
    let contentLines: string[] = [];

    for (const line of lines) {
      const userMatch = line.match(/^\[User\]\s+(\d{2}:\d{2}:\d{2})/);
      const agentMatch = line.match(/^\[Agent\]\s+(\d{2}:\d{2}:\d{2})/);
      const commandMatch = line.match(/^\[Command\]\s+(\d{2}:\d{2}:\d{2})/);
      const toolMatch = line.match(/^\[Tool\]\s+(\d{2}:\d{2}:\d{2})/);

      if (userMatch || agentMatch || commandMatch || toolMatch) {
        if (currentType && currentTimestamp && contentLines.length > 0) {
          events.push(this.createEvent(currentType, currentTimestamp, contentLines.join('\n')));
        }

        currentTimestamp = this.createTimestamp(
          userMatch?.[1] || agentMatch?.[1] || commandMatch?.[1] || toolMatch?.[1] || '00:00:00',
        );

        if (userMatch) currentType = 'user_message';
        else if (agentMatch) currentType = 'agent_message';
        else if (commandMatch) currentType = 'exec_command_end';
        else if (toolMatch) currentType = 'function_call';

        contentLines = [];
      } else if (line.trim() && currentType) {
        contentLines.push(line);
      }
    }

    if (currentType && currentTimestamp && contentLines.length > 0) {
      events.push(this.createEvent(currentType, currentTimestamp, contentLines.join('\n')));
    }

    return events;
  }

  private parseMarkdown(content: string): SessionEvent[] {
    const events: SessionEvent[] = [];
    const lines = content.split('\n');
    let currentType: string | null = null;
    let currentTimestamp: string | null = null;
    let contentLines: string[] = [];

    for (const line of lines) {
      const userMatch = line.match(/^####\s+User\s+\((\d{2}:\d{2}:\d{2})\)/);
      const agentMatch = line.match(/^####\s+Agent\s+\((\d{2}:\d{2}:\d{2})\)/);
      const commandMatch = line.match(/^####\s+Command\s+\((\d{2}:\d{2}:\d{2})\)/);
      const toolMatch = line.match(/^####\s+Tool:\s+.+\s+\((\d{2}:\d{2}:\d{2})\)/);
      const toolOutputMatch = line.match(/^####\s+Tool Output\s+\((\d{2}:\d{2}:\d{2})\)/);

      if (userMatch || agentMatch || commandMatch || toolMatch || toolOutputMatch) {
        if (currentType && currentTimestamp && contentLines.length > 0) {
          events.push(this.createEvent(currentType, currentTimestamp, contentLines.join('\n')));
        }

        currentTimestamp = this.createTimestamp(
          userMatch?.[1] ||
            agentMatch?.[1] ||
            commandMatch?.[1] ||
            toolMatch?.[1] ||
            toolOutputMatch?.[1] ||
            '00:00:00',
        );

        if (userMatch) currentType = 'user_message';
        else if (agentMatch) currentType = 'agent_message';
        else if (commandMatch) currentType = 'exec_command_end';
        else if (toolMatch) currentType = 'function_call';
        else if (toolOutputMatch) currentType = 'function_call_output';

        contentLines = [];
      } else if (
        line.trim() &&
        currentType &&
        !line.startsWith('#') &&
        !line.startsWith('|') &&
        line.trim() !== '```' &&
        !line.trim().startsWith('```')
      ) {
        contentLines.push(line);
      }
    }

    if (currentType && currentTimestamp && contentLines.length > 0) {
      events.push(this.createEvent(currentType, currentTimestamp, contentLines.join('\n')));
    }

    return events;
  }

  private parseCsv(content: string): SessionEvent[] {
    const events: SessionEvent[] = [];
    const lines = content.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCsvLine(line);
      if (parts.length >= 3) {
        const [timestamp, type, ...contentParts] = parts;
        const eventContent = contentParts.join(',');
        events.push(this.createEvent(type, timestamp, eventContent));
      }
    }

    return events;
  }

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

  private createEvent(type: string, timestamp: string, content: string): SessionEvent {
    let payload: EventPayload;

    switch (type) {
      case 'user_message':
        payload = {
          type: 'user_message',
          message: content,
          images: [],
          local_images: [],
          text_elements: [],
        } as EventPayload;
        break;
      case 'agent_message':
        payload = {
          type: 'agent_message',
          message: content,
          phase: 'response',
          memory_citation: null,
        } as EventPayload;
        break;
      case 'exec_command_end':
        payload = {
          type: 'exec_command_end',
          call_id: '',
          turn_id: '',
          command: content.split(' '),
          cwd: '',
          parsed_cmd: [],
          source: 'agent',
          stdout: '',
          stderr: '',
          aggregated_output: '',
          exit_code: 0,
          duration: { secs: 0, nanos: 0 },
          formatted_output: '',
          status: 'completed',
        } as EventPayload;
        break;
      case 'function_call':
        payload = {
          type: 'function_call',
          name: 'unknown',
          arguments: content,
          call_id: '',
        } as EventPayload;
        break;
      case 'function_call_output':
        payload = { type: 'function_call_output', call_id: '', output: content } as EventPayload;
        break;
      default:
        payload = {
          type: 'user_message',
          message: content,
          images: [],
          local_images: [],
          text_elements: [],
        } as EventPayload;
    }

    return {
      timestamp,
      type:
        type === 'function_call' || type === 'function_call_output' ? 'response_item' : 'event_msg',
      payload,
    };
  }

  private createTimestamp(timeStr: string): string {
    const today = new Date();
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    today.setHours(hours, minutes, seconds || 0, 0);
    return today.toISOString();
  }

  private createSessionData(events: SessionEvent[]): ExportedSession {
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

  private extractSummary(events: SessionEvent[]): string {
    const userMessage = events.find(e => e.payload.type === 'user_message');
    if (userMessage && 'message' in userMessage.payload) {
      const msg = (userMessage.payload as any).message;
      return msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
    }
    return 'Imported session';
  }

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
