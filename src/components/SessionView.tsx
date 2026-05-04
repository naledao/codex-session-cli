import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SessionDetail, SessionEvent } from '@/types/session';
import { formatDate, formatDuration } from '@/utils/format';

interface SessionViewProps {
  session: SessionDetail;
  onBack: () => void;
  onExport: () => void;
}

export const SessionView: React.FC<SessionViewProps> = ({ session, onBack, onExport }) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const renderEvent = (event: SessionEvent, index: number) => {
    const timestamp = formatDate(new Date(event.timestamp), 'HH:mm:ss');

    if (event.type === 'event_msg') {
      switch (event.payload.type) {
        case 'user_message':
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text color="green" bold>
                [用户] {timestamp}
              </Text>
              <Text>{event.payload.message}</Text>
            </Box>
          );

        case 'agent_message':
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text color="blue" bold>
                [代理] {timestamp}
              </Text>
              <Text>{event.payload.message}</Text>
            </Box>
          );

        case 'exec_command_end':
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Text color="yellow" bold>
                [命令] {timestamp}
              </Text>
              <Text>$ {event.payload.command.join(' ')}</Text>
              {event.payload.stdout && <Text color="gray">{event.payload.stdout}</Text>}
            </Box>
          );
      }
    }

    if (event.type === 'response_item' && event.payload.type === 'function_call') {
      return (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Text color="cyan" bold>
            [工具] {timestamp} - {event.payload.name}
          </Text>
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
        <Text bold underline>
          对话内容:
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {session.events.map((event, index) => renderEvent(event, index))}
        </Box>
      </Box>

      {/* 底部提示 */}
      <Box marginTop={1}>
        <Text color="gray">Esc: 返回 | e: 导出 | m: 元数据 | q: 退出</Text>
      </Box>
    </Box>
  );
};
