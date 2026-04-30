# 08 - CLI 命令实现

## 概述

本文档描述 CLI 命令的实现。使用 Commander.js 构建命令行接口。

## 开发顺序

**优先级：P0（必须）**  
**预计时间：2-3天**  
**前置依赖：04-Session数据服务、06-搜索服务、07-导出服务**

## 文件位置

- `src/commands/list.ts` - 列出 session 命令
- `src/commands/view.ts` - 查看 session 详情命令
- `src/commands/search.ts` - 搜索 session 命令
- `src/commands/export.ts` - 导出 session 命令
- `src/commands/tui.ts` - TUI 界面命令
- `src/commands/index.ts` - 命令导出

---

## 8.1 命令列表

| 命令 | 说明 | 用法 |
|------|------|------|
| list | 列出 session | `codex-sessions list [options]` |
| view | 查看详情 | `codex-sessions view <id>` |
| search | 搜索 session | `codex-sessions search <query>` |
| export | 导出 session | `codex-sessions export <id>` |
| tui | 启动 TUI | `codex-sessions tui` |

---

## 8.2 list 命令

### 功能
列出当前目录或所有目录的 session。

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| -a, --all | 显示所有目录的 session | false |
| -l, --limit <n> | 限制显示数量 | 50 |
| -s, --sort <type> | 排序方式 (date/name/size) | date |
| -d, --directory <path> | 指定目录 | 当前目录 |

### 实现

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { SessionService } from '@/services/session';
import { formatDate, formatDuration } from '@/utils/format';
import { ListCommandOptions } from '@/types';

