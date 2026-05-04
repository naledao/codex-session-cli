import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '@/services/session';

// Mock 依赖
vi.mock('@/utils/path', () => ({
  getSessionDirectory: vi.fn(() => '/mock/sessions'),
  extractSessionId: vi.fn(path => 'mock-id'),
  isSessionFile: vi.fn(() => true),
  getSessionDate: vi.fn(() => new Date()),
  isPathInDirectory: vi.fn(() => true),
}));

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(() => true),
    readdir: vi.fn(() => []),
    readFile: vi.fn(() => ''),
    stat: vi.fn(() => ({ size: 100 })),
    ensureDir: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    sessionService = new SessionService();
  });

  describe('getAllSessions', () => {
    it('should return sessions array', async () => {
      const sessions = await sessionService.getAllSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should return empty array when no sessions', async () => {
      const sessions = await sessionService.getAllSessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('getCurrentDirectorySessions', () => {
    it('should return sessions for current directory', async () => {
      const sessions = await sessionService.getCurrentDirectorySessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('getSessionById', () => {
    it('should return null for non-existent session', async () => {
      const session = await sessionService.getSessionById('non-existent');
      expect(session).toBeNull();
    });
  });

  describe('getSessionStats', () => {
    it('should return stats object', async () => {
      const stats = await sessionService.getSessionStats();

      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('averageSessionDuration');
    });
  });

  describe('deleteSession', () => {
    it('should return false for non-existent session', async () => {
      const result = await sessionService.deleteSession('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear cache without error', () => {
      expect(() => sessionService.clearCache()).not.toThrow();
    });
  });
});
