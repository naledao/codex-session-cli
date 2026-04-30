import { describe, it, expect } from 'vitest';
import {
  Session,
  SessionDetail,
  SessionEvent,
  UserMessagePayload,
  AgentMessagePayload,
  FunctionCallPayload,
  SearchQuery,
  SearchResult,
  ExportFormat,
  ExportOptions,
  Config,
} from '../../src/types/session';

describe('Session Types', () => {
  describe('Session interface', () => {
    it('should have required properties', () => {
      const session: Session = {
        id: 'test-session-123',
        filePath: '/path/to/session.jsonl',
        directory: '/current/directory',
        timestamp: new Date(),
        summary: 'Test session summary',
        messageCount: 10,
        duration: 300000, // 5 minutes
        tags: ['test', 'example'],
      };

      expect(session.id).toBe('test-session-123');
      expect(session.filePath).toBe('/path/to/session.jsonl');
      expect(session.directory).toBe('/current/directory');
      expect(session.timestamp).toBeInstanceOf(Date);
      expect(session.summary).toBe('Test session summary');
      expect(session.messageCount).toBe(10);
      expect(session.duration).toBe(300000);
      expect(session.tags).toEqual(['test', 'example']);
    });

    it('should allow optional properties', () => {
      const session: Session = {
        id: 'test-session-456',
        filePath: '/path/to/session.jsonl',
        directory: '/current/directory',
        timestamp: new Date(),
        summary: 'Test session summary',
        messageCount: 5,
        duration: 150000,
        tags: [],
      };

      expect(session.tags).toEqual([]);
    });
  });

  describe('SessionDetail interface', () => {
    it('should extend Session with events and metadata', () => {
      const sessionDetail: SessionDetail = {
        id: 'test-session-789',
        filePath: '/path/to/session.jsonl',
        directory: '/current/directory',
        timestamp: new Date(),
        summary: 'Detailed session',
        messageCount: 15,
        duration: 450000,
        tags: ['detailed'],
        events: [],
        metadata: {
          sessionId: 'test-session-789',
          startTime: new Date(),
          endTime: new Date(),
          directory: '/current/directory',
          model: 'gpt-5.4',
          totalTokens: 1500,
          userMessageCount: 5,
          agentMessageCount: 5,
          functionCallCount: 10,
        },
      };

      expect(sessionDetail.events).toEqual([]);
      expect(sessionDetail.metadata.model).toBe('gpt-5.4');
      expect(sessionDetail.metadata.totalTokens).toBe(1500);
    });
  });

  describe('SessionEvent interface', () => {
    it('should represent a session event', () => {
      const event: SessionEvent = {
        timestamp: '2026-04-02T10:00:00.000Z',
        type: 'event_msg',
        payload: {
          type: 'user_message',
          message: 'Hello, Codex!',
          images: [],
          local_images: [],
          text_elements: [],
        },
      };

      expect(event.timestamp).toBe('2026-04-02T10:00:00.000Z');
      expect(event.type).toBe('event_msg');
      expect(event.payload.type).toBe('user_message');
    });
  });

  describe('UserMessagePayload interface', () => {
    it('should represent a user message', () => {
      const payload: UserMessagePayload = {
        type: 'user_message',
        message: 'What is the meaning of life?',
        images: [],
        local_images: ['/path/to/image.png'],
        text_elements: [
          {
            byte_range: { start: 0, end: 10 },
            placeholder: '[Image #1]',
          },
        ],
      };

      expect(payload.type).toBe('user_message');
      expect(payload.message).toBe('What is the meaning of life?');
      expect(payload.local_images).toHaveLength(1);
      expect(payload.text_elements).toHaveLength(1);
    });
  });

  describe('AgentMessagePayload interface', () => {
    it('should represent an agent message', () => {
      const payload: AgentMessagePayload = {
        type: 'agent_message',
        message: 'The meaning of life is 42.',
        phase: 'response',
        memory_citation: null,
      };

      expect(payload.type).toBe('agent_message');
      expect(payload.message).toBe('The meaning of life is 42.');
      expect(payload.phase).toBe('response');
      expect(payload.memory_citation).toBeNull();
    });
  });

  describe('FunctionCallPayload interface', () => {
    it('should represent a function call', () => {
      const payload: FunctionCallPayload = {
        type: 'function_call',
        name: 'shell_command',
        arguments: '{"command": "ls -la"}',
        call_id: 'call_123',
      };

      expect(payload.type).toBe('function_call');
      expect(payload.name).toBe('shell_command');
      expect(payload.arguments).toBe('{"command": "ls -la"}');
      expect(payload.call_id).toBe('call_123');
    });
  });

  describe('SearchQuery interface', () => {
    it('should represent a search query', () => {
      const query: SearchQuery = {
        query: 'database migration',
        directory: '/current/directory',
        afterDate: new Date('2026-04-01'),
        beforeDate: new Date('2026-04-30'),
        messageType: 'all',
        useRegex: false,
        limit: 50,
        offset: 0,
      };

      expect(query.query).toBe('database migration');
      expect(query.directory).toBe('/current/directory');
      expect(query.afterDate).toBeInstanceOf(Date);
      expect(query.beforeDate).toBeInstanceOf(Date);
      expect(query.messageType).toBe('all');
      expect(query.useRegex).toBe(false);
      expect(query.limit).toBe(50);
      expect(query.offset).toBe(0);
    });

    it('should allow optional properties', () => {
      const query: SearchQuery = {
        query: 'bug fix',
      };

      expect(query.query).toBe('bug fix');
      expect(query.directory).toBeUndefined();
      expect(query.afterDate).toBeUndefined();
      expect(query.beforeDate).toBeUndefined();
      expect(query.messageType).toBeUndefined();
      expect(query.useRegex).toBeUndefined();
      expect(query.limit).toBeUndefined();
      expect(query.offset).toBeUndefined();
    });
  });

  describe('SearchResult interface', () => {
    it('should represent a search result', () => {
      const result: SearchResult = {
        sessionId: 'session-123',
        sessionTimestamp: new Date(),
        directory: '/current/directory',
        matchedText: 'Found the bug in line 42',
        context: '...code before... Found the bug in line 42 ...code after...',
        lineNumber: 42,
        relevanceScore: 0.95,
      };

      expect(result.sessionId).toBe('session-123');
      expect(result.matchedText).toBe('Found the bug in line 42');
      expect(result.lineNumber).toBe(42);
      expect(result.relevanceScore).toBe(0.95);
    });
  });

  describe('ExportFormat type', () => {
    it('should accept valid export formats', () => {
      const formats: ExportFormat[] = ['json', 'text', 'markdown', 'csv'];

      formats.forEach(format => {
        expect(['json', 'text', 'markdown', 'csv']).toContain(format);
      });
    });
  });

  describe('ExportOptions interface', () => {
    it('should represent export options', () => {
      const options: ExportOptions = {
        format: 'json',
        outputPath: '/path/to/output.json',
        includeMetadata: true,
        includeEvents: true,
        prettyPrint: true,
        dateFormat: 'yyyy-MM-dd HH:mm',
      };

      expect(options.format).toBe('json');
      expect(options.outputPath).toBe('/path/to/output.json');
      expect(options.includeMetadata).toBe(true);
      expect(options.includeEvents).toBe(true);
      expect(options.prettyPrint).toBe(true);
      expect(options.dateFormat).toBe('yyyy-MM-dd HH:mm');
    });

    it('should allow minimal options', () => {
      const options: ExportOptions = {
        format: 'markdown',
      };

      expect(options.format).toBe('markdown');
      expect(options.outputPath).toBeUndefined();
      expect(options.includeMetadata).toBeUndefined();
      expect(options.includeEvents).toBeUndefined();
      expect(options.prettyPrint).toBeUndefined();
      expect(options.dateFormat).toBeUndefined();
    });
  });

  describe('Config interface', () => {
    it('should represent application configuration', () => {
      const config: Config = {
        sessionsPath: '~/.codex/sessions',
        defaultExportFormat: 'json',
        maxResults: 50,
        theme: 'default',
        dateFormat: 'yyyy-MM-dd HH:mm',
        showTimestamps: true,
        highlightMatches: true,
        language: 'zh',
      };

      expect(config.sessionsPath).toBe('~/.codex/sessions');
      expect(config.defaultExportFormat).toBe('json');
      expect(config.maxResults).toBe(50);
      expect(config.theme).toBe('default');
      expect(config.dateFormat).toBe('yyyy-MM-dd HH:mm');
      expect(config.showTimestamps).toBe(true);
      expect(config.highlightMatches).toBe(true);
      expect(config.language).toBe('zh');
    });

    it('should accept different themes', () => {
      const themes: Config['theme'][] = ['default', 'dark', 'light', 'colorful'];

      themes.forEach(theme => {
        const config: Config = {
          sessionsPath: '~/.codex/sessions',
          defaultExportFormat: 'json',
          maxResults: 50,
          theme,
          dateFormat: 'yyyy-MM-dd HH:mm',
          showTimestamps: true,
          highlightMatches: true,
          language: 'zh',
        };

        expect(config.theme).toBe(theme);
      });
    });

    it('should accept different languages', () => {
      const languages: Config['language'][] = ['zh', 'en'];

      languages.forEach(language => {
        const config: Config = {
          sessionsPath: '~/.codex/sessions',
          defaultExportFormat: 'json',
          maxResults: 50,
          theme: 'default',
          dateFormat: 'yyyy-MM-dd HH:mm',
          showTimestamps: true,
          highlightMatches: true,
          language,
        };

        expect(config.language).toBe(language);
      });
    });
  });
});