export const listCommand = new Command('list')
  .description('列出 session 列表')
  .option('-a, --all', '显示所有目录的 session', false)
  .option('-l, --limit <n>', '限制显示数量', '50')
  .option('-s, --sort <type>', '排序方式 (date/name/size)', 'date')
  .option('-d, --directory <path>', '指定目录')
  .action(async (options: ListCommandOptions) => {
    try {
      const sessionService = new SessionService();
      let sessions = options.all
        ? await sessionService.getAllSessions()
        : await sessionService.getCurrentDirectorySessions();

      // 按目录过滤
      if (options.directory) {
        sessions = sessions.filter(s => 
          s.directory.startsWith(options.directory!)
        );
      }

      // 排序
      switch (options.sort) {
        case 'name':
          sessions.sort((a, b) => a.summary.localeCompare(b.summary));
          break;
        case 'size':
          sessions.sort((a, b) => b.messageCount - a.messageCount);
          break;
        default: // date
          sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      // 限制数量
      const limit = parseInt(options.limit?.toString() || '50', 10);
      sessions = sessions.slice(0, limit);

      // 显示结果
      if (sessions.length === 0) {
        console.log(chalk.yellow('未找到 session'));
        return;
      }

      console.log(chalk.blue(`找到 ${sessions.length} 个 session:\n`));

      const table = new Table({
        head: [
          chalk.white('ID'),
          chalk.white('时间'),
          chalk.white('摘要'),
          chalk.white('消息数'),
          chalk.white('目录'),
        ],
        colWidths: [30, 20, 40, 10, 30],
      });

      sessions.forEach(session => {
        table.push([
          session.id.substring(0, 28),
          formatDate(session.timestamp, 'MM-dd HH:mm'),
          session.summary.substring(0, 38),
          session.messageCount.toString(),
          session.directory.substring(0, 28),
        ]);
      });

      console.log(table.toString());
    } catch (error) {
      console.error(chalk.red('获取 session 列表失败:'), error);
      process.exit(1);
    }
  });
```

---

## 8.3 view 命令

### 功能
查看单个 session 的详细信息。

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| -f, --format <type> | 显示格式 (detailed/summary/raw) | detailed |
| -o, --output <path> | 输出到文件 | 无 |

### 实现

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import { SessionService } from '@/services/session';
import { formatDate, formatDuration } from '@/utils/format';
import { ViewCommandOptions } from '@/types';

export const viewCommand = new Command('view')
  .description('查看 session 详情')
  .argument('<id>', 'Session ID')
  .option('-f, --format <type>', '显示格式 (detailed/summary/raw)', 'detailed')
  .option('-o, --output <path>', '输出到文件')
  .action(async (id: string, options: ViewCommandOptions) => {
    try {
      const sessionService = new SessionService();
      const session = await sessionService.getSessionById(id);

      if (!session) {
        console.error(chalk.red(`Session 未找到: ${id}`));
        process.exit(1);
      }

      // 格式化输出
      let output = '';

      switch (options.format) {
        case 'summary':
          output = formatSessionSummary(session);
          break;
        case 'raw':
          output = JSON.stringify(session, null, 2);
          break;
        default: // detailed
          output = formatSessionDetail(session);
      }

      // 输出到文件或控制台
      if (options.output) {
        await fs.writeFile(options.output, output, 'utf-8');
        console.log(chalk.green(`已保存到: ${options.output}`));
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error(chalk.red('获取 session 详情失败:'), error);
      process.exit(1);
    }
  });

function formatSessionSummary(session: any): string {
  const lines = [
    chalk.blue('Session 摘要'),
    '',
    `ID: ${session.id}`,
    `时间: ${formatDate(session.timestamp)}`,
    `目录: ${session.directory}`,
    `时长: ${formatDuration(session.duration)}`,
    `消息数: ${session.messageCount}`,
    `摘要: ${session.summary}`,
  ];
  return lines.join('\n');
}

function formatSessionDetail(session: any): string {
  const lines = [
    chalk.blue('='.repeat(60)),
    chalk.blue(`Session: ${session.id}`),
    chalk.blue('='.repeat(60)),
    '',
    chalk.white('基本信息:'),
    `  时间: ${formatDate(session.timestamp)}`,
    `  目录: ${session.directory}`,
    `  时长: ${formatDuration(session.duration)}`,
    `  消息数: ${session.messageCount}`,
    '',
    chalk.white('对话内容:'),
    '',
  ];

  // 添加事件
  session.events.forEach((event: any) => {
    const timestamp = formatDate(new Date(event.timestamp), 'HH:mm:ss');

    if (event.type === 'event_msg') {
      switch (event.payload.type) {
        case 'user_message':
          lines.push(chalk.green(`[用户] ${timestamp}`));
          lines.push(event.payload.message);
          lines.push('');
          break;
        case 'agent_message':
          lines.push(chalk.blue(`[代理] ${timestamp}`));
          lines.push(event.payload.message);
          lines.push('');
          break;
        case 'exec_command_end':
          lines.push(chalk.yellow(`[命令] ${timestamp}`));
          lines.push(`$ ${event.payload.command.join(' ')}`);
          if (event.payload.stdout) {
            lines.push(event.payload.stdout);
          }
          lines.push('');
          break;
      }
    }
  });

  return lines.join('\n');
}
```

---

## 8.4 search 命令

### 功能
搜索 session 内容。

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| -r, --regex | 使用正则表达式 | false |
| --after <date> | 开始日期 | 无 |
| --before <date> | 结束日期 | 无 |
| -t, --type <type> | 消息类型 (user/agent/all) | all |
| -l, --limit <n> | 结果数量限制 | 50 |
| -d, --directory <path> | 指定目录 | 无 |

### 实现

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { SearchService } from '@/services/search';
import { formatDate } from '@/utils/format';
import { parseDate } from '@/utils/date';
import { SearchCommandOptions } from '@/types';

export const searchCommand = new Command('search')
  .description('搜索 session 内容')
  .argument('<query>', '搜索关键词')
  .option('-r, --regex', '使用正则表达式', false)
  .option('--after <date>', '开始日期')
  .option('--before <date>', '结束日期')
  .option('-t, --type <type>', '消息类型 (user/agent/all)', 'all')
  .option('-l, --limit <n>', '结果数量限制', '50')
  .option('-d, --directory <path>', '指定目录')
  .action(async (query: string, options: SearchCommandOptions) => {
    try {
      const searchService = new SearchService();

      // 构建搜索查询
      const searchQuery = {
        query,
        useRegex: options.regex,
        afterDate: options.after ? parseDate(options.after) : undefined,
        beforeDate: options.before ? parseDate(options.before) : undefined,
        messageType: options.type as 'user' | 'agent' | 'all',
        limit: parseInt(options.limit?.toString() || '50', 10),
        directory: options.directory,
      };

      console.log(chalk.blue(`搜索: "${query}"\n`));

      const results = await searchService.searchSessions(searchQuery);

      if (results.length === 0) {
        console.log(chalk.yellow('未找到匹配结果'));
        return;
      }

      console.log(chalk.green(`找到 ${results.length} 个匹配结果:\n`));

      results.forEach((result, index) => {
        console.log(chalk.white(`[${index + 1}] Session: ${result.sessionId}`));
        console.log(chalk.gray(`    时间: ${formatDate(result.sessionTimestamp)}`));
        console.log(chalk.gray(`    行号: ${result.lineNumber}`));
        console.log(chalk.gray(`    相关性: ${(result.relevanceScore * 100).toFixed(0)}%`));
        
        // 高亮显示匹配文本
        const highlighted = searchService.highlightMatches(result.context, query);
        console.log(`    ${highlighted}`);
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red('搜索失败:'), error);
      process.exit(1);
    }
  });
```

---

## 8.5 export 命令

### 功能
导出 session 为文件。

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| -f, --format <type> | 导出格式 (json/text/markdown/csv) | json |
| -o, --output <path> | 输出路径 | 无 |
| --pretty | 格式化输出 | true |
| --metadata | 包含元数据 | true |

### 实现

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { ExportService } from '@/services/export';
import { ExportCommandOptions } from '@/types';

export const exportCommand = new Command('export')
  .description('导出 session')
  .argument('<id>', 'Session ID')
  .option('-f, --format <type>', '导出格式 (json/text/markdown/csv)', 'json')
  .option('-o, --output <path>', '输出路径')
  .option('--pretty', '格式化输出', true)
  .option('--metadata', '包含元数据', true)
  .action(async (id: string, options: ExportCommandOptions) => {
    try {
      const exportService = new ExportService();
      const format = options.format as any;

      // 确定输出路径
      const outputPath = options.output || `${id}.${getExtension(format)}`;

      console.log(chalk.blue(`导出 session: ${id}`));
      console.log(chalk.gray(`格式: ${format}`));
      console.log(chalk.gray(`输出: ${outputPath}`));

      await exportService.exportToFile(id, format, outputPath);

      console.log(chalk.green(`\n导出成功: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('导出失败:'), error);
      process.exit(1);
    }
  });

