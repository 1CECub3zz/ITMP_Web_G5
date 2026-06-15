import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/lib/ThemeContext';

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  AntiGravity-Style Particle System                                 ║
// ║  • Idle: particles rest in a neat grid                             ║
// ║  • Mouse moves: particles scatter outward from cursor              ║
// ║  • Mouse stops: particles gently spring back to grid               ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║                     PARAMETER TUNING GUIDE                         ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ┌─────────────────────────────────────────────────────────────────────┐
// │ GRID_SPACING                                                        │
// │ Distance between particles (px). Smaller value → denser particles;  │
// │ Larger value → sparser particles.                                   │
// │ Recommended range: 25 (very dense) ~ 50 (very sparse)               │
// └─────────────────────────────────────────────────────────────────────┘
const GRID_SPACING = 40;

// ┌─────────────────────────────────────────────────────────────────────┐
// │ DASH_LEN                                                            │
// │ Length of each confetti dash (px). Larger value → longer lines      │
// │ Recommended range: 3 (tiny dot) ~ 10 (long dash)                    │
// │                                                                     │
// │ DASH_WIDTH                                                          │
// │ Line thickness (px). Larger value → thicker lines                   │
// │ Recommended range: 1.0 (thin) ~ 3.0 (thick)                         │
// │                                                                     │
// │ BASE_ALPHA                                                          │
// │ Base transparency.                                                  │
// │ 0 = fully transparent, 1 = fully opaque                             │
// │ Recommended range: 0.3 (subtle) ~ 0.8 (vivid)                       │
// └─────────────────────────────────────────────────────────────────────┘
const DASH_LEN = 10;
const DASH_WIDTH = 3.3;
const BASE_ALPHA = 0.35;

// ┌─────────────────────────────────────────────────────────────────────┐
// │ REPEL_RADIUS                                                        │
// │ Radius of particles pushed away by mouse movement (px).             │
// │ Larger value → affects more particles;                              │
// │ Smaller value → only affects nearby particles.                      │
// │ Recommended range: 100 (small ripple) ~ 500 (massive wave)          │
// │                                                                     │
// │ REPEL_STRENGTH                                                      │
// │ Push force. Larger value → particles pushed further away.           │
// │ Recommended range: 3 (gentle) ~ 20 (explosive)                      │
// │                                                                     │
// │ REPEL_FALLOFF                                                       │
// │ Force decay rate relative to distance. 1=linear, 2=quadratic,       │
// │ 3=cubic. Larger value → strong near center but weak at edges.       │
// │ Smaller value → more uniform force across the radius.               │
// │ Recommended range: 1 (uniform push) ~ 3 (focused burst)             │
// └─────────────────────────────────────────────────────────────────────┘
const REPEL_RADIUS = 300;
const REPEL_STRENGTH = 10;
const REPEL_FALLOFF = 3;

// ┌─────────────────────────────────────────────────────────────────────┐
// │ SPRING                                                              │
// │ Speed at which particles return to grid. Larger value → faster.     │
// │ Recommended range: 0.005 (very slow/floaty) ~ 0.08 (snappy)         │
// │                                                                     │
// │ DAMPING                                                             │
// │ Velocity decay. Closer to 1 → particles slide further (high inertia)│
// │ Closer to 0 → particles stop immediately (low inertia).             │
// │ Recommended range: 0.80 (heavy/quick stop) ~ 0.96 (ice-like sliding)│
// └─────────────────────────────────────────────────────────────────────┘
const SPRING = 0.009;
const DAMPING = 0.92;

// ┌─────────────────────────────────────────────────────────────────────┐
// │                        COLOR PALETTES                               │
// │ Repeating a color increases its probability of appearing (weight).  │
// │ To switch palettes, comment out current COLORS, uncomment another.  │
// └─────────────────────────────────────────────────────────────────────┘

// 🎨 Palette 1: BrewTrack (current — coffee/green theme)
const COLORS_BREWTRACK = [
  '#2D7A4F', '#2D7A4F', '#2D7A4F',  // brew green (dominant, 3x weight)
  '#4A9D6E', '#4A9D6E',              // sage green (2x)
  '#C8A23D', '#C8A23D',              // warm gold (2x)
  '#A67B4B', '#A67B4B',              // latte brown (2x)
  '#8B5E3C',                          // espresso
  '#D4A854',                          // cream gold
  '#5B8C6A',                          // sage green
  '#4285F4',                          // blue accent
  '#7B61FF',                          // purple accent
  '#EA4335',                          // red accent
];

