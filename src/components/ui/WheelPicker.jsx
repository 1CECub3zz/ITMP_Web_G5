import { useEffect, useState, useRef, useCallback } from 'react';

/* ──────────────────────────────────────────────────
   iOS-style Wheel Picker (scroll-snap based)
   ────────────────────────────────────────────────── */

function generateRange(min, max, step) {
  const safeMin = Math.max(0, min); // Never allow negatives
  const result = [];
  const limit = Math.min(max, safeMin + step * 500); // Cap array size
  for (let v = safeMin; v <= limit + step * 0.001; v += step) {
    result.push(Math.round(v * 1000) / 1000);
  }
  return result;
}

const ITEM_H = 40; // px per slot
const VISIBLE = 5; // show 5 items (2 above, center, 2 below)

export default function WheelPicker({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  label = '',
  className = '',
}) {
  const [options] = useState(() => generateRange(min, max, step));
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const listRef = useRef(null);
  const isUserScrolling = useRef(false);
  const scrollTimer = useRef(null);
  const mounted = useRef(false);

  const height = ITEM_H * VISIBLE; // total picker height

  // Find closest index for a given value
  const findIndex = useCallback(
    (v) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < options.length; i++) {
        const d = Math.abs(options[i] - v);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    },
    [options],
  );

  // Scroll to index (center the item)
  const scrollToIdx = useCallback(
    (idx, smooth = true) => {
      const el = listRef.current;
      if (!el) return;
      const targetTop = idx * ITEM_H;
      el.scrollTo({ top: targetTop, behavior: smooth ? 'smooth' : 'instant' });
    },
    [],
  );

  // On mount — scroll to initial value
  useEffect(() => {
    const idx = findIndex(value);
    // Use a frame delay so DOM is measured
    requestAnimationFrame(() => scrollToIdx(idx, false));
    mounted.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If external value changes (e.g. theme reset), re-scroll
  useEffect(() => {
    if (!mounted.current) return;
    if (!isUserScrolling.current) {
      const idx = findIndex(value);
      scrollToIdx(idx, true);
    }
  }, [value, findIndex, scrollToIdx]);

  // Handle scroll-snap settle → fire onChange
  const handleScroll = () => {
    isUserScrolling.current = true;
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(options.length - 1, idx));
      if (options[clamped] !== undefined) {
        onChange(options[clamped]);
      }
      isUserScrolling.current = false;
    }, 80);
  };

  // Manual typing submit
  const submitEdit = (e) => {
    if (e) e.preventDefault();
    let v = parseFloat(editVal);
    if (isNaN(v)) v = min;
    v = Math.max(Math.max(0, min), Math.min(max, v)); // Clamp & no negatives
    v = Math.round(v / step) * step;
    v = Math.round(v * 1000) / 1000;
    onChange(v);
    const idx = findIndex(v);
    scrollToIdx(idx, true);
    setIsEditing(false);
  };

  // ── Editing mode ──────────────────────────────
  if (isEditing) {
    return (
      <form
        onSubmit={submitEdit}
        className={`flex items-center gap-2 rounded-2xl border border-brew-green/40 bg-card/80 backdrop-blur-sm px-4 ${className}`}
        style={{ height: ITEM_H + 16 }}
      >
        <input
          type="number"
          step={step}
          min={Math.max(0, min)}
          max={max}
          autoFocus
          className="flex-1 bg-transparent text-center text-xl font-bold text-foreground focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={submitEdit}
        />
        {unit && (
          <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        )}
      </form>
    );
  }

  // ── Wheel mode ────────────────────────────────
  const selectedIdx = findIndex(value);

  return (
    <div className={`relative select-none ${className}`} style={{ height }}>
      {/* Label */}
      {label && (
        <div className="absolute -top-5 left-0 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </div>
      )}

      {/* Center highlight band */}
      <div
        className="absolute left-0 right-0 rounded-xl bg-brew-green/8 dark:bg-brew-green/12 border-y border-brew-green/15 dark:border-brew-green/25 pointer-events-none z-10"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />

      {/* Fade top */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none rounded-t-2xl"
        style={{
          height: ITEM_H * 2,
          background:
            'linear-gradient(to bottom, hsl(var(--background)) 20%, hsl(var(--background) / 0.6) 60%, transparent)',
        }}
      />
      {/* Fade bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none rounded-b-2xl"
        style={{
          height: ITEM_H * 2,
          background:
            'linear-gradient(to top, hsl(var(--background)) 20%, hsl(var(--background) / 0.6) 60%, transparent)',
        }}
      />

      {/* Scroll container */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide rounded-2xl border border-border/40 bg-card/30 dark:bg-card/20 backdrop-blur-sm"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Top padding — 2 empty slots */}
        <div style={{ height: ITEM_H * 2 }} />

        {options.map((opt, i) => {
          const isSel = i === selectedIdx;
          const dist = Math.abs(i - selectedIdx);
          const scale = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.75;
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : 0.3;

          return (
            <div
              key={i}
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'start',
                transform: `scale(${scale})`,
                opacity,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
              }}
              className="flex items-center justify-center cursor-pointer"
              onClick={() => {
                if (isSel) {
                  setEditVal(String(opt));
                  setIsEditing(true);
                } else {
                  scrollToIdx(i, true);
                }
              }}
            >
              <span
                className={`text-lg font-bold tabular-nums ${
                  isSel
                    ? 'text-brew-green dark:text-brew-green-light'
                    : 'text-muted-foreground'
                }`}
              >
                {opt}
              </span>
              {unit && isSel && (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          );
        })}

        {/* Bottom padding — 2 empty slots */}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}
