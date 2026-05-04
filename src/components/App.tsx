import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdin } from 'ink';
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

  const [view, setView] = useState<View>('list');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Session[]>([]);
  const [searchMode, setSearchMode] = useState<'all' | 'user' | 'agent'>('all');

  // 导出状态
  const [exportIndex, setExportIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // 详情滚动
  const [scrollOffset, setScrollOffset] = useState(0);

  const sessionService = new SessionService();
  const searchService = new SearchService();
  const exportService = new ExportService();

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

    // 全局退出
    if (input === 'q' && view !== 'search') {
      exit();
    }

    // 清除错误
    if (error && (key.escape || input === 'r')) {
      setError(null);
    }

    // 列表视图
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

    // 详情视图
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

    // 搜索视图
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

    // 导出视图
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

  // 选择 session
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

  // 用 codex resume 打开 session
  const handleResumeSession = (session: Session) => {
    try {
      // 从 session.id 提取 UUID (格式: rollout-2025-09-17T23-45-00-96615318-295d-4d56-8b79-c1c04b1fcdae)
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

  // 搜索
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

  // 导出
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
      // 取消
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

      // 保存到文件
      const fs = await import('fs-extra');
      await fs.default.writeFile(outputPath, content, 'utf-8');

      setExportMessage(`✓ 已导出: ${outputPath}`);
      setTimeout(() => {
        setView(selectedSession ? 'detail' : 'list');
        setExportMessage('');
      }, 2000);
    } catch (err) {
      setExportMessage(`✗ 导出失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setExporting(false);
    }
  };

  // 渲染列表视图
  const renderList = () => {
    const displaySessions = searchQuery ? searchResults : sessions;

    if (loading) {
      return (
        <Box justifyContent="center" alignItems="center" height={10}>
          <Text color="yellow">加载中...</Text>
        </Box>
      );
    }

    if (error) {
      return (
        <Box flexDirection="column" justifyContent="center" alignItems="center" height={10}>
          <Text color="red">✗ {error}</Text>
          <Box marginTop={1}>
            <Text color="gray">按 r 重试，按 Esc 清除错误</Text>
          </Box>
        </Box>
      );
    }

    if (displaySessions.length === 0) {
      return (
        <Box flexDirection="column" justifyContent="center" alignItems="center" height={10}>
          <Text color="yellow">
            {searchQuery ? `未找到匹配 "${searchQuery}" 的 session` : '未找到 session'}
          </Text>
          <Box marginTop={1}>
            <Text color="gray">
              {searchQuery
                ? '尝试不同的关键词或按 Esc 清除搜索'
                : '请确保 ~/.codex/sessions 目录存在'}
            </Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Box paddingX={1} marginBottom={1}>
          <Text color="gray">
            {searchQuery
              ? `搜索结果: ${displaySessions.length} 个`
              : `共 ${displaySessions.length} 个 session`}
          </Text>
        </Box>
        {displaySessions.map((session, index) => (
          <Box key={session.id} paddingX={1}>
            <Text color={index === selectedIndex ? 'cyan' : 'white'} bold={index === selectedIndex}>
              {index === selectedIndex ? '▸ ' : '  '}
              {formatDate(session.timestamp, 'yyyy-MM-dd HH:mm')}
              {' - '}
              {session.summary.substring(0, 50)}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  // 渲染详情视图
  const renderDetail = () => {
    if (!selectedSession) return null;

    const totalEvents = selectedSession.events.length;
    const visibleEvents = selectedSession.events.slice(scrollOffset, scrollOffset + 20);
    const scrollPercent = totalEvents > 0 ? Math.round((scrollOffset / totalEvents) * 100) : 0;

    return (
      <Box flexDirection="column" height="100%">
        {/* 固定头部 */}
        <Box borderStyle="single" paddingX={1} marginBottom={1}>
          <Text bold>Session: {formatDate(selectedSession.timestamp)}</Text>
          <Text color="gray"> | 目录: {selectedSession.directory}</Text>
          <Text color="gray"> | 时长: {formatDuration(selectedSession.duration)}</Text>
          <Text color="gray"> | 消息: {selectedSession.messageCount}条</Text>
          {totalEvents > 20 && <Text color="gray"> | 滚动: {scrollPercent}%</Text>}
        </Box>

        {/* 可滚动内容区域 */}
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
                      <Text color="gray">{event.payload.stdout.substring(0, 200)}</Text>
                    )}
                  </Box>
                );
              }
            }

            if (event.type === 'response_item' && event.payload.type === 'function_call') {
              return (
                <Box key={index} flexDirection="column" marginBottom={1} paddingX={1}>
                  <Text color="cyan" bold>
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

  // 渲染搜索视图
  const renderSearch = () => {
    return (
      <Box flexDirection="column" borderStyle="single" padding={1}>
        <Text bold>搜索 Session</Text>
        <Box marginTop={1}>
          <Text>关键词: {searchInput}</Text>
          <Text color="gray">_</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">
            选项: [r] 模式:{' '}
            {searchMode === 'all' ? '全部' : searchMode === 'user' ? '用户消息' : '代理消息'}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">输入关键词后按 Enter 搜索，按 Esc 取消</Text>
        </Box>
      </Box>
    );
  };

  // 渲染导出视图
  const renderExport = () => {
    const formats = ['JSON 格式', '纯文本格式', 'Markdown 格式', 'CSV 格式', '取消'];

    return (
      <Box flexDirection="column" borderStyle="single" padding={1}>
        <Text bold>导出 Session</Text>
        {exportMessage ? (
          <Box marginTop={1}>
            <Text color={exportMessage.startsWith('✓') ? 'green' : 'red'}>{exportMessage}</Text>
          </Box>
        ) : exporting ? (
          <Box marginTop={1}>
            <Text color="yellow">导出中...</Text>
          </Box>
        ) : (
          <>
            <Box marginTop={1}>
              <Text>选择导出格式:</Text>
            </Box>
            <Box flexDirection="column" marginTop={1}>
              {formats.map((format, index) => (
                <Text key={index} color={index === exportIndex ? 'cyan' : 'white'}>
                  {index === exportIndex ? '▸ ' : '  '}
                  {format}
                </Text>
              ))}
            </Box>
          </>
        )}
      </Box>
    );
  };

  // 渲染底部状态栏
  const renderFooter = () => {
    const shortcuts = {
      list: '↑↓: 导航 | Enter: 查看 | c: Codex打开 | /: 搜索 | e: 导出 | r: 刷新 | q: 退出',
      detail: '↑↓: 滚动 | Esc: 返回 | c: Codex打开 | /: 搜索 | e: 导出 | q: 退出',
      search: '输入关键词 | Enter: 搜索 | r: 切换模式 | Esc: 取消',
      export: '↑↓: 选择 | Enter: 确认 | Esc: 取消',
    };

    return (
      <Box borderStyle="single" paddingX={1}>
        <Text color="gray">{shortcuts[view]}</Text>
      </Box>
    );
  };

  // 渲染标题
  const renderHeader = () => {
    const title =
      view === 'list'
        ? searchQuery
          ? `搜索: "${searchQuery}"`
          : 'Codex Session Viewer'
        : view === 'detail'
          ? 'Session 详情'
          : view === 'search'
            ? '搜索'
            : '导出';

    return (
      <Box borderStyle="double" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
        <Text color="gray"> - {directory || process.cwd()}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height="100%">
      {renderHeader()}

      <Box flexDirection="column" flexGrow={1}>
        {view === 'list' && renderList()}
        {view === 'detail' && renderDetail()}
        {view === 'search' && renderSearch()}
        {view === 'export' && renderExport()}
      </Box>

      {renderFooter()}
    </Box>
  );
};
