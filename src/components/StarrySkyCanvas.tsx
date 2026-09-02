import React, { useEffect, useRef } from 'react';

interface StarrySkyCanvasProps {
  themeMode: 'dark' | 'light';
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export const StarrySkyCanvas: React.FC<StarrySkyCanvasProps> = ({ themeMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // Star colors: crisp cool blue, warm cream, gentle celestial white
    const starColors = ['#FFFFFF', '#E0F2FE', '#BAE6FD', '#FEF3C7', '#EDE9FE'];

    let stars: Star[] = [];
    const initStars = () => {
      const starCount = Math.floor((width * height) / 4800); // Dense yet high-performance
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.3 + 0.4,
          baseAlpha: Math.random() * 0.6 + 0.25,
          twinkleSpeed: Math.random() * 0.02 + 0.008,
          phase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }
    };

    initStars();

    // Meteors / Shooting stars management
    let meteors: Meteor[] = [];
    let lastMeteorTime = Date.now();
    const nextMeteorInterval = () => Math.random() * 5000 + 4000; // soft streak every 4-9 seconds
    let nextMeteorAt = Date.now() + 2000;

    const spawnMeteor = () => {
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1); // ~45 degree gentle descent
      const startX = Math.random() * (width * 0.9) - 50;
      const startY = Math.random() * (height * 0.4);
      const speed = Math.random() * 3.5 + 4.5;
      const length = Math.random() * 90 + 70;
      const maxLife = Math.random() * 50 + 45;

      meteors.push({
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        alpha: 0,
        life: 0,
        maxLife,
        color: Math.random() > 0.4 ? '#E0F2FE' : '#FEF08A',
      });
    };

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      if (themeMode === 'dark') {
        // Deep midnight sky background with gentle celestial gradients
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#040711');
        gradient.addColorStop(0.35, '#070B18');
        gradient.addColorStop(0.7, '#0A0F22');
        gradient.addColorStop(1, '#060914');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Soft celestial nebula auroral washes (subtle indigo, cyan, deep violet)
        const nebula1 = ctx.createRadialGradient(
          width * 0.25, height * 0.2, 10,
          width * 0.25, height * 0.2, width * 0.45
        );
        nebula1.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
        nebula1.addColorStop(0.6, 'rgba(99, 102, 241, 0.04)');
        nebula1.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, width, height);

        const nebula2 = ctx.createRadialGradient(
          width * 0.8, height * 0.55, 20,
          width * 0.8, height * 0.55, width * 0.5
        );
        nebula2.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
        nebula2.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
        nebula2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, width, height);

        // Draw Twinkling Stars
        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          star.phase += star.twinkleSpeed;
          const currentAlpha = star.baseAlpha + Math.sin(star.phase) * 0.35;
          const safeAlpha = Math.max(0.1, Math.min(1, currentAlpha));

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = safeAlpha;
          ctx.fill();

          // Subtle star flare for larger stars
          if (star.radius > 1.2 && safeAlpha > 0.6) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = safeAlpha * 0.22;
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // Meteor Spawning & Rendering
        const now = Date.now();
        if (now >= nextMeteorAt) {
          spawnMeteor();
          nextMeteorAt = now + nextMeteorInterval();
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.life += 1;
          m.x += Math.cos(m.angle) * m.speed;
          m.y += Math.sin(m.angle) * m.speed;

          // Fade in and fade out curve
          const progress = m.life / m.maxLife;
          if (progress < 0.25) {
            m.alpha = (progress / 0.25) * 0.85;
          } else {
            m.alpha = (1 - (progress - 0.25) / 0.75) * 0.85;
          }

          if (m.life >= m.maxLife || m.x > width + 100 || m.y > height + 100) {
            meteors.splice(i, 1);
            continue;
          }

          const tailX = m.x - Math.cos(m.angle) * m.length;
          const tailY = m.y - Math.sin(m.angle) * m.length;

          const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          meteorGrad.addColorStop(0.7, `rgba(186, 230, 253, ${m.alpha * 0.6})`);
          meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Luminous head of meteor
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = m.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        // Light Mode Atmospheric Daylight Gradient Mesh
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#F8FAFC');
        gradient.addColorStop(0.5, '#F1F5F9');
        gradient.addColorStop(1, '#F8FAFC');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [themeMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      style={{
        opacity: themeMode === 'dark' ? 0.95 : 0.4,
      }}
      aria-hidden="true"
    />
  );
};
