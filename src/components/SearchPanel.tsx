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
      <Text bold underline>
        搜索 Session
      </Text>

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
          选项: [r] 正则: {useRegex ? '开' : '关'} | [t] 类型: {messageType} | Enter: 搜索 | Esc:
          取消
        </Text>
      </Box>
    </Box>
  );
};
