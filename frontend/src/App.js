import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, Paper, Box, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/system';

const WaContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: '#f5f5dc',  // 和紙のような色
  borderRadius: '8px',
  boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
}));

const WaButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#8B4513',  // 茶色
  color: '#fff',
  '&:hover': {
    backgroundColor: '#A0522D',
  },
}));

const WaTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#8B4513',
    },
    '&:hover fieldset': {
      borderColor: '#A0522D',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#8B4513',
    },
  },
});

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 48000
    };
    mediaRecorder.current = new MediaRecorder(stream, options);
    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };
    mediaRecorder.current.onstop = handleAudioData;
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioData = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
    audioChunks.current = [];

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    setIsLoading(true);
    try {
      const transcribeResponse = await axios.post('http://localhost:8000/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTranscription(transcribeResponse.data.transcription);

      // Update conversation history with user's message
      const updatedHistory = [...conversationHistory, { role: 'user', content: transcribeResponse.data.transcription }];

      const chatResponse = await axios.post('http://localhost:8000/chat', {
        messages: updatedHistory,
      });
      setResponse(chatResponse.data.response);

      // Update conversation history with AI's response
      updatedHistory.push({ role: 'assistant', content: chatResponse.data.response });
      setConversationHistory(updatedHistory);

      const synthesizeResponse = await axios.post('http://localhost:8000/synthesize', {
        text: chatResponse.data.response,
      }, { responseType: 'blob' });

      const audioUrl = URL.createObjectURL(synthesizeResponse.data);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setConversationHistory([]);
    setResponse('');
    setTranscription('');
  };

  return (
    <WaContainer>
      <Typography variant="h4" gutterBottom style={{ color: '#8B4513' }}>
        音声対話AI
      </Typography>
      <Box my={2}>
        <WaButton
          variant="contained"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
        >
          {isRecording ? '録音停止' : '録音開始'}
        </WaButton>
      </Box>
      <WaTextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        value={transcription}
        onChange={(e) => setTranscription(e.target.value)}
        placeholder="ここに音声が文字に変換されます"
        disabled={isLoading}
      />
      <Box my={2}>
        <WaButton
          variant="contained"
          onClick={handleAudioData}
          disabled={isLoading || (!isRecording && !transcription)}
        >
          送信
        </WaButton>
      </Box>
      {isLoading && <CircularProgress />}
      <Typography variant="body1" style={{ whiteSpace: 'pre-wrap', color: '#8B4513' }}>
        {response}
      </Typography>
      <Box mt={4}>
        <Typography variant="h6" gutterBottom style={{ color: '#8B4513' }}>
          会話履歴
        </Typography>
        <List>
          {conversationHistory.map((message, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={message.role === 'user' ? 'あなた' : 'AI'}
                secondary={message.content}
                primaryTypographyProps={{ style: { color: '#8B4513' } }}
              />
            </ListItem>
          ))}
        </List>
        <Box mt={2}>
          <WaButton
            variant="contained"
            onClick={clearHistory}
            disabled={conversationHistory.length === 0}
          >
            履歴をクリア
          </WaButton>
        </Box>
      </Box>
    </WaContainer>
  );
}

export default App;
