import React, { useRef, useEffect, useMemo } from 'react';
import { useSparkAnimation } from '../hooks/useSparkAnimation';
import type { SparkSettings, AspectRatio, VideoFormat } from '../types';

interface SparkCanvasProps {
  settings: SparkSettings;
  aspectRatio: AspectRatio;
  format: VideoFormat;
}

const PREVIEW_MAX_HEIGHT_PX = 640;

export const SparkCanvas: React.FC<SparkCanvasProps> = ({ settings, aspectRatio, format }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { cssAspectRatio, heightExpression } = useMemo(() => {
    const [rawW, rawH] = aspectRatio.split(':').map((value) => parseInt(value, 10));
    const hasValidRatio = Number.isFinite(rawW) && Number.isFinite(rawH) && rawW > 0 && rawH > 0;
    const ratioWidth = hasValidRatio ? rawW : 9;
    const ratioHeight = hasValidRatio ? rawH : 16;
    const ratio = ratioWidth / ratioHeight;
    const ratioFixed = ratio.toFixed(4);
    const heightExpression = `min(80vh, ${PREVIEW_MAX_HEIGHT_PX}px, calc(90vw / ${ratioFixed}))`;

    return {
      cssAspectRatio: `${ratioWidth} / ${ratioHeight}`,
      heightExpression,
    };
  }, [aspectRatio]);

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
      const hasValidRatio = Number.isFinite(ratioW) && Number.isFinite(ratioH) && ratioW > 0 && ratioH > 0;
      const safeRatioW = hasValidRatio ? ratioW : 9;
      const safeRatioH = hasValidRatio ? ratioH : 16;
      
      let canvasWidth = clientWidth;
      let canvasHeight = (clientWidth * safeRatioH) / safeRatioW;

      if (canvasHeight > clientHeight) {
          canvasHeight = clientHeight;
          canvasWidth = (clientHeight * safeRatioW) / safeRatioH;
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

  const isPortrait = useMemo(() => {
    const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
    if (!Number.isFinite(ratioW) || !Number.isFinite(ratioH) || ratioW <= 0 || ratioH <= 0) {
      return true;
    }
    return ratioH >= ratioW;
  }, [aspectRatio]);

  const wrapperPaddingClass = isPortrait ? 'px-4 pt-1 pb-6' : 'px-4 py-2';

  return (
    <div className={`w-full flex items-center justify-center ${wrapperPaddingClass}`}>
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-[32px] border border-white/10 shadow-[0_20px_80px_rgba(76,29,149,0.35)] transition-colors ${
          format === 'webm-green' ? 'bg-green-500' : 'bg-slate-900/60'
        }`}
        style={{
          height: heightExpression,
          maxWidth: '90vw',
          aspectRatio: cssAspectRatio,
        }}
      >
        <canvas ref={canvasRef} className="h-full w-full bg-transparent" />
      </div>
    </div>
  );
};