function getExtension(format: string): string {
  const extensions: Record<string, string> = {
    json: 'json',
    text: 'txt',
    markdown: 'md',
    csv: 'csv',
  };
  return extensions[format] || 'txt';
}
```

---

## 8.6 tui 命令

### 功能
启动交互式 TUI 界面。

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| -d, --directory <path> | 指定目录 | 当前目录 |
| --theme <name> | 主题 | default |

### 实现

```typescript
import { Command } from 'commander';
import { TuiCommandOptions } from '@/types';

export const tuiCommand = new Command('tui')
  .description('启动交互式 TUI 界面')
  .option('-d, --directory <path>', '指定目录')
  .option('--theme <name>', '主题', 'default')
  .action(async (options: TuiCommandOptions) => {
    try {
      // 动态导入 ink 相关模块（避免在非 TUI 模式下加载）
      const { render } = await import('ink');
      const React = await import('react');
      const { App } = await import('@/components/App');

      // 渲染 TUI 应用
      render(React.createElement(App, {
        directory: options.directory,
        theme: options.theme,
      }));
    } catch (error) {
      console.error('启动 TUI 失败:', error);
      process.exit(1);
    }
  });
```

---

## 8.7 命令导出

### src/commands/index.ts

```typescript
export { listCommand } from './list';
export { viewCommand } from './view';
export { searchCommand } from './search';
export { exportCommand } from './export';
export { tuiCommand } from './tui';
```

---

## 8.8 主入口更新

### src/index.ts

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { listCommand } from './commands/list';
import { viewCommand } from './commands/view';
import { searchCommand } from './commands/search';
import { exportCommand } from './commands/export';
import { tuiCommand } from './commands/tui';

const program = new Command();

program
  .name('codex-sessions')
  .description('Codex Session Viewer - 查看和管理 Codex CLI 的历史 session 记录')
  .version('1.0.0');

// 注册命令
program.addCommand(listCommand);
program.addCommand(viewCommand);
program.addCommand(searchCommand);
program.addCommand(exportCommand);
program.addCommand(tuiCommand);

// 错误处理
program.exitOverride();

try {
  program.parse();
} catch (error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('help')) {
      program.help();
    } else if (error.message.includes('version')) {
      console.log(chalk.blue('codex-sessions v1.0.0'));
    } else {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  } else {
    console.error(chalk.red('未知错误:'), error);
    process.exit(1);
  }
}

// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
```

