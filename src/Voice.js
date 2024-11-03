import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import Message2 from './Message2';
import Direction from './Direction';
import axios from 'axios';
import { keyframes } from '@emotion/react';

const Voice = () => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const serializableMessages = messages.map((msg) =>
      msg.type === 'component'
        ? { ...msg, type: 'component', data: msg.data, route: msg.route }
        : msg
    );
    localStorage.setItem('messages', JSON.stringify(serializableMessages));
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        await handleAudioProcessing(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioProcessing = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const transcript = await sendAudioToDeepgram(audioBlob);
      if (transcript) {
        const newMessage = { text: transcript, sender: 'user', type: 'text' };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        await sendMessageToBackend(transcript);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: 'Sorry, an error occurred while processing your voice input.',
          sender: 'bot',
          type: 'text',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendAudioToDeepgram = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const response = await axios.post('https://api.deepgram.com/v1/listen', formData, {
        headers: {
          'Authorization': 'Token 4e5fba3a70b31cd5e060580028430781c372ad7a',
          'Content-Type': 'multipart/form-data',
        },
        params: { model: 'nova-2', language: 'en', smart_format: true },
      });

      return response.data.results.channels[0].alternatives[0].transcript;
    } catch (error) {
      console.error('Error sending audio to Deepgram:', error);
      return null;
    }
  };

  const sendMessageToBackend = async (transcript) => {
    setLoading(true);
    try {
      const response = await fetch('https://aigpsbackend.vercel.app/generate_route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: transcript }),
      });
      const data = await response.json();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: 'component',
          sender: 'bot',
          data: data.route1Info,
          route: data.route1,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: 'Sorry, an error occurred while processing your request.',
          sender: 'bot',
          type: 'text',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pulseGlow = keyframes`
    0% { box-shadow: 0 0 5px #81E6D9; }
    50% { box-shadow: 0 0 20px #38B2AC; }
    100% { box-shadow: 0 0 5px #81E6D9; }
  `;

  const bounce = keyframes`
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  `;

  const LoadingAnimation = () => (
    <Flex justify="center" align="center" height="50px">
      <Box as="span" animation={`${bounce} 1.4s infinite`} mr="4px" bg="teal.500" borderRadius="50%" width="10px" height="10px" />
      <Box as="span" animation={`${bounce} 1.4s infinite 0.2s`} mr="4px" bg="teal.500" borderRadius="50%" width="10px" height="10px" />
      <Box as="span" animation={`${bounce} 1.4s infinite 0.4s`} bg="teal.500" borderRadius="50%" width="10px" height="10px" />
    </Flex>
  );

  return (
    <Flex
      direction="column"
      maxW="100%"
      height="100vh"
      margin="0 auto"
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="md"
      backgroundColor="#1A202C"
      color="white"
    >
      {messages.length === 0 ? (
        <Center flexGrow={1} padding={4}>
          <VStack spacing={4} align="center">
            <Text fontSize="3xl" fontWeight="bold" textAlign="center">
              Where would you like to go today?
            </Text>
            <Text color="gray.400">Tap the glowing button below to start speaking</Text>
            <Box
              as="button"
              onClick={isRecording ? stopRecording : startRecording}
              backgroundColor="white"
              width="80px"
              height="80px"
              borderRadius="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              animation={isRecording ? `${pulseGlow} 1.5s infinite` : 'none'}
              transition="all 0.3s ease"
              _hover={{ backgroundColor: 'gray.200' }}
            >
              {isRecording ? <FaStop size="32px" color="#1A202C" /> : <FaMicrophone size="32px" color="#1A202C" />}
            </Box>
          </VStack>
        </Center>
      ) : (
        <Box flexGrow={1} padding={4} overflowY="auto">
          <Center flexGrow={1} padding={4}>
          <VStack spacing={4} align="stretch">
            {messages.map((message, index) =>
              message.type === 'component' ? (
                <Direction key={index} data={message.data} route={message.route} />
              ) : (
                <Message2 key={index} text={message.text} sender={message.sender} type={message.type} />
              )
            )}
            {loading && <LoadingAnimation />}
            <div ref={chatEndRef}></div>
          </VStack>
          </Center>
          <Flex justify="center" mt={4}>
            <Box
              as="button"
              onClick={isRecording ? stopRecording : startRecording}
              backgroundColor="white"
              width="80px"
              height="80px"
              borderRadius="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              animation={isRecording ? `${pulseGlow} 1.5s infinite` : 'none'}
              transition="all 0.3s ease"
              _hover={{ backgroundColor: 'gray.200' }}
            >
              {isRecording ? <FaStop size="32px" color="#1A202C" /> : <FaMicrophone size="32px" color="#1A202C" />}
            </Box>
          </Flex>
        </Box>
      )}
    </Flex>
  );
};

export default Voice;
