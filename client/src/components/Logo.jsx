import React from 'react';
import { Box } from '@mui/material';
import insightTestAILogo from '../assets/insight-test-ai-logo.svg';

const Logo = ({ size = 'medium', sx = {} }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'large':
        return { width: 120, height: 120 };
      default:
        return { width: 64, height: 64 };
    }
  };

  return (
    <Box
      component="img"
      src={insightTestAILogo}
      alt="InsightTestAI Logo"
      sx={{
        ...getSize(),
        ...sx,
      }}
    />
  );
};

export default Logo;