---

## 8.9 使用示例

### 列出 session

```bash
# 列出当前目录的 session
codex-sessions list

# 列出所有目录的 session
codex-sessions list --all

# 限制显示数量
codex-sessions list --limit 10

# 按时间排序
codex-sessions list --sort date

# 指定目录
codex-sessions list --directory /path/to/project
```

### 查看详情

```bash
# 查看 session 详情
codex-sessions view rollout-2026-04-02T10-00-10-019d4beb

# 以摘要格式显示
codex-sessions view rollout-2026-04-02T10-00-10-019d4beb --format summary

# 以原始格式显示
codex-sessions view rollout-2026-04-02T10-00-10-019d4beb --format raw

# 保存到文件
codex-sessions view rollout-2026-04-02T10-00-10-019d4beb --output session.txt
```

### 搜索

```bash
# 搜索关键词
codex-sessions search "database"

# 使用正则表达式
codex-sessions search "\berror\b" --regex

# 按日期过滤
codex-sessions search "bug" --after 2026-04-01 --before 2026-04-30

# 按消息类型过滤
codex-sessions search "api" --type user

# 限制结果数量
codex-sessions search "test" --limit 10
```

### 导出

```bash
# 导出为 JSON
codex-sessions export rollout-2026-04-02T10-00-10-019d4beb --format json

# 导出为 Markdown
codex-sessions export rollout-2026-04-02T10-00-10-019d4beb --format markdown

# 指定输出路径
codex-sessions export rollout-2026-04-02T10-00-10-019d4beb --output session.json

# 导出为 CSV
codex-sessions export rollout-2026-04-02T10-00-10-019d4beb --format csv
```

### 启动 TUI

```bash
# 启动 TUI
codex-sessions tui

# 指定目录
codex-sessions tui --directory /path/to/project

# 指定主题
codex-sessions tui --theme dark
```

---

## 完成标准

- [x] list 命令已实现
- [x] view 命令已实现
- [x] search 命令已实现
- [x] export 命令已实现
- [x] tui 命令已实现
- [x] 命令导出正确
- [x] 主入口已更新
- [x] 所有命令有帮助信息
- [x] 错误处理完善
- [x] 有使用示例
- [x] 无 TypeScript 编译错误

## 下一步

完成本文档后，继续进行 [09-TUI界面组件开发](./09-TUI界面组件开发.md)。
