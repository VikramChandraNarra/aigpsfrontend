// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Map from './MapComponent';
import Chatbot from './Chatbot';
import NavBar from './NavBar';
import { Box, Flex } from '@chakra-ui/react';
import Voice from './Voice';
import Loading from './Loading';
import MobileView from './MobileView';

function App() {
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen width is less than a specified threshold
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // set the threshold to 768px
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize); // Update on resize

    return () => window.removeEventListener('resize', handleResize); // Cleanup on unmount
  }, []);

  if (isMobile) {
    return <MobileView />;
  }

  return (
    <Router>
      <Flex height="100vh" overflow="hidden">
        {/* Navbar on the left */}
        <NavBar />

        {/* Content area shifted to the right */}
        <Box flex="1" ml="80px" overflowY="auto">
          <Routes>
            {/* Home Route */}
            <Route path="/" element={<Chatbot />} />

            {/* Map Route */}
            <Route path="/map" element={<Map />} />

            {/* Voice Route */}
            <Route path="/voice" element={<Voice />} />

            {/* Loading Route */}
            <Route path="/loading" element={<Loading />} />
          </Routes>
        </Box>
      </Flex>
    </Router>
  );
}

export default App;
