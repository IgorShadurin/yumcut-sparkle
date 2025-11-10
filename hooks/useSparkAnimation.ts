import React, { useEffect, useRef } from 'react';
import type { Spark, SparkSettings } from '../types';

export const useSparkAnimation = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  settings: SparkSettings
) => {
  const sparksRef = useRef<Spark[]>([]);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const createSpark = (width: number, height: number): Spark => {
      const angleRad = (settings.directionAngle * Math.PI) / 180;
      const spread = Math.PI / 4; // 45 degree spread
      const randomAngle = angleRad + (Math.random() - 0.5) * spread;
      
      const speed = settings.speed * (Math.random() * 0.7 + 0.5);
      const vx = Math.cos(randomAngle) * speed;
      const vy = Math.sin(randomAngle) * speed;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        size: settings.minSize + Math.random() * (settings.maxSize - settings.minSize),
        opacity: Math.random() * 0.5 + 0.5,
        life: 0,
        maxLife: 50 + Math.random() * 150,
        color: settings.color,
      };
    };
    
    const resetSpark = (spark: Spark, width: number, height: number): void => {
        Object.assign(spark, createSpark(width, height));
    };

    const initializeSparks = () => {
      const { width, height } = canvas;
      sparksRef.current = Array.from({ length: settings.amount }, () => createSpark(width, height));
    };
    
    // Re-initialize if amount changes
    if (sparksRef.current.length !== settings.amount) {
        initializeSparks();
    }

    const animate = () => {
      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      ctx.clearRect(0, 0, width, height);

      sparksRef.current.forEach(spark => {
        // Update
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life++;

        // Fade effect
        spark.opacity = (1 - spark.life / spark.maxLife) * (Math.random() * 0.4 + 0.6);
        
        // Reset
        if (spark.life >= spark.maxLife || spark.opacity <= 0) {
          resetSpark(spark, width, height);
        }

        // Draw
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2, false);
        ctx.fillStyle = `${spark.color}${Math.round(spark.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowColor = spark.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.closePath();
      });

      // Reset shadow for other drawings
      ctx.shadowBlur = 0;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [settings, canvasRef]);
};