// 🎨 Palette 2: AntiGravity Official (blue/purple dominant)
const COLORS_ANTIGRAVITY = [
  '#4285F4', '#4285F4', '#4285F4', '#4285F4',  // Google Blue (dominant, 4x)
  '#5E97F5', '#5E97F5',                         // Light Blue (2x)
  '#7B61FF', '#7B61FF', '#7B61FF',              // Purple (3x)
  '#A78BFA',                                     // Lavender
  '#EA4335', '#EA4335',                          // Red (2x)
  '#FF6D93',                                     // Pink
  '#FBBC04', '#FBBC04',                          // Yellow (2x)
  '#F9AB00',                                     // Amber
  '#34A853',                                     // Green
  '#FF8A50',                                     // Orange
];

// 🎨 Palette 3: Dark Elegant (for dark backgrounds)
const COLORS_DARK_ELEGANT = [
  '#60A5FA', '#60A5FA', '#60A5FA',  // Sky blue (dominant, 3x)
  '#A78BFA', '#A78BFA',              // Violet (2x)
  '#F472B6', '#F472B6',              // Pink (2x)
  '#34D399',                          // Emerald
  '#FBBF24',                          // Amber
  '#FB923C',                          // Orange
  '#E879F9',                          // Fuchsia
  '#818CF8',                          // Indigo
];

// ━━━ PALETTE AUTO-SWITCHES WITH DARK MODE ━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Light mode → COLORS_BREWTRACK | Dark mode → COLORS_ANTIGRAVITY
// (Controlled by ThemeContext — no manual switching needed)

// ═══════════════════════════════════════════════════════════════════════
function createParticles(w, h, colors) {
  const particles = [];
  const cols = Math.ceil(w / GRID_SPACING) + 2;
  const rows = Math.ceil(h / GRID_SPACING) + 2;
  const ox = (w - (cols - 1) * GRID_SPACING) / 2;
  const oy = (h - (rows - 1) * GRID_SPACING) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hx = ox + c * GRID_SPACING;
      const hy = oy + r * GRID_SPACING;
      particles.push({
        homeX: hx,
        homeY: hy,
        x: hx,
        y: hy,
        vx: 0,
        vy: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
      });
    }
  }
  return particles;
}

// ═══════════════════════════════════════════════════════════════════════
export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef(null);
  const { isDark } = useTheme();

  const activeColors = isDark ? COLORS_ANTIGRAVITY : COLORS_BREWTRACK;

  const init = useCallback((w, h) => {
    particlesRef.current = createParticles(w, h, activeColors);
  }, [activeColors]);

  // Re-color particles on theme change without resetting positions
  useEffect(() => {
    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      particles[i].color = activeColors[Math.floor(Math.random() * activeColors.length)];
    }
  }, [activeColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      init(W, H);
    };
    resize();

    const onMM = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onML = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const onTM = (e) => {
      if (e.touches.length) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };
    const onTE = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMM);
    document.addEventListener('mouseleave', onML);
    window.addEventListener('touchmove', onTM, { passive: true });
    window.addEventListener('touchend', onTE);

    // ── Animation ────────────────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const onScreen = mx > -999;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // ── Repulsion from mouse (always active when on screen) ──────
        if (onScreen) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;

          if (dist < REPEL_RADIUS) {
            // Stronger force near cursor, fading with distance
            const t = 1 - dist / REPEL_RADIUS;                // 1 at center, 0 at edge
            const force = REPEL_STRENGTH * Math.pow(t, REPEL_FALLOFF);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // ── Spring back to grid home position ────────────────────────
        p.vx += (p.homeX - p.x) * SPRING;
        p.vy += (p.homeY - p.y) * SPRING;

        // ── Damping ──────────────────────────────────────────────────
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // ── Integrate ────────────────────────────────────────────────
        p.x += p.vx;
        p.y += p.vy;

        // ── Rotate dash based on displacement from home ──────────────
        const dispX = p.x - p.homeX;
        const dispY = p.y - p.homeY;
        const dispLen = Math.sqrt(dispX * dispX + dispY * dispY);
        if (dispLen > 1) {
          // Dash aligns with direction of displacement
          const targetAngle = Math.atan2(dispY, dispX);
          let diff = targetAngle - p.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          p.angle += diff * 0.12;
        }

        // ── Draw confetti dash ───────────────────────────────────────
        const halfL = DASH_LEN / 2;
        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);

        ctx.beginPath();
        ctx.moveTo(p.x - cos * halfL, p.y - sin * halfL);
        ctx.lineTo(p.x + cos * halfL, p.y + sin * halfL);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = DASH_WIDTH;
        ctx.lineCap = 'round';
        ctx.globalAlpha = BASE_ALPHA;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMM);
      document.removeEventListener('mouseleave', onML);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend', onTE);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
