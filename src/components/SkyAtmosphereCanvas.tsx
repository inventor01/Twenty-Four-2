import React, { useEffect, useRef } from 'react';

interface SkyAtmosphereProps {
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
  angle: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
  puffs: { offsetX: number; offsetY: number; radius: number }[];
}

export const SkyAtmosphereCanvas: React.FC<SkyAtmosphereProps> = ({ themeMode }) => {
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
      initClouds();
    };

    window.addEventListener('resize', handleResize);

    // --- DARK THEME STARS & METEORS ---
    const starColors = ['#FFFFFF', '#E0F2FE', '#BAE6FD', '#FEF3C7', '#EDE9FE', '#93C5FD'];
    let stars: Star[] = [];

    const initStars = () => {
      const starCount = Math.floor((width * height) / 4200);
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.4,
          baseAlpha: Math.random() * 0.65 + 0.3,
          twinkleSpeed: Math.random() * 0.022 + 0.009,
          phase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
        });
      }
    };

    let meteors: Meteor[] = [];
    const nextMeteorInterval = () => Math.random() * 4500 + 3500;
    let nextMeteorAt = Date.now() + 1500;

    const spawnMeteor = () => {
      const angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
      const startX = Math.random() * (width * 0.95) - 60;
      const startY = Math.random() * (height * 0.45);
      const speed = Math.random() * 3.5 + 4.5;
      const length = Math.random() * 100 + 75;
      const maxLife = Math.random() * 55 + 45;

      meteors.push({
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        alpha: 0,
        life: 0,
        maxLife,
        color: Math.random() > 0.35 ? '#E0F2FE' : '#FEF08A',
      });
    };

    // --- LIGHT THEME DRIFTING FLUFFY CLOUDS ---
    let clouds: Cloud[] = [];

    const createCloudPuffs = (scale: number) => {
      const puffs = [];
      const numPuffs = Math.floor(Math.random() * 4) + 6; // 6 to 9 organic circles
      for (let i = 0; i < numPuffs; i++) {
        const angle = (i / numPuffs) * Math.PI * 2;
        const dist = (Math.random() * 45 + 15) * scale;
        puffs.push({
          offsetX: Math.cos(angle) * dist + (Math.random() * 20 - 10) * scale,
          offsetY: Math.sin(angle) * (dist * 0.45) + (Math.random() * 10 - 5) * scale,
          radius: (Math.random() * 45 + 35) * scale,
        });
      }
      return puffs;
    };

    const initClouds = () => {
      clouds = [];
      const cloudCount = Math.max(5, Math.floor(width / 240));
      for (let i = 0; i < cloudCount; i++) {
        const scale = Math.random() * 0.9 + 0.7; // soft varied size
        clouds.push({
          x: Math.random() * (width + 400) - 200,
          y: Math.random() * (height * 0.85) + 30,
          scale,
          speed: (Math.random() * 0.28 + 0.15) * (scale * 0.75 + 0.25), // parallax speed
          opacity: Math.random() * 0.35 + 0.4,
          puffs: createCloudPuffs(scale),
        });
      }
    };

    initStars();
    initClouds();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (themeMode === 'dark') {
        // --- DEEP CELESTIAL STARRY NIGHT SKY ---
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#030611');
        gradient.addColorStop(0.3, '#060B1A');
        gradient.addColorStop(0.65, '#090F24');
        gradient.addColorStop(1, '#050814');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Luminous Ethereal Nebulas
        const nebula1 = ctx.createRadialGradient(
          width * 0.2, height * 0.18, 10,
          width * 0.2, height * 0.18, width * 0.55
        );
        nebula1.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        nebula1.addColorStop(0.5, 'rgba(99, 102, 241, 0.04)');
        nebula1.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, width, height);

        const nebula2 = ctx.createRadialGradient(
          width * 0.82, height * 0.5, 20,
          width * 0.82, height * 0.5, width * 0.6
        );
        nebula2.addColorStop(0, 'rgba(168, 85, 247, 0.06)');
        nebula2.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
        nebula2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, width, height);

        // Render Stars
        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          star.phase += star.twinkleSpeed;
          const currentAlpha = star.baseAlpha + Math.sin(star.phase) * 0.35;
          const safeAlpha = Math.max(0.12, Math.min(1, currentAlpha));

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = safeAlpha;
          ctx.fill();

          if (star.radius > 1.15 && safeAlpha > 0.55) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius * 2.4, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = safeAlpha * 0.22;
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // Meteors
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

          const progress = m.life / m.maxLife;
          if (progress < 0.25) {
            m.alpha = (progress / 0.25) * 0.88;
          } else {
            m.alpha = (1 - (progress - 0.25) / 0.75) * 0.88;
          }

          if (m.life >= m.maxLife || m.x > width + 100 || m.y > height + 100) {
            meteors.splice(i, 1);
            continue;
          }

          const tailX = m.x - Math.cos(m.angle) * m.length;
          const tailY = m.y - Math.sin(m.angle) * m.length;

          const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          meteorGrad.addColorStop(0.65, `rgba(186, 230, 253, ${m.alpha * 0.6})`);
          meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.9, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = m.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        // --- LIGHT THEME DAYLIGHT AZURE SKY WITH DRIFTING CLOUDS ---
        const daylightGrad = ctx.createLinearGradient(0, 0, 0, height);
        daylightGrad.addColorStop(0, '#E0F2FE'); // Soft airy sky blue
        daylightGrad.addColorStop(0.35, '#EBF8FF');
        daylightGrad.addColorStop(0.7, '#F1F5F9');
        daylightGrad.addColorStop(1, '#F8FAFC');
        ctx.fillStyle = daylightGrad;
        ctx.fillRect(0, 0, width, height);

        // Gentle Sun Glow in top corner
        const sunGlow = ctx.createRadialGradient(
          width * 0.15, height * 0.08, 20,
          width * 0.15, height * 0.08, width * 0.4
        );
        sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
        sunGlow.addColorStop(0.4, 'rgba(253, 230, 138, 0.15)');
        sunGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, width, height);

        // Move and render soft fluffy clouds
        for (let i = 0; i < clouds.length; i++) {
          const cloud = clouds[i];
          cloud.x += cloud.speed;

          // Wrap around seamlessly when cloud drifts off screen
          if (cloud.x - 250 * cloud.scale > width) {
            cloud.x = -250 * cloud.scale;
            cloud.y = Math.random() * (height * 0.85) + 30;
          }

          // Draw Cloud with soft multi-layer shadow and puff circles
          ctx.save();
          ctx.globalAlpha = cloud.opacity;

          for (const puff of cloud.puffs) {
            const px = cloud.x + puff.offsetX;
            const py = cloud.y + puff.offsetY;

            // Soft radial shadow/lighting for 3D puff volume
            const puffGrad = ctx.createRadialGradient(
              px - puff.radius * 0.25, py - puff.radius * 0.3, puff.radius * 0.1,
              px, py, puff.radius
            );
            puffGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            puffGrad.addColorStop(0.75, 'rgba(248, 250, 252, 0.82)');
            puffGrad.addColorStop(1, 'rgba(224, 242, 254, 0.45)');

            ctx.beginPath();
            ctx.arc(px, py, puff.radius, 0, Math.PI * 2);
            ctx.fillStyle = puffGrad;
            ctx.fill();
          }

          ctx.restore();
        }
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
        opacity: 1,
      }}
      aria-hidden="true"
    />
  );
};
