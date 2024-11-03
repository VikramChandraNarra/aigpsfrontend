import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Button,
  VStack,
  Text,
  Center,
  Textarea,
  Stack,
  List,
  ListItem,
  IconButton,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
} from '@chakra-ui/react';
import { FaBars, FaPlus, FaEllipsisV } from 'react-icons/fa';
import Message from './Message';
import Direction from './Direction';

const Chatbot = () => {
  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    return savedSessions ? JSON.parse(savedSessions) : {};
  });
  const generateSessionId = () => {
    const now = new Date();
    return now.toLocaleString();
  };

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const lastSession = localStorage.getItem('lastSession');
    return lastSession || generateSessionId();
  });

  const [messages, setMessages] = useState(() => sessions[currentSessionId] || []);
  const [userInput, setUserInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [editSessionId, setEditSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    setMessages(sessions[currentSessionId] || []);
    localStorage.setItem('lastSession', currentSessionId);
  }, [currentSessionId, sessions]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  const handleSendMessage = () => {
    if (userInput.trim()) {
      const newMessage = { text: userInput, sender: 'user', type: 'text' };
      const updatedMessages = [...messages, newMessage];

      updateSession(currentSessionId, updatedMessages);

      const requestData = { input: userInput };

      fetch('https://aigpsbackend.vercel.app/generate_route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.json())
        .then((data) => {
          const botReply = {
            type: 'route',
            sender: 'bot',
            data: data.route1Info,
            route: data.route1,
          };
          const updatedMessagesWithBot = [...updatedMessages, botReply];

          if (data.route1Info.stepsNeeded > 0) {
            const stepsMessage = {
              text: `Looks like you still need ${data.route1Info.stepsNeeded} steps to meet your daily goal. Would you like to get some steps in on your way?`,
              sender: 'bot',
              type: 'text',
            };
            updatedMessagesWithBot.push(stepsMessage);
          }

          setMessages(updatedMessagesWithBot);
          updateSession(currentSessionId, updatedMessagesWithBot);
        })
        .catch(() => {
          const errorMessage = {
            text: 'Sorry, an error occurred while processing your request.',
            sender: 'bot',
            type: 'text',
          };
          const updatedMessagesWithError = [...updatedMessages, errorMessage];

          setMessages(updatedMessagesWithError);
          updateSession(currentSessionId, updatedMessagesWithError);
        });

      setUserInput('');
    }
  };

  const updateSession = (sessionId, updatedMessages) => {
    setSessions((prevSessions) => ({
      ...prevSessions,
      [sessionId]: updatedMessages,
    }));
  };

  const startNewChat = () => {
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    setSessions((prevSessions) => ({
      ...prevSessions,
      [newSessionId]: [],
    }));
  };

  const deleteChat = (sessionId) => {
    const updatedSessions = { ...sessions };
    delete updatedSessions[sessionId];
    setSessions(updatedSessions);

    if (sessionId === currentSessionId) {
      const newCurrentSessionId = Object.keys(updatedSessions)[0] || generateSessionId();
      setCurrentSessionId(newCurrentSessionId);
    }
  };

  const renameChat = (sessionId) => {
    const updatedSessions = { ...sessions };
    updatedSessions[newSessionName] = updatedSessions[sessionId];
    delete updatedSessions[sessionId];
    setSessions(updatedSessions);
    setCurrentSessionId(newSessionName);
    setEditSessionId(null);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const renderMessage = (message, index) => {
    if (message.type === 'route') {
      return <Direction key={index} data={message.data} route={message.route} />;
    }
    return <Message key={index} text={message.text} sender={message.sender} type={message.type} />;
  };

  return (
    <Flex height="100vh" backgroundColor="#1A202C">
      {isMenuOpen && (
        <Box width="25%" borderRight="1px solid #2D3748" padding={4} overflowY="auto">
          <HStack justifyContent="space-between" marginBottom={4}>
            <IconButton
              icon={<FaBars />}
              onClick={toggleMenu}
              aria-label="Collapse Menu"
              size="md"
              colorScheme="teal"
            />
            <IconButton
              icon={<FaPlus />}
              onClick={startNewChat}
              aria-label="Start New Chat"
              size="md"
            />
          </HStack>
          <List spacing={2}>
            {Object.keys(sessions).map((sessionId) => (
              <ListItem
                key={sessionId}
                padding={2}
                borderRadius="md"
                backgroundColor={sessionId === currentSessionId ? '#2B6CB0' : '#2D3748'}
                cursor="pointer"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                onClick={() => setCurrentSessionId(sessionId)}
              >
                <Text color="white">{sessionId}</Text>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisV />}
                    size="sm"
                    colorScheme="gray"
                    aria-label="Options"
                  />
                  <MenuList>
                    <MenuItem onClick={() => setEditSessionId(sessionId)}>
                      Edit Name
                    </MenuItem>
                    <MenuItem onClick={() => deleteChat(sessionId)}>
                      Delete Chat
                    </MenuItem>
                  </MenuList>
                </Menu>
              </ListItem>
            ))}
          </List>

          {editSessionId && (
            <Flex marginTop={4}>
              <Input
                placeholder="New session name"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                color="white"
                backgroundColor="#2D3748"
              />
              <Button onClick={() => renameChat(editSessionId)} colorScheme="blue" marginLeft={2}>
                Save
              </Button>
            </Flex>
          )}
        </Box>
      )}

      <Flex direction="column" width={isMenuOpen ? '75%' : '100%'} padding={4}>
        <Box flexGrow={1} overflowY="auto" padding={4}>
          {messages.length === 0 ? (
            <Center flexGrow={1} padding={4}>
              <VStack spacing={4} align="center">
                <Text fontSize="3xl" fontWeight="bold" textAlign="center" color="white">
                  Where would you like to go today?
                </Text>
                <Flex
                  align="center"
                  gap={2}
                  width="100%"
                  padding={2}
                  backgroundColor="#2D3748"
                  borderRadius="md"
                >
                  <Textarea
                    placeholder="Type your destination..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    flex={1}
                    color="white"
                    backgroundColor="#1A202C"
                  />
                  <Button colorScheme="blue" onClick={handleSendMessage}>
                    Send
                  </Button>
                </Flex>
              </VStack>
            </Center>
          ) : (
            <VStack
              spacing={4}
              align="stretch"
              height="100vh"
              padding={4}
              backgroundColor="#1A202C"
            >
              <Box flex="1" overflowY="auto">
                {messages.map((message, index) => renderMessage(message, index))}
                <div ref={chatEndRef}></div>
              </Box>

              <Flex
                align="center"
                gap={2}
                width="100%"
                padding={2}
                backgroundColor="#2D3748"
                borderRadius="md"
                position="sticky"
                bottom="0"
              >
                <Textarea
                  placeholder="Type your destination..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  flex={1}
                  color="white"
                  backgroundColor="#1A202C"
                />
                <Button colorScheme="blue" onClick={handleSendMessage}>
                  Send
                </Button>
              </Flex>
            </VStack>


          )}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Chatbot;
