import path from 'path';
import os from 'os';

/**
 * 获取 session 目录路径
 */
export function getSessionDirectory(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.codex', 'sessions');
}

/**
 * 标准化 session 路径
 * 将 Windows 反斜杠转换为正斜杠
 */
export function normalizeSessionPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * 从文件路径提取 session ID
 * 文件名格式: rollout-{timestamp}-{uuid}.jsonl
 */
export function extractSessionId(filePath: string): string {
  const fileName = path.basename(filePath);
  return fileName.replace('.jsonl', '');
}

/**
 * 判断是否为 session 文件
 */
export function isSessionFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return fileName.startsWith('rollout-') && fileName.endsWith('.jsonl');
}

/**
 * 从 session 文件路径提取日期
 */
export function getSessionDate(filePath: string): Date | null {
  const fileName = path.basename(filePath);
  const timestampMatch = fileName.match(/rollout-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/);

  if (!timestampMatch) {
    return null;
  }

  const [, dateStr, hours, minutes, seconds] = timestampMatch;
  const date = new Date(dateStr);
  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));

  return date;
}

/**
 * 获取相对路径
 */
export function getRelativePath(targetPath: string, basePath: string): string {
  return path.relative(basePath, targetPath);
}

/**
 * 判断路径是否在目录下
 */
export function isPathInDirectory(filePath: string, directory: string): boolean {
  const normalizedFilePath = path.resolve(filePath);
  const normalizedDirectory = path.resolve(directory);

  return normalizedFilePath.startsWith(normalizedDirectory);
}

/**
 * 获取 session 文件的目录路径
 */
export function getSessionFileDirectory(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * 构建 session 文件路径
 */
export function buildSessionPath(
  year: string,
  month: string,
  day: string,
  fileName: string,
): string {
  const sessionDir = getSessionDirectory();
  return path.join(sessionDir, year, month, day, fileName);
}
