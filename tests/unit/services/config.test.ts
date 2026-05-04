import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService, DEFAULT_CONFIG } from '@/services/config';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    pathExists: vi.fn(() => false),
    readFile: vi.fn(() => '{}'),
    writeFile: vi.fn(),
  },
}));

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  describe('getConfig', () => {
    it('should return config object', async () => {
      const config = await configService.getConfig();

      expect(config).toHaveProperty('sessionsPath');
      expect(config).toHaveProperty('defaultExportFormat');
      expect(config).toHaveProperty('maxResults');
      expect(config).toHaveProperty('theme');
      expect(config).toHaveProperty('language');
    });

    it('should return default config when no file exists', async () => {
      const config = await configService.getConfig();

      expect(config.sessionsPath).toBe(DEFAULT_CONFIG.sessionsPath);
      expect(config.theme).toBe(DEFAULT_CONFIG.theme);
    });
  });

  describe('saveConfig', () => {
    it('should save config without error', async () => {
      const config = { ...DEFAULT_CONFIG, theme: 'dark' as const };
      await expect(configService.saveConfig(config)).resolves.not.toThrow();
    });
  });

  describe('updateConfig', () => {
    it('should update config', async () => {
      const updated = await configService.updateConfig({ theme: 'dark' });
      expect(updated.theme).toBe('dark');
    });
  });

  describe('resetConfig', () => {
    it('should reset to default config', async () => {
      const config = await configService.resetConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('get', () => {
    it('should get single config value', async () => {
      const theme = await configService.get('theme');
      expect(theme).toBe(DEFAULT_CONFIG.theme);
    });
  });

  describe('set', () => {
    it('should set single config value', async () => {
      await configService.set('theme', 'dark');
      const theme = await configService.get('theme');
      expect(theme).toBe('dark');
    });
  });

  describe('getConfigPath', () => {
    it('should return config path', () => {
      const path = configService.getConfigPath();
      expect(path).toContain('config.json');
    });
  });

  describe('getConfigDirectory', () => {
    it('should return config directory', () => {
      const dir = configService.getConfigDirectory();
      expect(dir).toContain('.codex-session-viewer');
    });
  });

  describe('configExists', () => {
    it('should return boolean', async () => {
      const exists = await configService.configExists();
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('exportConfig', () => {
    it('should export config as JSON string', async () => {
      const json = await configService.exportConfig();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('sessionsPath');
      expect(parsed).toHaveProperty('theme');
    });
  });

  describe('importConfig', () => {
    it('should import valid config', async () => {
      const configJson = JSON.stringify({ theme: 'dark' });
      const imported = await configService.importConfig(configJson);

      expect(imported.theme).toBe('dark');
    });

    it('should throw error for invalid config', async () => {
      const invalidConfig = JSON.stringify({ theme: 'invalid-theme' });
      await expect(configService.importConfig(invalidConfig)).rejects.toThrow();
    });
  });

  describe('getSearchHistoryPath', () => {
    it('should return search history path', () => {
      const path = configService.getSearchHistoryPath();
      expect(path).toContain('search-history.json');
    });
  });

  describe('getThemesDir', () => {
    it('should return themes directory', () => {
      const dir = configService.getThemesDir();
      expect(dir).toContain('themes');
    });
  });
});
