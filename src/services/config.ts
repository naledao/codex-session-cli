import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Config, ExportFormat } from '@/types/session';
import { createLogger } from '@/utils/logger';

// 默认配置
export const DEFAULT_CONFIG: Config = {
  sessionsPath: '~/.codex/sessions',
  defaultExportFormat: 'json',
  maxResults: 50,
  theme: 'default',
  dateFormat: 'yyyy-MM-dd HH:mm',
  showTimestamps: true,
  highlightMatches: true,
  language: 'zh',
  cacheEnabled: true,
  cacheTTL: 3600000,
  maxFileSize: 104857600,
  concurrentParsing: 5,
};

export class ConfigService {
  private configPath: string;
  private configDir: string;
  private config: Config | null = null;
  private logger = createLogger('ConfigService');

  constructor() {
    const homeDir = os.homedir();
    this.configDir = path.join(homeDir, '.codex-session-viewer');
    this.configPath = path.join(this.configDir, 'config.json');
  }

  /**
   * 获取配置
   */
  async getConfig(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    try {
      // 确保配置目录存在
      await fs.ensureDir(this.configDir);

      // 读取配置文件
      const exists = await fs.pathExists(this.configPath);
      if (exists) {
        const content = await fs.readFile(this.configPath, 'utf-8');
        const savedConfig = JSON.parse(content);

        // 合并默认配置和保存的配置
        this.config = {
          ...DEFAULT_CONFIG,
          ...savedConfig,
        };
      } else {
        // 使用默认配置
        this.config = { ...DEFAULT_CONFIG };
        await this.saveConfig(this.config);
      }

      return this.config || { ...DEFAULT_CONFIG };
    } catch (error) {
      this.logger.error('Failed to load config:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config: Config): Promise<void> {
    try {
      await fs.ensureDir(this.configDir);
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      this.config = config;
      this.logger.info('Config saved successfully');
    } catch (error) {
      this.logger.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<Config>): Promise<Config> {
    const currentConfig = await this.getConfig();
    const newConfig = {
      ...currentConfig,
      ...updates,
    };

    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 重置配置
   */
  async resetConfig(): Promise<Config> {
    const defaultConfig = { ...DEFAULT_CONFIG };
    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  /**
   * 获取单个配置项
   */
  async get<K extends keyof Config>(key: K): Promise<Config[K]> {
    const config = await this.getConfig();
    return config[key];
  }

  /**
   * 设置单个配置项
   */
  async set<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
    await this.updateConfig({ [key]: value } as Partial<Config>);
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 获取配置目录路径
   */
  getConfigDirectory(): string {
    return this.configDir;
  }

  /**
   * 检查配置文件是否存在
   */
  async configExists(): Promise<boolean> {
    return fs.pathExists(this.configPath);
  }

  /**
   * 导出配置
   */
  async exportConfig(): Promise<string> {
    const config = await this.getConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入配置
   */
  async importConfig(configJson: string): Promise<Config> {
    try {
      const importedConfig = JSON.parse(configJson);

      // 验证配置
      this.validateConfig(importedConfig);

      // 合并配置
      const currentConfig = await this.getConfig();
      const newConfig = {
        ...currentConfig,
        ...importedConfig,
      };

      await this.saveConfig(newConfig);
      return newConfig;
    } catch (error) {
      this.logger.error('Failed to import config:', error);
      throw error;
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: any): void {
    // 验证必需字段
    if (config.sessionsPath && typeof config.sessionsPath !== 'string') {
      throw new Error('Invalid sessionsPath');
    }

    if (config.maxResults && (typeof config.maxResults !== 'number' || config.maxResults < 1)) {
      throw new Error('Invalid maxResults');
    }

    if (config.theme && !['default', 'dark', 'light', 'colorful'].includes(config.theme)) {
      throw new Error('Invalid theme');
    }

    if (config.language && !['zh', 'en'].includes(config.language)) {
      throw new Error('Invalid language');
    }

    if (
      config.defaultExportFormat &&
      !['json', 'text', 'markdown', 'csv'].includes(config.defaultExportFormat)
    ) {
      throw new Error('Invalid defaultExportFormat');
    }
  }

  /**
   * 获取搜索历史文件路径
   */
  getSearchHistoryPath(): string {
    return path.join(this.configDir, 'search-history.json');
  }

  /**
   * 获取主题目录路径
   */
  getThemesDir(): string {
    return path.join(this.configDir, 'themes');
  }
}
