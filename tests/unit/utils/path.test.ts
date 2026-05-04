import { describe, it, expect } from 'vitest';
import {
  getSessionDirectory,
  extractSessionId,
  isSessionFile,
  getSessionDate,
  normalizeSessionPath,
} from '@/utils/path';

describe('Path Utilities', () => {
  describe('getSessionDirectory', () => {
    it('should return session directory path', () => {
      const result = getSessionDirectory();
      expect(result).toContain('.codex');
      expect(result).toContain('sessions');
    });
  });

  describe('extractSessionId', () => {
    it('should extract session ID from file path', () => {
      const filePath = '/path/to/rollout-2026-04-02T10-00-10-019d4beb.jsonl';
      const result = extractSessionId(filePath);
      expect(result).toBe('rollout-2026-04-02T10-00-10-019d4beb');
    });

    it('should handle path with directories', () => {
      const filePath = 'C:\\Users\\test\\.codex\\sessions\\2026\\04\\02\\rollout-2026-04-02.jsonl';
      const result = extractSessionId(filePath);
      expect(result).toBe('rollout-2026-04-02');
    });
  });

  describe('isSessionFile', () => {
    it('should return true for session files', () => {
      expect(isSessionFile('rollout-2026-04-02T10-00-10.jsonl')).toBe(true);
    });

    it('should return false for non-session files', () => {
      expect(isSessionFile('config.json')).toBe(false);
      expect(isSessionFile('readme.md')).toBe(false);
    });
  });

  describe('getSessionDate', () => {
    it('should extract date from session file', () => {
      const filePath = '/path/to/rollout-2026-04-02T10-30-45.jsonl';
      const result = getSessionDate(filePath);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(3); // April (0-indexed)
      expect(result?.getDate()).toBe(2);
    });

    it('should return null for invalid file', () => {
      const result = getSessionDate('invalid-file.jsonl');
      expect(result).toBeNull();
    });
  });

  describe('normalizeSessionPath', () => {
    it('should normalize Windows path', () => {
      const input = 'C:\\Users\\test\\sessions';
      const result = normalizeSessionPath(input);
      expect(result).toBe('C:/Users/test/sessions');
    });

    it('should keep Unix path unchanged', () => {
      const input = '/home/user/sessions';
      const result = normalizeSessionPath(input);
      expect(result).toBe('/home/user/sessions');
    });
  });
});
