import { useState, useRef, useEffect } from 'react';
import { typography, colors } from '../../styles/index.js';
import AudioVisualizer from './AudioVisualizer.jsx';
import { saveRecording as saveRecordingToSupabase } from '../../services/recording.js';

// Constants from environment
const MAX_RECORDING_DURATION = import.meta.env.VITE_MAX_RECORDING_DURATION || 300000; // 5 minutes
const MIN_RECORDING_DURATION = 5000; // 5 seconds

function VoiceRecorder() {
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // in milliseconds
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recordingId, setRecordingId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Request microphone permission
  const requestPermission = async () => {
    console.log('[VoiceRecorder] Requesting microphone permission');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[VoiceRecorder] Permission granted');
      setPermissionStatus('granted');
      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      return stream;
    } catch (err) {
      console.error('[VoiceRecorder] Permission denied:', err);
      setPermissionStatus('denied');
      setError('Microphone access denied. Please allow microphone access to record.');
      return null;
    }
  };

  // Start recording
  const startRecording = async () => {
    console.log('[VoiceRecorder] Starting recording');
    setError(null);

    let stream = streamRef.current;

    // Request permission if not already granted
    if (!stream || permissionStatus !== 'granted') {
      stream = await requestPermission();
      if (!stream) return;
    }

    // Create MediaRecorder
    const options = { mimeType: 'audio/webm' };

    // Check for supported MIME types
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.warn('[VoiceRecorder] audio/webm not supported, trying alternatives');
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options.mimeType = 'audio/ogg';
      } else {
        options.mimeType = '';
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('[VoiceRecorder] Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[VoiceRecorder] Recording stopped');
        const blob = new Blob(audioChunksRef.current, { type: options.mimeType });
        setAudioBlob(blob);
        console.log('[VoiceRecorder] Audio blob created:', blob.size, 'bytes', blob.type);
      };

      mediaRecorder.onerror = (event) => {
        console.error('[VoiceRecorder] MediaRecorder error:', event.error);
        setError('Recording error occurred. Please try again.');
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 100;

          // Auto-stop at max duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            console.warn('[VoiceRecorder] Max duration reached, stopping recording');
            stopRecording();
            return MAX_RECORDING_DURATION;
          }

          return newDuration;
        });
      }, 100);

      console.log('[VoiceRecorder] Recording started successfully');
    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  // Pause recording
  const pauseRecording = () => {
    console.log('[VoiceRecorder] Pausing recording');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    console.log('[VoiceRecorder] Resuming recording');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 100;

          // Auto-stop at max duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            console.warn('[VoiceRecorder] Max duration reached, stopping recording');
            stopRecording();
            return MAX_RECORDING_DURATION;
          }

          return newDuration;
        });
      }, 100);
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('[VoiceRecorder] Stopping recording');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Check minimum duration
      if (duration < MIN_RECORDING_DURATION) {
        setError(`Recording must be at least ${MIN_RECORDING_DURATION / 1000} seconds long`);
        cancelRecording();
        return;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    console.log('[VoiceRecorder] Cancelling recording');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
    audioChunksRef.current = [];

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Format duration display
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Save recording
  const saveRecording = async () => {
    if (!audioBlob) {
      setError('No recording to save');
      return;
    }

    console.log('[VoiceRecorder] Saving recording...');
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveRecordingToSupabase(audioBlob, duration);

      if (result.success) {
        console.log('[VoiceRecorder] Recording saved successfully:', result.recordingId);
        setSaveSuccess(true);
        setRecordingId(result.recordingId);

        if (result.transcriptionTriggered) {
          setError(null);
        } else {
          setError('Recording saved, but transcription failed to start. You can retry from History.');
        }

        // Reset after delay to show success message
        setTimeout(() => {
          setAudioBlob(null);
          setDuration(0);
          setSaveSuccess(false);
          setIsSaving(false);
        }, 3000);
      } else {
        throw new Error('Failed to save recording');
      }
    } catch (err) {
      console.error('[VoiceRecorder] Save error:', err);
      setError(err.message || 'Failed to save recording. Please try again.');
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    timer: {
      ...typography.numberLarge,
      color: isRecording ? colors.success[600] : colors.neutral[900],
      textAlign: 'center',
      marginBottom: '8px',
    },
    maxDuration: {
      ...typography.caption,
      color: colors.neutral[500],
      textAlign: 'center',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    button: {
      ...typography.button,
      padding: '16px 32px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    recordButton: {
      backgroundColor: colors.success[600],
      color: colors.white,
    },
    stopButton: {
      backgroundColor: colors.danger[600],
      color: colors.white,
    },
    pauseButton: {
      backgroundColor: colors.warning[600],
      color: colors.white,
    },
    secondaryButton: {
      backgroundColor: colors.neutral[200],
      color: colors.neutral[700],
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.danger[600],
      textAlign: 'center',
      padding: '12px',
      backgroundColor: colors.danger[50],
      borderRadius: '8px',
    },
    successText: {
      ...typography.bodySmall,
      color: colors.success[700],
      textAlign: 'center',
      padding: '12px',
      backgroundColor: colors.success[50],
      borderRadius: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Timer */}
        <div style={styles.timer}>{formatDuration(duration)}</div>
        <div style={styles.maxDuration}>
          Max: {formatDuration(MAX_RECORDING_DURATION)}
        </div>

        {/* Audio Visualizer */}
        {isRecording && !isPaused && analyserRef.current && (
          <AudioVisualizer analyser={analyserRef.current} />
        )}

        {/* Error message */}
        {error && <div style={styles.errorText}>{error}</div>}

        {/* Success message */}
        {audioBlob && (
          <div style={styles.successText}>
            Recording complete! Duration: {formatDuration(duration)}
          </div>
        )}

        {/* Control buttons */}
        <div style={styles.buttonContainer}>
          {!isRecording && !audioBlob && (
            <button
              style={{ ...styles.button, ...styles.recordButton }}
              onClick={startRecording}
            >
              {permissionStatus === 'granted' ? '● Start Recording' : '● Allow Microphone & Record'}
            </button>
          )}

          {isRecording && !isPaused && (
            <>
              <button
                style={{ ...styles.button, ...styles.stopButton }}
                onClick={stopRecording}
              >
                ■ Stop Recording
              </button>
              <button
                style={{ ...styles.button, ...styles.pauseButton }}
                onClick={pauseRecording}
              >
                ║ Pause
              </button>
            </>
          )}

          {isRecording && isPaused && (
            <>
              <button
                style={{ ...styles.button, ...styles.recordButton }}
                onClick={resumeRecording}
              >
                ▶ Resume
              </button>
              <button
                style={{ ...styles.button, ...styles.stopButton }}
                onClick={stopRecording}
              >
                ■ Stop Recording
              </button>
            </>
          )}

          {audioBlob && !saveSuccess && (
            <>
              <button
                style={{ ...styles.button, ...styles.recordButton }}
                onClick={saveRecording}
                disabled={isSaving}
              >
                {isSaving ? '⏳ Saving...' : '✓ Save & Transcribe'}
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={cancelRecording}
                disabled={isSaving}
              >
                ✕ Discard
              </button>
            </>
          )}

          {saveSuccess && (
            <div style={styles.successText}>
              ✓ Recording saved successfully! Transcription in progress...
              {recordingId && (
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  Recording ID: {recordingId}
                </div>
              )}
            </div>
          )}

          {isRecording && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={cancelRecording}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceRecorder;
