'use client';
import { useRef, useEffect } from 'react';

/**
 * CSS + Canvas 2D animated globe — no WebGL, no Three.js crashes.
 * Looks premium without the instability.
 */
export default function ThreeGlobe({ size = 280, color = '#6366f1', speed = 0.004 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = size;
    const H = size;
    canvas.width = W;
    canvas.height = H;
    let angle = 0;

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return `${r},${g},${b}`;
    };
    const rgb = hexToRgb(color);

    const drawGlobe = () => {
      ctx.clearRect(0, 0, W, H);
      const cx = W/2, cy = H/2, R = W * 0.38;

      // Outer glow
      const grd = ctx.createRadialGradient(cx, cy, R*0.3, cx, cy, R*1.1);
      grd.addColorStop(0, `rgba(${rgb},0.08)`);
      grd.addColorStop(1, `rgba(${rgb},0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R*1.1, 0, Math.PI*2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Globe sphere
      const sphereGrd = ctx.createRadialGradient(cx - R*0.2, cy - R*0.2, 0, cx, cy, R);
      sphereGrd.addColorStop(0, `rgba(${rgb},0.12)`);
      sphereGrd.addColorStop(1, `rgba(${rgb},0.03)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI*2);
      ctx.fillStyle = sphereGrd;
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb},0.15)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Latitude lines
      ctx.strokeStyle = `rgba(${rgb},0.12)`;
      ctx.lineWidth = 0.8;
      for (let lat = -70; lat <= 70; lat += 20) {
        const y = cy + R * Math.sin(lat * Math.PI / 180);
        const rx = R * Math.cos(lat * Math.PI / 180);
        ctx.beginPath();
        ctx.ellipse(cx, y, rx, rx * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines (rotating)
      for (let i = 0; i < 8; i++) {
        const theta = (i * Math.PI / 4) + angle;
        ctx.strokeStyle = `rgba(${rgb},${Math.abs(Math.cos(theta)) * 0.2 + 0.05})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * Math.abs(Math.cos(theta)), R, theta, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Orbit ring 1
      ctx.strokeStyle = `rgba(${rgb},0.3)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.42, R * 0.4, angle * 0.5 + 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Orbit ring 2
      ctx.strokeStyle = `rgba(160,132,246,0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.65, R * 0.3, -angle * 0.3 - 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Floating data node
      const nodeAngle = angle * 2;
      const nx = cx + R * 1.42 * Math.cos(nodeAngle);
      const ny = cy + R * 0.4 * Math.sin(nodeAngle);
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      angle += speed;
      rafRef.current = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [size, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
