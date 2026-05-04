import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDuration,
  formatFileSize,
  formatTokenCount,
  truncateText,
} from '@/utils/format';

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-04-02T10:30:00');
      const result = formatDate(date, 'yyyy-MM-dd HH:mm');
      expect(result).toBe('2026-04-02 10:30');
    });

    it('should use default format', () => {
      const date = new Date('2026-04-02T10:30:00');
      const result = formatDate(date);
      expect(result).toBeDefined();
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(65000)).toBe('1m 5s');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500.0 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('formatTokenCount', () => {
    it('should format token count', () => {
      expect(formatTokenCount(1500)).toBe('1,500');
    });

    it('should handle large numbers', () => {
      expect(formatTokenCount(1000000)).toBe('1,000,000');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'Hello World, this is a long text';
      const result = truncateText(text, 10);
      expect(result).toBe('Hello Worl...');
    });

    it('should not truncate short text', () => {
      const text = 'Hello';
      const result = truncateText(text, 10);
      expect(result).toBe('Hello');
    });
  });
});
