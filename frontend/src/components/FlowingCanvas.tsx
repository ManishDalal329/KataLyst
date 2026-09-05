import React, { useEffect, useRef } from 'react';

interface FlowingCanvasProps {
  className?: string;
}

export const FlowingCanvas: React.FC<FlowingCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracking for subtle interactive displacement
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.012;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Dot Matrix Wave parameters
      const cols = Math.floor(width / 22);
      const rows = Math.floor(height / 22);
      const spacingX = width / cols;
      const spacingY = height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacingX + spacingX / 2;
          const y = j * spacingY + spacingY / 2;

          // Compute complex wave combination
          const distToMouse = Math.hypot(x - mouseX, y - mouseY);
          const mouseFactor = Math.max(0, 1 - distToMouse / 280);

          // Wave equation
          const wave1 = Math.sin(i * 0.18 + time * 1.5 + j * 0.12);
          const wave2 = Math.cos(j * 0.2 + time * 1.2 - i * 0.08);
          const offsetZ = (wave1 + wave2) * 12 + mouseFactor * 25;

          // Scale dot size & opacity based on wave Z height & position
          const baseRadius = 1.2 + (wave1 + 1) * 0.9 + mouseFactor * 1.8;
          const alpha = Math.min(
            0.65,
            Math.max(0.06, 0.12 + (wave1 + wave2 + 2) * 0.09 + mouseFactor * 0.35)
          );

          ctx.beginPath();
          ctx.arc(x + Math.sin(time + j) * 3, y + offsetZ, baseRadius, 0, Math.PI * 2);

          // Warm dot matrix color palette
          if (mouseFactor > 0.3) {
            ctx.fillStyle = `rgba(107, 79, 59, ${alpha})`; // deep coffee for hover Z factor
          } else if (i % 3 === 0) {
            ctx.fillStyle = `rgba(139, 115, 85, ${alpha * 0.85})`; // muted bronze/taupe
          } else {
            ctx.fillStyle = `rgba(43, 40, 36, ${alpha * 0.7})`; // warm near-black
          }

          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
    />
  );
};

export default FlowingCanvas;
