import React, { useRef, useEffect } from 'react';
import { useSparkAnimation } from '../hooks/useSparkAnimation';
import type { SparkSettings, AspectRatio, VideoFormat } from '../types';

interface SparkCanvasProps {
  settings: SparkSettings;
  aspectRatio: AspectRatio;
  format: VideoFormat;
}

export const SparkCanvas: React.FC<SparkCanvasProps> = ({ settings, aspectRatio, format }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pass canvas ref and settings to the animation hook
  useSparkAnimation(canvasRef, settings);

  // Adjust canvas size when container or aspect ratio resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) {
        return;
      }
      
      // Use the size from the observer's entry for stability.
      // This is more reliable than querying clientWidth/clientHeight directly
      // and prevents the ResizeObserver loop error.
      const entry = entries[0];
      const { width: clientWidth, height: clientHeight } = entry.contentRect;

      const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
      
      let canvasWidth = clientWidth;
      let canvasHeight = (clientWidth * ratioH) / ratioW;

      if (canvasHeight > clientHeight) {
          canvasHeight = clientHeight;
          canvasWidth = (clientHeight * ratioW) / ratioH;
      }

      // Round dimensions to avoid sub-pixel layout shifts causing loops.
      const newWidth = Math.round(canvasWidth);
      const newHeight = Math.round(canvasHeight);
      
      // Only update the canvas size if it has actually changed.
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [aspectRatio]);

  return (
    <div ref={containerRef} className={`w-full h-full flex items-center justify-center p-2 transition-colors ${format === 'webm-green' ? 'bg-green-500' : ''}`}>
      <canvas ref={canvasRef} className="bg-transparent" />
    </div>
  );
};