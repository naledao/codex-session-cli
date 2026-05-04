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
