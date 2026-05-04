import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExportedSession, ImportResult } from '../types/session';
import { getSessionDirectory } from '../utils/path';
import { createLogger } from '../utils/logger';

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

      // 2. 读取并解析文件
      const content = await fs.readFile(filePath, 'utf-8');
      let data: ExportedSession;

      try {
        data = JSON.parse(content);
      } catch {
        return { success: false, error: '文件格式无效，不是有效的 JSON' };
      }

      // 3. 验证数据结构
      const validation = this.validateData(data);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 4. 生成新的 session 文件
      const outputPath = await this.writeSession(data);

      this.logger.info(`Imported session to: ${outputPath}`);

      return {
        success: true,
        sessionId: data.session.id,
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
   * 验证导入数据
   */
  private validateData(data: ExportedSession | Record<string, unknown>): {
    valid: boolean;
    error?: string;
  } {
    if (!('version' in data) || !data.version) {
      return { valid: false, error: '缺少版本号' };
    }

    if (data.version !== '1.0') {
      return { valid: false, error: `不支持的版本: ${data.version}` };
    }

    if (!data.session || !data.events) {
      return { valid: false, error: '数据结构不完整' };
    }

    if (!Array.isArray(data.events)) {
      return { valid: false, error: '事件列表格式错误' };
    }

    return { valid: true };
  }

  /**
   * 写入 session 文件
   */
  private async writeSession(data: ExportedSession): Promise<string> {
    const sessionDir = getSessionDirectory();
    await fs.ensureDir(sessionDir);

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const uuid = uuidv4().substring(0, 8);
    const fileName = `rollout-${timestamp}-${uuid}.jsonl`;
    const outputPath = path.join(sessionDir, fileName);

    // 写入 JSONL
    const lines = data.events.map(event => JSON.stringify(event));
    await fs.writeFile(outputPath, lines.join('\n') + '\n', 'utf-8');

    return outputPath;
  }

  /**
   * 验证文件是否为有效的会话文件
   */
  async validateFile(filePath: string): Promise<{
    valid: boolean;
    data?: ExportedSession;
    error?: string;
  }> {
    try {
      if (!(await fs.pathExists(filePath))) {
        return { valid: false, error: '文件不存在' };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      const validation = this.validateData(data);
      if (!validation.valid) {
        return { valid: false, error: validation.error };
      }

      return { valid: true, data };
    } catch {
      return { valid: false, error: '无法读取或解析文件' };
    }
  }
}
