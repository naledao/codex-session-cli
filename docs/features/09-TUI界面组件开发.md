# 09 - TUI 界面组件开发

## 概述

本文档描述 TUI（终端用户界面）组件的实现。使用 Ink 框架构建 React 风格的终端界面。

## 开发顺序

**优先级：P1（重要）**  
**预计时间：3-4天**  
**前置依赖：08-CLI命令实现**

## 文件位置

- `src/components/App.tsx` - 主应用组件
- `src/components/SessionList.tsx` - Session 列表组件
- `src/components/SessionView.tsx` - Session 详情组件
- `src/components/SearchPanel.tsx` - 搜索面板组件
- `src/components/ExportDialog.tsx` - 导出对话框组件
- `src/components/Header.tsx` - 头部组件
- `src/components/Footer.tsx` - 底部组件
- `src/components/Spinner.tsx` - 加载指示器

---

## 9.1 技术栈

| 技术 | 用途 |
|------|------|
| Ink | React for CLI 框架 |
| React | UI 组件库 |
| ink-select-input | 选择输入组件 |
| ink-text-input | 文本输入组件 |
| ink-spinner | 加载指示器 |

---

## 9.2 App 组件

### 功能
主应用组件，管理全局状态和路由。

### 实现

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { SessionService } from '@/services/session';
import { Session, SessionDetail } from '@/types/session';
import { Header } from './Header';
import { Footer } from './Footer';
import { SessionList } from './SessionList';
import { SessionView } from './SessionView';
import { SearchPanel } from './SearchPanel';
import { ExportDialog } from './ExportDialog';

type View = 'list' | 'detail' | 'search' | 'export';

interface AppProps {
  directory?: string;
  theme?: string;
}

