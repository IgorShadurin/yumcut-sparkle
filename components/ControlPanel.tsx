import React, { useMemo } from 'react';
import type { SparkSettings, AspectRatio, VideoFormat, Resolution } from '../types';
import { AspectRatio16x9Icon, AspectRatio9x16Icon, VideoIcon } from './Icons';

interface ControlPanelProps {
  settings: SparkSettings;
  setSettings: React.Dispatch<React.SetStateAction<SparkSettings>>;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  format: VideoFormat;
  setFormat: (format: VideoFormat) => void;
  resolution: Resolution;
  setResolution: (resolution: Resolution) => void;
  fps: number;
  setFps: (fps: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlSlider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
            <span>{label}</span>
            <span className="font-mono text-cyan-300">{value}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  setSettings,
  videoDuration,
  setVideoDuration,
  aspectRatio,
  setAspectRatio,
  format,
  setFormat,
  resolution,
  setResolution,
  fps,
  setFps,
  onGenerate,
  isGenerating,
}) => {
  const handleSettingChange = (key: keyof SparkSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [key]: parseFloat(e.target.value) }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, color: e.target.value }));
  };

  const isFileSystemApiSupported = useMemo(() => 'showDirectoryPicker' in window, []);
  const isGenerateDisabled = isGenerating || (format === 'png-sequence' && !isFileSystemApiSupported);


  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Sparkle Settings</h2>
      <ControlSlider label="Amount" value={settings.amount} min={10} max={500} step={10} onChange={handleSettingChange('amount')} />
      <ControlSlider label="Speed" value={settings.speed} min={0.1} max={100} step={0.1} onChange={handleSettingChange('speed')} />
      <ControlSlider label="Min Size" value={settings.minSize} min={0.5} max={50} step={0.1} onChange={handleSettingChange('minSize')} />
      <ControlSlider label="Max Size" value={settings.maxSize} min={0.5} max={100} step={0.1} onChange={handleSettingChange('maxSize')} />
      <ControlSlider label="Direction Angle" value={settings.directionAngle} min={-180} max={180} step={1} onChange={handleSettingChange('directionAngle')} />
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
        <div className="relative">
          <input type="color" value={settings.color} onChange={handleColorChange} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer" />
          <span className="font-mono absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">{settings.color}</span>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 mt-4 border-b border-gray-700 pb-2">Video Output</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between">
            <span>Duration (seconds)</span>
            <span className="font-mono text-cyan-300">{videoDuration}s</span>
        </label>
        <input type="number" min="1" max="60" value={videoDuration} onChange={e => setVideoDuration(parseInt(e.target.value, 10))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"/>
      </div>

       <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAspectRatio('16:9')} className={`p-2 rounded-lg border-2 transition-colors ${aspectRatio === '16:9' ? 'bg-purple-600/50 border-purple-500' : 'bg-gray-700 border-gray-600 hover:border-purple-500'}`}>
                <AspectRatio16x9Icon className="w-8 h-8 mx-auto"/>
                <span className="text-xs mt-1">16:9</span>
            </button>
             <button onClick={() => setAspectRatio('9:16')} className={`p-2 rounded-lg border-2 transition-colors ${aspectRatio === '9:16' ? 'bg-purple-600/50 border-purple-500' : 'bg-gray-700 border-gray-600 hover:border-purple-500'}`}>
                <AspectRatio9x16Icon className="w-8 h-8 mx-auto"/>
                <span className="text-xs mt-1">9:16</span>
            </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="format-select" className="block text-sm font-medium text-gray-400 mb-2">Format</label>
        <select 
          id="format-select"
          value={format} 
          onChange={e => setFormat(e.target.value as VideoFormat)} 
          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="png-sequence">PNG Sequence (Direct Save)</option>
          <option value="webm-transparent">WebM Video (Transparent)</option>
          <option value="webm-green">WebM Video (Green Screen)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">PNG Sequence is recommended for video editors and requires a modern browser like Chrome.</p>
      </div>
      
      {format === 'png-sequence' && (
        <>
          <div className="mb-4">
            <label htmlFor="resolution-select" className="block text-sm font-medium text-gray-400 mb-2">Resolution</label>
            <select 
              id="resolution-select"
              value={resolution} 
              onChange={e => setResolution(e.target.value as Resolution)} 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="1080p">HD (1080p)</option>
              <option value="2160p">4K (2160p)</option>
            </select>
          </div>
          <div className="mb-6">
            <label htmlFor="fps-select" className="block text-sm font-medium text-gray-400 mb-2">FPS</label>
            <select 
              id="fps-select"
              value={fps} 
              onChange={e => setFps(parseInt(e.target.value, 10))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="24">24</option>
              <option value="30">30</option>
              <option value="60">60</option>
            </select>
          </div>
        </>
      )}

      {/* FFmpeg Command Section */}
      {format === 'png-sequence' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Convert PNG Sequence to Video</h3>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Copy this command to convert your PNG sequence to video:</p>
            <div className="relative">
              <pre className="text-xs font-mono text-cyan-300 bg-gray-900 p-3 rounded border border-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
{`ffmpeg -y -framerate ${fps} -start_number 0 -i "path/to/your/frames/frame_%05d.png" -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -alpha_bits 16 -an "output/sparkles.mov"`}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`ffmpeg -y -framerate ${fps} -start_number 0 -i "path/to/your/frames/frame_%05d.png" -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -alpha_bits 16 -an "output/sparkles.mov"`);
                }}
                className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Replace <code className="bg-gray-700 px-1 rounded">path/to/your/frames</code> with your actual frames directory path.
            </p>
          </div>
        </div>
      )}

      <div className="mt-auto relative" title={isGenerateDisabled && !isGenerating ? "Direct Save requires a browser that supports the File System Access API, like Chrome." : ""}>
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <VideoIcon className="w-6 h-6"/>
          {isGenerating ? 'Generating...' : 'Generate Video'}
        </button>
      </div>
    </div>
  );
};
