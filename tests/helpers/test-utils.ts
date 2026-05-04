import fs from 'fs-extra';
import path from 'path';
import os from 'os';

/**
 * 创建临时测试目录
 */
export async function createTempDir(): Promise<string> {
  const tempDir = path.join(os.tmpdir(), 'codex-session-viewer-test');
  await fs.ensureDir(tempDir);
  return tempDir;
}

/**
 * 清理临时测试目录
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  await fs.remove(dir);
}

/**
 * 创建测试 session 文件
 */
export async function createTestSession(
  dir: string,
  sessionId: string,
  events: any[],
): Promise<string> {
  const filePath = path.join(dir, `${sessionId}.jsonl`);
  const content = events.map(e => JSON.stringify(e)).join('\n');
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

/**
 * 创建测试配置文件
 */
export async function createTestConfig(dir: string, config: any): Promise<string> {
  const filePath = path.join(dir, 'config.json');
  await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
  return filePath;
}

/**
 * Mock 环境变量
 */
export function mockEnv(vars: Record<string, string>): () => void {
  const originalEnv = process.env;

  process.env = {
    ...originalEnv,
    ...vars,
  };

  return () => {
    process.env = originalEnv;
  };
}

/**
 * 生成测试事件
 */
export function generateTestEvents(count: number): any[] {
  const events = [];

  for (let i = 0; i < count; i++) {
    events.push({
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: `Test message ${i}`,
        images: [],
        local_images: [],
        text_elements: [],
      },
    });
  }

  return events;
}