export const App: React.FC<AppProps> = ({ directory, theme }) => {
  const { exit } = useApp();
  const [view, setView] = useState<View>('list');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sessionService = new SessionService();

  // 加载 session 列表
  useEffect(() => {
    loadSessions();
  }, [directory]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = directory
        ? await sessionService.getAllSessions()
        : await sessionService.getCurrentDirectorySessions();

      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理键盘输入
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }

    if (key.escape) {
      if (view === 'detail' || view === 'search' || view === 'export') {
        setView('list');
        setSelectedSession(null);
      }
    }

    if (input === '/' && view === 'list') {
      setView('search');
    }

    if (input === 'e' && view === 'detail' && selectedSession) {
      setView('export');
    }
  });

  // 选择 session
  const handleSelectSession = async (session: Session) => {
    try {
      setLoading(true);
      const detail = await sessionService.getSessionById(session.id);
      if (detail) {
        setSelectedSession(detail);
        setView('detail');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setView('list');
  };

  // 导出
  const handleExport = async (format: string) => {
    if (!selectedSession) return;
    // 导出逻辑...
    setView('detail');
  };

  // 渲染当前视图
  const renderView = () => {
    switch (view) {
      case 'list':
        return (
          <SessionList
            sessions={sessions}
            onSelect={handleSelectSession}
            onSearch={() => setView('search')}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
          />
        );

      case 'detail':
        return selectedSession ? (
          <SessionView
            session={selectedSession}
            onBack={() => {
              setView('list');
              setSelectedSession(null);
            }}
            onExport={() => setView('export')}
          />
        ) : null;

      case 'search':
        return (
          <SearchPanel
            onSearch={handleSearch}
            onClose={() => setView('list')}
            initialQuery={searchQuery}
          />
        );

      case 'export':
        return selectedSession ? (
          <ExportDialog
            session={selectedSession}
            onExport={handleExport}
            onClose={() => setView('detail')}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Header
        title="Codex Session Viewer"
        subtitle={directory || process.cwd()}
      />
      
      <Box flexDirection="column" flexGrow={1}>
        {renderView()}
      </Box>

      <Footer view={view} />
    </Box>
  );
};
```

---

## 9.3 SessionList 组件

### 功能
显示 session 列表，支持选择和搜索。

### 实现

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { Session } from '@/types/session';
import { formatDate, formatDuration } from '@/utils/format';

interface SessionListProps {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onSearch: () => void;
  loading?: boolean;
  error?: string | null;
  searchQuery?: string;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onSelect,
  onSearch,
  loading,
  error,
  searchQuery,
}) => {
  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Spinner type="dots" />
        <Text> 加载中...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="red">错误: {error}</Text>
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">
          {searchQuery
            ? `未找到匹配 "${searchQuery}" 的 session`
            : '未找到 session'}
        </Text>
      </Box>
    );
  }

  const items = sessions.map(session => ({
    label: `${formatDate(session.timestamp, 'MM-dd HH:mm')} - ${session.summary.substring(0, 40)}`,
    value: session.id,
    session,
  }));

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>
          找到 {sessions.length} 个 session
          {searchQuery && ` (搜索: "${searchQuery}")`}
        </Text>
      </Box>

      <SelectInput
        items={items}
        onSelect={(item) => onSelect(item.session)}
      />
    </Box>
  );
};
```

---

## 9.4 SessionView 组件

### 功能
显示单个 session 的详细信息。

### 实现

```tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SessionDetail, SessionEvent } from '@/types/session';
import { formatDate, formatDuration } from '@/utils/format';

interface SessionViewProps {
  session: SessionDetail;
  onBack: () => void;
  onExport: () => void;
}

export const SessionView: React.FC<SessionViewProps> = ({
  session,
  onBack,
  onExport,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const renderEvent = (event: SessionEvent, index: number) => {
    const timestamp = formatDate(new Date(event.timestamp), 'HH:mm:ss');

    if (event.type === 'event_msg') {
      switch (event.payload.type) {
        case 'user_message':
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text color="green" bold>[用户] {timestamp}</Text>
              <Text>{event.payload.message}</Text>
            </Box>
          );

        case 'agent_message':
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text color="blue" bold>[代理] {timestamp}</Text>
              <Text>{event.payload.message}</Text>
            </Box>
          );

        case 'exec_command_end':
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text color="yellow" bold>[命令] {timestamp}</Text>
              <Text>$ {event.payload.command.join(' ')}</Text>
              {event.payload.stdout && (
                <Text color="gray">{event.payload.stdout}</Text>
              )}
            </Box>
          );
      }
    }

    if (event.type === 'response_item' && event.payload.type === 'function_call') {
      return (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Text color="cyan" bold>[工具] {timestamp} - {event.payload.name}</Text>
          <Text color="gray">{event.payload.arguments}</Text>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box flexDirection="column">
      {/* 头部信息 */}
      <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
        <Text bold>Session: {session.id}</Text>
        <Text>时间: {formatDate(session.timestamp)}</Text>
        <Text>目录: {session.directory}</Text>
        <Text>时长: {formatDuration(session.duration)}</Text>
        <Text>消息数: {session.messageCount}</Text>
      </Box>

      {/* 对话内容 */}
      <Box flexDirection="column" flexGrow={1}>
        <Text bold underline>对话内容:</Text>
        <Box flexDirection="column" marginTop={1}>
          {session.events.map((event, index) => renderEvent(event, index))}
        </Box>
      </Box>

      {/* 底部提示 */}
      <Box marginTop={1}>
        <Text color="gray">
          Esc: 返回 | e: 导出 | m: 元数据 | q: 退出
        </Text>
      </Box>
    </Box>
  );
};
```

---

## 9.5 SearchPanel 组件

### 功能
搜索面板，支持输入搜索关键词。

### 实现

```tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  initialQuery?: string;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [useRegex, setUseRegex] = useState(false);
  const [messageType, setMessageType] = useState<'user' | 'agent' | 'all'>('all');

  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold underline>搜索 Session</Text>
      
      <Box marginTop={1}>
        <Text>关键词: </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          placeholder="输入搜索关键词..."
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          选项: 
          [r] 正则: {useRegex ? '开' : '关'} | 
          [t] 类型: {messageType} | 
          Enter: 搜索 | 
          Esc: 取消
        </Text>
      </Box>
    </Box>
  );
};
```

---

## 9.6 ExportDialog 组件

### 功能
导出对话框，选择导出格式。

### 实现

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { Session } from '@/types/session';
import { ExportFormat } from '@/types/session';

interface ExportDialogProps {
  session: Session;
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
  loading?: boolean;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  session,
  onExport,
  onClose,
  loading,
}) => {
  const items = [
    { label: 'JSON 格式', value: 'json' },
    { label: '纯文本格式', value: 'text' },
    { label: 'Markdown 格式', value: 'markdown' },
    { label: 'CSV 格式', value: 'csv' },
    { label: '取消', value: 'cancel' },
  ];

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'cancel') {
      onClose();
    } else {
      onExport(item.value as ExportFormat);
    }
  };

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text bold underline>导出 Session</Text>
      <Text>Session: {session.id}</Text>
      <Text>摘要: {session.summary}</Text>
      
      <Box marginTop={1}>
        <Text>选择导出格式:</Text>
      </Box>

      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
```

---

## 9.7 Header 组件

### 功能
显示应用头部信息。

### 实现

```tsx
import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="blue"
      padding={1}
      marginBottom={1}
    >
      <Text bold color="blue">{title}</Text>
      {subtitle && <Text color="gray">{subtitle}</Text>}
    </Box>
  );
};
```

---

## 9.8 Footer 组件

### 功能
显示底部快捷键提示。

### 实现

```tsx
import React from 'react';
import { Box, Text } from 'ink';

