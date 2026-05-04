import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期
 */
export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
  return format(date, formatStr, { locale: zhCN });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
}

/**
 * 格式化持续时间
 * 输入: 毫秒
 * 输出: 如 "1h 2m 3s"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ');
}

/**
 * 格式化文件大小
 * 输入: 字节数
 * 输出: 如 "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 格式化 token 数量
 * 输入: token 数
 * 输出: 如 "1,500"
 */
export function formatTokenCount(count: number): string {
  return count.toLocaleString('zh-CN');
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * 格式化消息摘要
 * 提取消息的前 N 个字符作为摘要
 */
export function formatMessageSummary(message: string, maxLength: number = 50): string {
  // 移除多余空白
  const cleaned = message.replace(/\s+/g, ' ').trim();
  return truncateText(cleaned, maxLength);
}

/**
 * 高亮文本中的关键词
 */
export function highlightText(text: string, keyword: string): string {
  if (!keyword) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
  return text.replace(regex, '\x1b[43m$1\x1b[0m');
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 格式化表格行
 */
export function formatTableRow(columns: string[], widths: number[]): string {
  return columns
    .map((col, i) => {
      const width = widths[i] || 20;
      return col.padEnd(width).substring(0, width);
    })
    .join(' | ');
}
