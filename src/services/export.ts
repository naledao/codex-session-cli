import fs from 'fs-extra';
import path from 'path';
import { ExportFormat, SessionDetail, SessionEvent } from '@/types/session';
import { SessionService } from './session';
import { createLogger } from '@/utils/logger';
import { formatDate, formatDuration } from '@/utils/format';

export class ExportService {
  private sessionService: SessionService;
  private logger = createLogger('ExportService');

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * 导出单个 session
   */
  async exportSession(sessionId: string, format: ExportFormat): Promise<string> {
    const session = await this.sessionService.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    switch (format) {
      case 'json':
        return this.exportAsJson(session);
      case 'text':
        return this.exportAsText(session);
      case 'markdown':
        return this.exportAsMarkdown(session);
      case 'csv':
        return this.exportAsCsv(session);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 批量导出
   */
  async exportMultipleSessions(sessionIds: string[], format: ExportFormat): Promise<string> {
    const sessions: SessionDetail[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.sessionService.getSessionById(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    if (sessions.length === 0) {
      throw new Error('No sessions found');
    }

    switch (format) {
      case 'json':
        return this.exportMultipleAsJson(sessions);
      case 'text':
        return this.exportMultipleAsText(sessions);
      case 'markdown':
        return this.exportMultipleAsMarkdown(sessions);
      case 'csv':
        return this.exportMultipleAsCsv(sessions);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 导出到文件
   */
  async exportToFile(sessionId: string, format: ExportFormat, outputPath: string): Promise<void> {
    const content = await this.exportSession(sessionId, format);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content, 'utf-8');
    this.logger.info(`Exported session to: ${outputPath}`);
  }

  /**
   * 批量导出到文件
   */
  async exportMultipleToFile(
    sessionIds: string[],
    format: ExportFormat,
    outputDir: string,
  ): Promise<string[]> {
    const outputPaths: string[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.sessionService.getSessionById(sessionId);
      if (session) {
        const fileName = `${sessionId}.${this.getFileExtension(format)}`;
        const outputPath = path.join(outputDir, fileName);
        await this.exportToFile(sessionId, format, outputPath);
        outputPaths.push(outputPath);
      }
    }

    return outputPaths;
  }

  /**
   * 获取支持的格式
   */
  getSupportedFormats(): ExportFormat[] {
    return ['json', 'text', 'markdown', 'csv'];
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      json: 'json',
      text: 'txt',
      markdown: 'md',
      csv: 'csv',
    };
    return extensions[format];
  }

  // ==================== JSON 格式 ====================

  private exportAsJson(session: SessionDetail): string {
    const exportData = {
      id: session.id,
      timestamp: session.timestamp,
      directory: session.directory,
      summary: session.summary,
      duration: session.duration,
      messageCount: session.messageCount,
      metadata: session.metadata,
      events: session.events.map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        payloadType: event.payload.type,
        content: this.extractEventContent(event),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  private exportMultipleAsJson(sessions: SessionDetail[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      sessionCount: sessions.length,
      sessions: sessions.map(session => ({
        id: session.id,
        timestamp: session.timestamp,
        directory: session.directory,
        summary: session.summary,
        duration: session.duration,
        messageCount: session.messageCount,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // ==================== 纯文本格式 ====================

  private exportAsText(session: SessionDetail): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push(`Session: ${session.id}`);
    lines.push(`Date: ${formatDate(session.timestamp)}`);
    lines.push(`Directory: ${session.directory}`);
    lines.push(`Duration: ${formatDuration(session.duration)}`);
    lines.push(`Messages: ${session.messageCount}`);
    lines.push('='.repeat(60));
    lines.push('');

    session.events.forEach(event => {
      const content = this.formatEventAsText(event);
      if (content) {
        lines.push(content);
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  private exportMultipleAsText(sessions: SessionDetail[]): string {
    const lines: string[] = [];

    lines.push('Codex Sessions Export');
    lines.push(`Export Date: ${formatDate(new Date())}`);
    lines.push(`Total Sessions: ${sessions.length}`);
    lines.push('');

    sessions.forEach((session, index) => {
      lines.push(`--- Session ${index + 1} ---`);
      lines.push(this.exportAsText(session));
      lines.push('');
    });

    return lines.join('\n');
  }

  private formatEventAsText(event: SessionEvent): string | null {
    const timestamp = formatDate(new Date(event.timestamp), 'HH:mm:ss');

    if (event.type === 'event_msg') {
      switch (event.payload.type) {
        case 'user_message':
          return `[User] ${timestamp}\n${event.payload.message}`;
        case 'agent_message':
          return `[Agent] ${timestamp}\n${event.payload.message}`;
        case 'exec_command_end':
          return `[Command] ${timestamp}\n$ ${event.payload.command.join(' ')}\n${event.payload.stdout || ''}`;
        default:
          return null;
      }
    }

    if (event.type === 'response_item') {
      switch (event.payload.type) {
        case 'function_call':
          return `[Tool] ${timestamp} - ${event.payload.name}\n${event.payload.arguments}`;
        case 'function_call_output':
          return `[Tool Output] ${timestamp}\n${event.payload.output}`;
        default:
          return null;
      }
    }

    return null;
  }

  // ==================== Markdown 格式 ====================

  private exportAsMarkdown(session: SessionDetail): string {
    const lines: string[] = [];

    lines.push(`# Session: ${session.id}`);
    lines.push('');
    lines.push('## Metadata');
    lines.push('');
    lines.push('| Key | Value |');
    lines.push('|-----|-------|');
    lines.push(`| ID | ${session.id} |`);
    lines.push(`| Date | ${formatDate(session.timestamp)} |`);
    lines.push(`| Directory | ${session.directory} |`);
    lines.push(`| Duration | ${formatDuration(session.duration)} |`);
    lines.push(`| Messages | ${session.messageCount} |`);
    lines.push('');

    lines.push('## Conversation');
    lines.push('');

    session.events.forEach(event => {
      const content = this.formatEventAsMarkdown(event);
      if (content) {
        lines.push(content);
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  private exportMultipleAsMarkdown(sessions: SessionDetail[]): string {
    const lines: string[] = [];

    lines.push('# Codex Sessions Export');
    lines.push('');
    lines.push(`**Export Date:** ${formatDate(new Date())}`);
    lines.push(`**Total Sessions:** ${sessions.length}`);
    lines.push('');

    lines.push('## Sessions');
    lines.push('');

    sessions.forEach(session => {
      lines.push(`### ${session.id}`);
      lines.push('');
      lines.push(`- **Date:** ${formatDate(session.timestamp)}`);
      lines.push(`- **Directory:** ${session.directory}`);
      lines.push(`- **Duration:** ${formatDuration(session.duration)}`);
      lines.push(`- **Messages:** ${session.messageCount}`);
      lines.push('');
    });

    lines.push('## Details');
    lines.push('');

    sessions.forEach(session => {
      lines.push(`### Session: ${session.id}`);
      lines.push('');
      lines.push(this.exportAsMarkdown(session));
      lines.push('');
      lines.push('---');
      lines.push('');
    });

    return lines.join('\n');
  }

  private formatEventAsMarkdown(event: SessionEvent): string | null {
    const timestamp = formatDate(new Date(event.timestamp), 'HH:mm:ss');

    if (event.type === 'event_msg') {
      switch (event.payload.type) {
        case 'user_message':
          return `#### User (${timestamp})\n\n${event.payload.message}`;
        case 'agent_message':
          return `#### Agent (${timestamp})\n\n${event.payload.message}`;
        case 'exec_command_end':
          return `#### Command (${timestamp})\n\n\`\`\`bash\n$ ${event.payload.command.join(' ')}\n${event.payload.stdout || ''}\n\`\`\``;
        default:
          return null;
      }
    }

    if (event.type === 'response_item') {
      switch (event.payload.type) {
        case 'function_call':
          return `#### Tool: ${event.payload.name} (${timestamp})\n\n\`\`\`json\n${event.payload.arguments}\n\`\`\``;
        case 'function_call_output':
          return `#### Tool Output (${timestamp})\n\n\`\`\`\n${event.payload.output}\n\`\`\``;
        default:
          return null;
      }
    }

    return null;
  }

  // ==================== CSV 格式 ====================

  private exportAsCsv(session: SessionDetail): string {
    const rows: string[] = [];

    // Header
    rows.push('timestamp,type,content');

    // Data
    session.events.forEach(event => {
      const content = this.extractEventContent(event);
      if (content) {
        const escapedContent = this.escapeCsvField(content);
        rows.push(`${event.timestamp},${event.payload.type},"${escapedContent}"`);
      }
    });

    return rows.join('\n');
  }

  private exportMultipleAsCsv(sessions: SessionDetail[]): string {
    const rows: string[] = [];

    // Header
    rows.push('session_id,timestamp,type,content');

    // Data
    sessions.forEach(session => {
      session.events.forEach(event => {
        const content = this.extractEventContent(event);
        if (content) {
          const escapedContent = this.escapeCsvField(content);
          rows.push(`${session.id},${event.timestamp},${event.payload.type},"${escapedContent}"`);
        }
      });
    });

    return rows.join('\n');
  }

  private escapeCsvField(field: string): string {
    return field.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
  }

  // ==================== 辅助方法 ====================

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
}
