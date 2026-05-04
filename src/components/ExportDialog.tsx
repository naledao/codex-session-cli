import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { Session, ExportFormat } from '@/types/session';

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
      <Text bold underline>
        导出 Session
      </Text>
      <Text>Session: {session.id}</Text>
      <Text>摘要: {session.summary}</Text>

      <Box marginTop={1}>
        <Text>选择导出格式:</Text>
      </Box>

      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
