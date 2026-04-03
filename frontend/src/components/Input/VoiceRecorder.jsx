import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMic, FiMicOff } from 'react-icons/fi';

export default function VoiceRecorder({ onTranscript, language = 'en' }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText);

      if (finalTranscript) {
        onTranscript?.(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [onTranscript]);

  // Update recognition language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
    }
  }, [language]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start recording:', e);
      }
    }
  }, [isRecording, language]);

  if (!supported) {
    return (
      <div className="mic-container">
        <div className="mic-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <FiMicOff />
        </div>
        <p className="mic-hint" style={{ color: 'var(--color-danger)' }}>
          Voice input is not supported in this browser. Please use Chrome.
        </p>
      </div>
    );
  }

  return (
    <div className="mic-container">
      <button
        className={`mic-btn ${isRecording ? 'recording' : ''}`}
        onClick={toggleRecording}
        id="mic-btn"
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? <FiMicOff /> : <FiMic />}
      </button>

      <p className="mic-hint">
        {isRecording ? t('input.voice_hint_recording') : t('input.voice_hint')}
      </p>

      {transcript && (
        <div className={`transcript-box ${isRecording ? 'active' : ''}`} id="transcript-box">
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
