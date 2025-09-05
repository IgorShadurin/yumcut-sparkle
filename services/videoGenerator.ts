import type { VideoSettings, Spark } from '../types';

// --- Shared Animation Logic ---

const createSpark = (settings: VideoSettings, canvasWidth: number, canvasHeight: number): Spark => {
    const angleRad = (settings.directionAngle * Math.PI) / 180;
    const spread = Math.PI / 4;
    const randomAngle = angleRad + (Math.random() - 0.5) * spread;

    const speed = settings.speed * (Math.random() * 0.7 + 0.5);
    const vx = Math.cos(randomAngle) * speed;
    const vy = Math.sin(randomAngle) * speed;

    return {
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx, vy,
        size: settings.minSize + Math.random() * (settings.maxSize - settings.minSize),
        opacity: Math.random() * 0.5 + 0.5,
        life: 0,
        maxLife: 50 + Math.random() * 150,
        color: settings.color,
    };
};

const updateAndDrawSparks = (ctx: CanvasRenderingContext2D, sparks: Spark[], settings: VideoSettings) => {
    const { width, height } = ctx.canvas;

    if (settings.format === 'webm-green') {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.clearRect(0, 0, width, height);
    }

    sparks.forEach(spark => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life++;
        spark.opacity = (1 - spark.life / spark.maxLife) * (Math.random() * 0.4 + 0.6);
        
        if (spark.life >= spark.maxLife || spark.opacity <= 0) {
            Object.assign(spark, createSpark(settings, width, height));
        }
        
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2, false);
        ctx.fillStyle = `${spark.color}${Math.round(spark.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowColor = spark.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.closePath();
    });
    ctx.shadowBlur = 0;
};


// --- Generator for WebM format ---

const generateWebmVideo = (
    settings: VideoSettings,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    sparks: Spark[],
    onProgress: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const mimeType = 'video/webm; codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            return reject(new Error(`Browser does not support ${mimeType}`));
        }

        const stream = canvas.captureStream(60);
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
        recorder.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
        recorder.onerror = reject;

        recorder.start();
        const durationMs = settings.duration * 1000;
        let startTime = performance.now();

        const renderFrame = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime >= durationMs) {
                recorder.stop();
                onProgress(1);
                return;
            }
            updateAndDrawSparks(ctx, sparks, settings);
            onProgress(elapsedTime / durationMs);
            requestAnimationFrame(renderFrame);
        };
        requestAnimationFrame(renderFrame);
    });
};


// --- Generator for PNG Sequence (Direct to File System) ---

const generatePngSequence = async (
    settings: VideoSettings,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    sparks: Spark[],
    onProgress: (progress: number) => void
): Promise<null> => {
    if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API is not supported in this browser.');
    }

    // Fix: Cast window to `any` to call `showDirectoryPicker`. The standard TypeScript
    // DOM library might not include this experimental API, causing a type error.
    const dirHandle = await (window as any).showDirectoryPicker();
    const totalFrames = settings.duration * settings.fps;

    for (let i = 0; i < totalFrames; i++) {
        updateAndDrawSparks(ctx, sparks, settings);
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
            const fileName = `frame_${String(i).padStart(5, '0')}.png`;
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        }

        onProgress((i + 1) / totalFrames);
    }
    return null; // No URL to return, files are saved directly.
};


// --- Main Export Function ---

export const generateVideo = async (
  settings: VideoSettings,
  onProgress: (progress: number) => void
): Promise<string | null> => {
    const [ratioW, ratioH] = settings.aspectRatio.split(':').map(Number);
    const is4K = settings.resolution === '2160p';

    const baseWidth = ratioW === 16 ? (is4K ? 3840 : 1920) : (is4K ? 2160 : 1080);
    const baseHeight = ratioH === 9 ? (is4K ? 2160 : 1080) : (is4K ? 3840 : 1920);

    const canvas = document.createElement('canvas');
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error("Could not get 2D context");

    const sparks = Array.from({ length: settings.amount }, () => createSpark(settings, canvas.width, canvas.height));
    
    if (settings.format === 'png-sequence') {
        return generatePngSequence(settings, canvas, ctx, sparks, onProgress);
    } else {
        return generateWebmVideo(settings, canvas, ctx, sparks, onProgress);
    }
};
