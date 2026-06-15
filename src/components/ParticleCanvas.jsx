import { useEffect, useRef, useCallback } from 'react';

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  🎛️  AntiGravity-Style Particle System                             ║
// ║  鼠标静止时粒子围绕鼠标动态旋转 + 排斥 + 非线性弹性回弹              ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── 粒子网格 Grid Settings ──────────────────────────────────────────
const GRID_SPACING = 35;

// ── 粒子外观 Particle Appearance ────────────────────────────────────
const DASH_LENGTH_MIN = 1;
const DASH_LENGTH_MAX = 1;
const DASH_WIDTH = 3;
const PARTICLE_OPACITY = 0.55;

// ── 鼠标排斥 Mouse Repulsion ────────────────────────────────────────
const MOUSE_RADIUS = 500;
const REPEL_STRENGTH = 1.0;

// ── 鼠标静止时的轨道旋转 Idle Orbit ─────────────────────────────────
// 当鼠标停下来时，附近粒子会持续围绕鼠标做圆形旋转
const IDLE_ORBIT_SPEED = 0.012;      // 旋转速度，推荐 0.005~0.03
const IDLE_ORBIT_RADIUS = 350;       // 轨道影响范围 (px)
const IDLE_THRESHOLD_MS = 80;        // 鼠标静止多久后开始旋转 (ms)

// ── 弹性回弹 Spring Physics ─────────────────────────────────────────
const SPRING_STIFFNESS = 0.1;
const SPRING_DAMPING = 0.8;

// ── 颜色 Colors ─────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#2D7A4F', '#2D7A4F', '#2D7A4F',
  '#4A9D6E',
  '#C8A23D', '#C8A23D',
  '#A67B4B', '#A67B4B',
  '#8B5E3C',
  '#D4A854',
  '#5B8C6A',
];

// ═══════════════════════════════════════════════════════════════════════

function createGridParticles(width, height) {
  const particles = [];
  const cols = Math.ceil(width / GRID_SPACING) + 2;
  const rows = Math.ceil(height / GRID_SPACING) + 2;
  const offsetX = (width - (cols - 1) * GRID_SPACING) / 2;
  const offsetY = (height - (rows - 1) * GRID_SPACING) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const homeX = offsetX + col * GRID_SPACING;
      const homeY = offsetY + row * GRID_SPACING;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const angle = Math.random() * Math.PI * 2;
      const len = DASH_LENGTH_MIN + Math.random() * (DASH_LENGTH_MAX - DASH_LENGTH_MIN);

      particles.push({
        homeX, homeY,
        x: homeX, y: homeY,
        vx: 0, vy: 0,
        color, angle, len,
        // 每个粒子有独立的旋转方向 (+1 或 -1)
        orbitDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
  }
  return particles;
}

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, lastMoveTime: 0 });
  const animFrameRef = useRef(null);

  const initParticles = useCallback((width, height) => {
    particlesRef.current = createGridParticles(width, height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles(width, height);
    };

    resize();

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.lastMoveTime = performance.now();
    };
    const handleMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.lastMoveTime = performance.now();
      }
    };
    const handleTouchEnd = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // ── 动画主循环 ───────────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const mouse = mouseRef.current;
      const particles = particlesRef.current;
      const mouseRadiusSq = MOUSE_RADIUS * MOUSE_RADIUS;
      const orbitRadiusSq = IDLE_ORBIT_RADIUS * IDLE_ORBIT_RADIUS;
      const now = performance.now();
      const isIdle = (now - mouse.lastMoveTime) > IDLE_THRESHOLD_MS;
      const mouseOnScreen = mouse.x > -999 && mouse.y > -999;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;

        // ── 1) 排斥力 (鼠标移动时) ────────────────────────────
        if (distSq < mouseRadiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          const nx = dx / dist;
          const ny = dy / dist;
          p.vx += nx * force * REPEL_STRENGTH * 2;
          p.vy += ny * force * REPEL_STRENGTH * 2;
        }

        // ── 2) 轨道旋转力 (鼠标静止时) ────────────────────────
        // 当鼠标不动时，附近的粒子施加切线力产生持续旋转
        if (isIdle && mouseOnScreen && distSq < orbitRadiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          // 切线方向 = 法线旋转90°
          const tx = -ny * p.orbitDir;
          const ty = nx * p.orbitDir;
          // 非线性衰减：中间距离的粒子旋转最快 (bell-curve)
          const normalizedDist = dist / IDLE_ORBIT_RADIUS;
          const bellCurve = Math.exp(-8 * (normalizedDist - 0.4) * (normalizedDist - 0.4));
          p.vx += tx * IDLE_ORBIT_SPEED * bellCurve * 6;
          p.vy += ty * IDLE_ORBIT_SPEED * bellCurve * 6;
        }

        // ── 3) 弹簧回弹 ──────────────────────────────────────
        const springDx = p.homeX - p.x;
        const springDy = p.homeY - p.y;
        p.vx += springDx * SPRING_STIFFNESS;
        p.vy += springDy * SPRING_STIFFNESS;

        // 阻尼
        p.vx *= SPRING_DAMPING;
        p.vy *= SPRING_DAMPING;

        // 更新位置
        p.x += p.vx;
        p.y += p.vy;

        // ── 绘制 ─────────────────────────────────────────────
        const halfLen = p.len / 2;
        const cosA = Math.cos(p.angle);
        const sinA = Math.sin(p.angle);

        ctx.beginPath();
        ctx.moveTo(p.x - cosA * halfLen, p.y - sinA * halfLen);
        ctx.lineTo(p.x + cosA * halfLen, p.y + sinA * halfLen);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = PARTICLE_OPACITY;
        ctx.lineWidth = DASH_WIDTH;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
