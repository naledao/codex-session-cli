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
      <Text bold color="blue">
        {title}
      </Text>
      {subtitle && <Text color="gray">{subtitle}</Text>}
    </Box>
  );
};
