import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParserService } from '@/services/parser';

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(() => true),
    readFile: vi.fn(
      () =>
        '{"timestamp":"2026-04-02T10:00:00Z","type":"event_msg","payload":{"type":"user_message","message":"test"}}',
    ),
    createReadStream: vi.fn(),
  },
}));

describe('ParserService', () => {
  let parserService: ParserService;

  beforeEach(() => {
    parserService = new ParserService();
  });

  describe('parseSessionFile', () => {
    it('should return events array', async () => {
      const events = await parserService.parseSessionFile('/mock/path.jsonl');
      expect(Array.isArray(events)).toBe(true);
    });

    it('should return empty array for non-existent file', async () => {
      const { default: fs } = await import('fs-extra');
      (fs.pathExists as any).mockResolvedValue(false);

      const events = await parserService.parseSessionFile('/nonexistent/path.jsonl');
      expect(events).toEqual([]);
    });
  });

  describe('validateSessionFile', () => {
    it('should return boolean', async () => {
      const result = await parserService.validateSessionFile('/mock/path.jsonl');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('extractSessionSummary', () => {
    it('should return summary object', async () => {
      const summary = await parserService.extractSessionSummary('/mock/path.jsonl');

      expect(summary).toHaveProperty('filePath');
      expect(summary).toHaveProperty('summary');
      expect(summary).toHaveProperty('directory');
      expect(summary).toHaveProperty('startTime');
      expect(summary).toHaveProperty('endTime');
      expect(summary).toHaveProperty('duration');
    });
  });

  describe('extractUserMessages', () => {
    it('should return array', async () => {
      const messages = await parserService.extractUserMessages('/mock/path.jsonl');
      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('extractAgentMessages', () => {
    it('should return array', async () => {
      const messages = await parserService.extractAgentMessages('/mock/path.jsonl');
      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('extractFunctionCalls', () => {
    it('should return array', async () => {
      const calls = await parserService.extractFunctionCalls('/mock/path.jsonl');
      expect(Array.isArray(calls)).toBe(true);
    });
  });

  describe('extractExecutedCommands', () => {
    it('should return array', async () => {
      const commands = await parserService.extractExecutedCommands('/mock/path.jsonl');
      expect(Array.isArray(commands)).toBe(true);
    });
  });

  describe('searchInFile', () => {
    it('should return array of line numbers', async () => {
      const lines = await parserService.searchInFile('/mock/path.jsonl', 'test');
      expect(Array.isArray(lines)).toBe(true);
    });
  });
});
