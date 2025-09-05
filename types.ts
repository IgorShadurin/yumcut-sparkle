export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface SparkSettings {
  amount: number;
  speed: number;
  minSize: number;
  maxSize: number;
  color: string;
  directionAngle: number;
}

export type AspectRatio = '16:9' | '9:16';

export type VideoFormat = 'png-sequence' | 'webm-transparent' | 'webm-green';

export type Resolution = '1080p' | '2160p';

export interface VideoSettings extends SparkSettings {
  duration: number; // in seconds
  aspectRatio: AspectRatio;
  format: VideoFormat;
  resolution: Resolution;
  fps: number;
}