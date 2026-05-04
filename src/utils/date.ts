import {
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isValid,
} from 'date-fns';

/**
 * 解析日期字符串
 */
export function parseDate(dateStr: string): Date | null {
  // 尝试 ISO 格式
  const date = parseISO(dateStr);
  if (isValid(date)) {
    return date;
  }

  // 尝试其他格式
  try {
    const parsed = new Date(dateStr);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch {
    // 继续尝试
  }

  return null;
}

/**
 * 判断日期是否在范围内
 */
export function isDateInRange(date: Date, startDate?: Date, endDate?: Date): boolean {
  if (!startDate && !endDate) {
    return true;
  }

  const start = startDate || new Date(0);
  const end = endDate || new Date();

  return isWithinInterval(date, { start, end });
}

/**
 * 获取今天的开始和结束时间
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

/**
 * 获取本周的开始和结束时间
 */
export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

/**
 * 获取本月的开始和结束时间
 */
export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

/**
 * 判断是否为今天
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * 判断是否为本周
 */
export function isThisWeek(date: Date): boolean {
  const { start, end } = getThisWeekRange();
  return isWithinInterval(date, { start, end });
}

/**
 * 判断是否为本月
 */
export function isThisMonth(date: Date): boolean {
  const { start, end } = getThisMonthRange();
  return isWithinInterval(date, { start, end });
}
