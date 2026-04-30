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
      // 显示帮助信息
      program.help();
    } else if (error.message.includes('version')) {
      // 显示版本信息
      console.log(chalk.blue('codex-sessions v1.0.0'));
    } else {
      // 其他错误
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