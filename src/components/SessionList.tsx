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
          {searchQuery ? `未找到匹配 "${searchQuery}" 的 session` : '未找到 session'}
        </Text>
      </Box>
    );
  }

  const items = sessions.map(session => ({
    label: `${formatDate(session.timestamp, 'MM-dd HH:mm')} - ${session.summary.substring(0, 40)}`,
    value: session.id,
  }));

  const handleSelect = (item: { label: string; value: string }) => {
    const session = sessions.find(s => s.id === item.value);
    if (session) {
      onSelect(session);
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>
          找到 {sessions.length} 个 session
          {searchQuery && ` (搜索: "${searchQuery}")`}
        </Text>
      </Box>

      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
