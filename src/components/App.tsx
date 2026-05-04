import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdin, useStdout } from 'ink';
import { spawn } from 'child_process';
import { SessionService } from '../services/session';
import { SearchService } from '../services/search';
import { ExportService } from '../services/export';
import { Session, SessionDetail, ExportFormat } from '../types/session';
import { formatDate, formatDuration } from '../utils/format';

type View = 'list' | 'detail' | 'search' | 'export';

interface AppProps {
  directory?: string;
}

export const App: React.FC<AppProps> = ({ directory }) => {
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();
  const { stdout } = useStdout();

  const [view, setView] = useState<View>('list');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Session[]>([]);
  const [searchMode, setSearchMode] = useState<'all' | 'user' | 'agent'>('all');

  const [exportIndex, setExportIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const [scrollOffset, setScrollOffset] = useState(0);

  const sessionService = new SessionService();
  const searchService = new SearchService();
  const exportService = new ExportService();

  // 进入 alternate screen 并清屏
  useEffect(() => {
    if (stdout) {
      // 进入 alternate screen buffer
      stdout.write('\x1b[?1049h');
      // 清屏
      stdout.write('\x1b[2J');
      // 光标移到左上角
      stdout.write('\x1b[H');
    }

    return () => {
      // 退出时恢复主屏幕
      if (stdout) {
        stdout.write('\x1b[?1049l');
      }
    };
  }, [stdout]);

  // 加载 session 列表
  useEffect(() => {
    loadSessions();
  }, [directory]);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = directory
        ? await sessionService.getAllSessions()
        : await sessionService.getCurrentDirectorySessions();

      setSessions(data);
      setSelectedIndex(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '加载失败，请检查 ~/.codex/sessions 目录是否存在',
      );
    } finally {
      setLoading(false);
    }
  }, [directory]);

  // 处理键盘输入
  useInput((input, key) => {
    if (!isRawModeSupported) return;

    if (input === 'q' && view !== 'search') {
      exit();
    }

    if (error && (key.escape || input === 'r')) {
      setError(null);
    }

    if (view === 'list') {
      const displaySessions = searchQuery ? searchResults : sessions;

      if (key.upArrow) {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex(prev => Math.min(displaySessions.length - 1, prev + 1));
      } else if (key.return) {
        if (displaySessions[selectedIndex]) {
          handleSelectSession(displaySessions[selectedIndex]);
        }
      } else if (input === 'c' && displaySessions[selectedIndex]) {
        handleResumeSession(displaySessions[selectedIndex]);
      } else if (input === '/') {
        setView('search');
        setSearchInput('');
      } else if (input === 'e' && displaySessions[selectedIndex]) {
        handleExport(displaySessions[selectedIndex]);
      } else if (input === 'r') {
        loadSessions();
        setSearchQuery('');
      }
    }

    if (view === 'detail') {
      if (key.escape) {
        setView('list');
        setSelectedSession(null);
        setScrollOffset(0);
      } else if (key.upArrow) {
        setScrollOffset(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        if (selectedSession && scrollOffset < selectedSession.events.length - 1) {
          setScrollOffset(prev => prev + 1);
        }
      } else if (input === 'c' && selectedSession) {
        handleResumeSession(selectedSession);
      } else if (input === 'e' && selectedSession) {
        handleExport(selectedSession);
      } else if (input === '/') {
        setView('search');
        setSearchInput('');
      }
    }

    if (view === 'search') {
      if (key.escape) {
        setView('list');
        setSearchInput('');
      } else if (key.return) {
        handleSearch();
      } else if (input === 'r') {
        setSearchMode(prev => (prev === 'all' ? 'user' : prev === 'user' ? 'agent' : 'all'));
      } else if (key.backspace || key.delete) {
        setSearchInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setSearchInput(prev => prev + input);
      }
    }

    if (view === 'export') {
      if (key.escape) {
        setView(selectedSession ? 'detail' : 'list');
        setExportMessage('');
      } else if (key.upArrow) {
        setExportIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setExportIndex(prev => Math.min(4, prev + 1));
      } else if (key.return) {
        handleExportConfirm();
      }
    }
  });

  const handleSelectSession = async (session: Session) => {
    try {
      setLoading(true);
      setError(null);
      const detail = await sessionService.getSessionById(session.id);
      if (detail) {
        setSelectedSession(detail);
        setView('detail');
        setScrollOffset(0);
      } else {
        setError('无法加载 session 详情');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = (session: Session) => {
    try {
      const uuid = session.id.split('-').slice(-5).join('-');
      const child = spawn('cmd', ['/c', 'start', 'cmd', '/k', `codex resume ${uuid}`], {
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      child.unref();
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法启动 codex');
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const results = await searchService.searchSessions({
        query: searchInput,
        messageType: searchMode,
        directory: directory || process.cwd(),
      });

      setSearchQuery(searchInput);
      setSearchResults(
        results.map(r => ({
          id: r.sessionId,
          filePath: '',
          directory: r.directory,
          timestamp: r.sessionTimestamp,
          summary: r.matchedText.substring(0, 50),
          messageCount: 0,
          duration: 0,
          tags: [],
        })),
      );
      setView('list');
      setSelectedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (session: Session) => {
    setExportIndex(0);
    setExporting(false);
    setExportMessage('');
    setView('export');
  };

  const handleExportConfirm = async () => {
    const formats: ExportFormat[] = ['json', 'text', 'markdown', 'csv'];
    const format = formats[exportIndex];

    if (format === undefined) {
      setView(selectedSession ? 'detail' : 'list');
      return;
    }

    if (!selectedSession && !sessions[selectedIndex]) return;

    try {
      setExporting(true);
      setExportMessage('');
      const sessionId = selectedSession?.id || sessions[selectedIndex].id;
      const content = await exportService.exportSession(sessionId, format);
      const fileName = `session-${sessionId.substring(0, 20)}.${format === 'markdown' ? 'md' : format}`;
      const outputPath = `${process.cwd()}/${fileName}`;

      const fs = await import('fs-extra');
      await fs.default.writeFile(outputPath, content, 'utf-8');

      setExportMessage(`已导出: ${outputPath}`);
      setTimeout(() => {
        setView(selectedSession ? 'detail' : 'list');
        setExportMessage('');
      }, 2000);
    } catch (err) {
      setExportMessage(`导出失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setExporting(false);
    }
  };

  const renderHeader = () => (
    <Box borderStyle="round" borderColor="cyan" paddingX={1} width="100%">
      <Text bold color="cyan">
        Codex Session Viewer
      </Text>
      <Text color="gray"> | {directory || process.cwd()}</Text>
      <Box flexGrow={1} />
      <Text color="gray">
        {searchQuery ? `搜索: "${searchQuery}"` : `${sessions.length} 个会话`}
      </Text>
    </Box>
  );

  const renderSessionList = () => {
    const displaySessions = searchQuery ? searchResults : sessions;

    if (loading) {
      return (
        <Box justifyContent="center" alignItems="center" height="100%">
          <Text color="yellow">加载中...</Text>
        </Box>
      );
    }

    if (error) {
      return (
        <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
          <Text color="red">{error}</Text>
          <Box marginTop={1}>
            <Text color="gray">按 r 重试</Text>
          </Box>
        </Box>
      );
    }

    if (displaySessions.length === 0) {
      return (
        <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
          <Text color="yellow">
            {searchQuery ? `未找到匹配 "${searchQuery}" 的会话` : '未找到会话'}
          </Text>
          <Box marginTop={1}>
            <Text color="gray">
              {searchQuery ? '按 Esc 清除搜索' : '请确保 ~/.codex/sessions 目录存在'}
            </Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {displaySessions.map((session, index) => (
          <Box key={session.id} paddingX={1}>
            <Text
              color={index === selectedIndex ? 'cyan' : 'white'}
              bold={index === selectedIndex}
              inverse={index === selectedIndex}
            >
              {index === selectedIndex ? ' > ' : '   '}
              {formatDate(session.timestamp, 'yyyy-MM-dd HH:mm')}
              {' - '}
              {session.summary.substring(0, 40)}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  const renderSessionDetail = () => {
    if (!selectedSession) {
      // 显示预览
      const displaySessions = searchQuery ? searchResults : sessions;
      const session = displaySessions[selectedIndex];

      if (!session) {
        return (
          <Box justifyContent="center" alignItems="center" height="100%">
            <Text color="gray">选择一个会话查看详情</Text>
          </Box>
        );
      }

      return (
        <Box flexDirection="column" padding={1}>
          <Text bold color="cyan">
            会话预览
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text color="yellow">时间:</Text> {formatDate(session.timestamp)}
            </Text>
            <Text>
              <Text color="yellow">目录:</Text> {session.directory}
            </Text>
            <Text>
              <Text color="yellow">消息:</Text> {session.messageCount} 条
            </Text>
            <Text>
              <Text color="yellow">时长:</Text> {formatDuration(session.duration)}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray">按 Enter 查看完整内容</Text>
          </Box>
        </Box>
      );
    }

    const totalEvents = selectedSession.events.length;
    const visibleEvents = selectedSession.events.slice(scrollOffset, scrollOffset + 15);
    const scrollPercent = totalEvents > 0 ? Math.round((scrollOffset / totalEvents) * 100) : 0;

    return (
      <Box flexDirection="column">
        <Box paddingX={1} marginBottom={1}>
          <Text bold color="cyan">
            会话详情
          </Text>
          <Text color="gray"> | {formatDate(selectedSession.timestamp)}</Text>
          <Box flexGrow={1} />
          <Text color="gray">
            {scrollPercent}% | {scrollOffset + 1}/{totalEvents}
          </Text>
        </Box>

        <Box flexDirection="column" flexGrow={1}>
          {visibleEvents.map((event, index) => {
            const timestamp = formatDate(new Date(event.timestamp), 'HH:mm:ss');

            if (event.type === 'event_msg') {
              if (event.payload.type === 'user_message') {
                return (
                  <Box key={index} flexDirection="column" marginBottom={1} paddingX={1}>
                    <Text color="green" bold>
                      [用户] {timestamp}
                    </Text>
                    <Text>{event.payload.message}</Text>
                  </Box>
                );
              }
              if (event.payload.type === 'agent_message') {
                return (
                  <Box key={index} flexDirection="column" marginBottom={1} paddingX={1}>
                    <Text color="blue" bold>
                      [代理] {timestamp}
                    </Text>
                    <Text>{event.payload.message}</Text>
                  </Box>
                );
              }
              if (event.payload.type === 'exec_command_end') {
                return (
                  <Box key={index} flexDirection="column" marginBottom={1} paddingX={1}>
                    <Text color="yellow" bold>
                      [命令] {timestamp}
                    </Text>
                    <Text>$ {event.payload.command.join(' ')}</Text>
                    {event.payload.stdout && (
                      <Text color="gray">{event.payload.stdout.substring(0, 150)}</Text>
                    )}
                  </Box>
                );
              }
            }

            if (event.type === 'response_item' && event.payload.type === 'function_call') {
              return (
                <Box key={index} flexDirection="column" marginBottom={1} paddingX={1}>
                  <Text color="magenta" bold>
                    [工具] {timestamp} - {event.payload.name}
                  </Text>
                </Box>
              );
            }

            return null;
          })}
        </Box>
      </Box>
    );
  };

  const renderSearchPanel = () => (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" padding={1} width="100%">
      <Text bold color="yellow">
        搜索会话
      </Text>
      <Box marginTop={1}>
        <Text>关键词: {searchInput}</Text>
        <Text color="gray">_</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          模式: {searchMode === 'all' ? '全部' : searchMode === 'user' ? '用户消息' : '代理消息'} |
          按 r 切换
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Enter: 搜索 | Esc: 取消</Text>
      </Box>
    </Box>
  );

  const renderExportPanel = () => {
    const formats = ['JSON 格式', '纯文本格式', 'Markdown 格式', 'CSV 格式', '取消'];

    return (
      <Box flexDirection="column" borderStyle="double" borderColor="green" padding={1} width="100%">
        <Text bold color="green">
          导出会话
        </Text>
        {exportMessage ? (
          <Box marginTop={1}>
            <Text color={exportMessage.startsWith('已') ? 'green' : 'red'}>{exportMessage}</Text>
          </Box>
        ) : exporting ? (
          <Box marginTop={1}>
            <Text color="yellow">导出中...</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {formats.map((format, index) => (
              <Text
                key={index}
                color={index === exportIndex ? 'green' : 'white'}
                bold={index === exportIndex}
              >
                {index === exportIndex ? ' > ' : '   '}
                {format}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderFooter = () => {
    const shortcuts = {
      list: '↑↓ 导航 | Enter 查看 | c Codex打开 | / 搜索 | e 导出 | r 刷新 | q 退出',
      detail: '↑↓ 滚动 | Esc 返回 | c Codex打开 | / 搜索 | e 导出 | q 退出',
      search: 'Enter 搜索 | r 切换模式 | Esc 取消',
      export: '↑↓ 选择 | Enter 确认 | Esc 取消',
    };

    return (
      <Box borderStyle="round" borderColor="gray" paddingX={1} width="100%">
        <Text color="gray">{shortcuts[view]}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {renderHeader()}

      <Box flexDirection="row" flexGrow={1}>
        {/* 左侧面板 - Session 列表 */}
        <Box
          flexDirection="column"
          width="40%"
          borderStyle="single"
          borderColor="blue"
          marginRight={1}
        >
          <Box paddingX={1} borderBottom>
            <Text bold color="blue">
              会话列表
            </Text>
          </Box>
          <Box flexDirection="column" flexGrow={1} overflowY="hidden">
            {renderSessionList()}
          </Box>
        </Box>

        {/* 右侧面板 - 详情/搜索/导出 */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="blue">
          {view === 'search'
            ? renderSearchPanel()
            : view === 'export'
              ? renderExportPanel()
              : renderSessionDetail()}
        </Box>
      </Box>

      {renderFooter()}
    </Box>
  );
};
