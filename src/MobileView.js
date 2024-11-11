// src/MobileView.js
import React from 'react';
import { Box, Text, Center } from '@chakra-ui/react';

function MobileView() {
  return (
    <Center height="100vh">
      <Box textAlign="center" p="4">
        <Text fontSize="2xl" fontWeight="bold">Please Use a Desktop</Text>
        <Text fontSize="md">This app is best experienced on a desktop browser. Please access it from a larger screen for an optimal experience.</Text>
      </Box>
    </Center>
  );
}

export default MobileView;
