import { useEffect, useRef } from 'react';
import { colors } from '../../styles/index.js';

function AudioVisualizer({ analyser }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');

    // Set canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Set up analyser
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Animation function
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      canvasContext.fillStyle = colors.neutral[50];
      canvasContext.fillRect(0, 0, width, height);

      // Draw bars
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.8;

        // Gradient color based on height
        const gradient = canvasContext.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, colors.success[400]);
        gradient.addColorStop(1, colors.success[600]);

        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    // Start animation
    console.log('[AudioVisualizer] Starting visualization');
    draw();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        console.log('[AudioVisualizer] Stopping visualization');
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser]);

  const styles = {
    container: {
      margin: '24px 0',
      display: 'flex',
      justifyContent: 'center',
    },
    canvas: {
      width: '100%',
      height: '120px',
      borderRadius: '8px',
      backgroundColor: colors.neutral[50],
    },
  };

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        width="800"
        height="120"
        style={styles.canvas}
      />
    </div>
  );
}

export default AudioVisualizer;
