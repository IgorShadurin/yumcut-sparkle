import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SparkCanvas } from './components/SparkCanvas';
import { generateVideo } from './services/videoGenerator';
import type { SparkSettings, AspectRatio, VideoSettings, VideoFormat, Resolution } from './types';
import { VideoIcon } from './components/Icons';

function App() {
  const [settings, setSettings] = useState<SparkSettings>({
    amount: 150,
    speed: 3,
    minSize: 24,
    maxSize: 30,
    color: '#FFFFFF',
    directionAngle: -55, // Fly upwards
  });
  const [videoDuration, setVideoDuration] = useState<number>(20);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [format, setFormat] = useState<VideoFormat>('png-sequence');
  const [resolution, setResolution] = useState<Resolution>('2160p');
  const [fps, setFps] = useState<number>(60);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationMessage, setGenerationMessage] = useState<string>('Generating Video...');

  const handleGenerateVideo = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage(format === 'png-sequence' ? 'Saving frames to disk...' : 'Generating Video...');

    const videoSettings: VideoSettings = {
      ...settings,
      duration: videoDuration,
      aspectRatio: aspectRatio,
      format: format,
      resolution: resolution,
      fps: fps,
    };
    
    try {
      // generateVideo will return a URL for WebM, but not for PNG sequence (which saves directly)
      const resultUrl = await generateVideo(videoSettings, (progress) => {
        setGenerationProgress(progress);
      });
      
      if (resultUrl) {
        const a = document.createElement('a');
        a.href = resultUrl;
        const fileExtension = 'webm';
        const formatName = format.replace('webm-','');
        a.download = `sparkles-${aspectRatio}-${videoDuration}s-${formatName}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(resultUrl);
      }
      // If resultUrl is null (PNG sequence), do nothing here as saving is handled by the service.

    } catch (error: any) {
      // Don't show an alert if the user just cancelled the directory picker
      if (error.name === 'AbortError') {
        console.log('User cancelled the directory picker.');
        return;
      }
      console.error("Video generation failed:", error);
      alert(`Video generation failed: ${error.message}. Your browser might not support the required features. Please try a modern browser like Chrome or Edge.`);
    } finally {
      setIsGenerating(false);
    }
  }, [settings, videoDuration, aspectRatio, format, resolution, fps, isGenerating]);

  const resolutionText = resolution === '1080p' 
    ? (aspectRatio === '16:9' ? '1920x1080' : '1080x1920')
    : (aspectRatio === '16:9' ? '3840x2160' : '2160x3840');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <header className="p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          ✨ Sparkle Video Generator
        </h1>
        <p className="text-center text-gray-400 text-sm mt-1">Customize and generate transparent sparkle effect videos.</p>
      </header>

      <main className="p-4 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        <aside className="w-full lg:w-80 xl:w-96 bg-gray-800 rounded-lg shadow-2xl p-6">
          <ControlPanel
            settings={settings}
            setSettings={setSettings}
            videoDuration={videoDuration}
            setVideoDuration={setVideoDuration}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            format={format}
            setFormat={setFormat}
            resolution={resolution}
            setResolution={setResolution}
            fps={fps}
            setFps={setFps}
            onGenerate={handleGenerateVideo}
            isGenerating={isGenerating}
          />
        </aside>
        
        <section className="min-h-[50vh] lg:min-h-0 flex items-center justify-center bg-black rounded-lg shadow-inner overflow-hidden relative">
           <SparkCanvas settings={settings} aspectRatio={aspectRatio} format={format} />
           <div className="absolute bottom-2 right-3 bg-black/50 text-white/80 px-2 py-1 rounded text-xs font-mono">
            {resolutionText}
           </div>
        </section>
      </main>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="w-72 bg-gray-800 rounded-lg p-8 shadow-2xl text-center">
                <VideoIcon className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
                <h3 className="text-xl font-semibold mt-4">{generationMessage}</h3>
                <p className="text-gray-400 mt-2">Please wait, this may take a moment.</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-6">
                    <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2.5 rounded-full" style={{ width: `${generationProgress * 100}%` }}></div>
                </div>
                <p className="text-sm font-mono mt-2 text-cyan-300">{Math.round(generationProgress * 100)}%</p>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;