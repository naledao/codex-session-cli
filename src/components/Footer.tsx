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
    <Box borderStyle="single" borderColor="gray" padding={1} marginTop={1}>
      <Text color="gray">{getShortcuts()}</Text>
    </Box>
  );
};