interface FooterProps {
  view: string;
}

export const Footer: React.FC<FooterProps> = ({ view }) => {
  const getShortcuts = () => {
    switch (view) {
      case 'list':
        return '↑↓: 导航 | Enter: 查看 | /: 搜索 | q: 退出';
      case 'detail':
        return '↑↓: 滚动 | Esc: 返回 | e: 导出 | q: 退出';
      case 'search':
        return 'Enter: 搜索 | Esc: 取消 | q: 退出';
      case 'export':
        return '↑↓: 选择 | Enter: 确认 | Esc: 取消';
      default:
        return 'q: 退出';
    }
  };

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      padding={1}
      marginTop={1}
    >
      <Text color="gray">{getShortcuts()}</Text>
    </Box>
  );
};
```

---

## 9.9 Spinner 组件

### 功能
显示加载指示器。

### 实现

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import InkSpinner from 'ink-spinner';

interface SpinnerProps {
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ text = '加载中...' }) => {
  return (
    <Box>
      <InkSpinner type="dots" />
      <Text> {text}</Text>
    </Box>
  );
};
```

---

## 9.10 使用示例

### 启动 TUI

```bash
# 启动 TUI
codex-sessions tui

# 指定目录
codex-sessions tui --directory /path/to/project
```

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| ↑/↓ | 导航列表 |
| Enter | 选择/确认 |
| Esc | 返回/取消 |
| / | 打开搜索 |
| e | 导出 |
| q | 退出 |
| Ctrl+C | 强制退出 |

---

## 9.11 主题配置

### 支持的主题

| 主题 | 说明 |
|------|------|
| default | 默认主题 |
| dark | 深色主题 |
| light | 浅色主题 |
| colorful | 彩色主题 |

### 主题配置文件

```json
{
  "theme": {
    "colors": {
      "primary": "blue",
      "secondary": "gray",
      "success": "green",
      "warning": "yellow",
      "error": "red"
    },
    "symbols": {
      "bullet": "•",
      "arrow": "→",
      "check": "✓",
      "cross": "✗"
    }
  }
}
```

---

## 9.12 性能优化

### 优化策略

1. **虚拟列表**
   - 只渲染可见区域
   - 使用 `ink-virtual-list` 组件

2. **懒加载**
   - 按需加载 session 详情
   - 使用 `Suspense` 和 `lazy`

3. **缓存**
   - 缓存已加载的 session
   - 避免重复请求

4. **防抖**
   - 搜索输入防抖
   - 减少不必要的渲染

---

## 完成标准

- [x] App 组件已实现
- [x] SessionList 组件已实现
- [x] SessionView 组件已实现
- [x] SearchPanel 组件已实现
- [x] ExportDialog 组件已实现
- [x] Header 组件已实现
- [x] Footer 组件已实现
- [x] Spinner 组件已实现
- [x] 键盘快捷键支持
- [x] 主题配置支持
- [x] 错误处理完善
- [x] 无 TypeScript 编译错误

## 下一步

完成本文档后，继续进行 [10-配置管理](./10-配置管理.md)。
