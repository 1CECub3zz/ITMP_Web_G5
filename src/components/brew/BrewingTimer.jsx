import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, X, Volume2, VolumeX } from 'lucide-react';
import RippleButton from '@/components/ui/RippleButton';

const PRESETS = [
  { label: 'French Press', method: 'French Press', seconds: 240, emoji: '☕', color: 'bg-amber-50 border-amber-200' },
  { label: 'Pour Over', method: 'Pour Over', seconds: 180, emoji: '🫗', color: 'bg-green-50 border-green-200' },
  { label: 'Cold Brew', method: 'Cold Brew', seconds: 60, emoji: '🧊', color: 'bg-blue-50 border-blue-200', note: '(demo: 60s)' },
  { label: 'Espresso', method: 'Espresso', seconds: 28, emoji: '⚡', color: 'bg-red-50 border-red-200' },
  { label: 'Steep / Tea', method: 'Steep', seconds: 180, emoji: '🍵', color: 'bg-teal-50 border-teal-200' },
  { label: 'Whisk / Matcha', method: 'Whisk', seconds: 45, emoji: '🍃', color: 'bg-lime-50 border-lime-200' },
];

function beep(ctx, freq = 880, duration = 0.3, gain = 0.4) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
}

function playDoneSound(ctx) {
  if (!ctx) return;
  [880, 1100, 1320].forEach((f, i) => setTimeout(() => beep(ctx, f, 0.4, 0.5), i * 180));
}

export default function BrewingTimer({ selectedMethod, onClose }) {
  const [preset, setPreset] = useState(() => PRESETS.find(p => p.method === selectedMethod) || PRESETS[0]);
  const [custom, setCustom] = useState('');
  const [total, setTotal] = useState(preset.seconds);
  const [remaining, setRemaining] = useState(preset.seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef(null);
  const audioCtx = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  };

  useEffect(() => {
    const found = PRESETS.find(p => p.method === selectedMethod);
    if (found) selectPreset(found);
  }, [selectedMethod]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          if (!muted) playDoneSound(getAudioCtx());
          return 0;
        }
        if ((prev - 1) <= 10 && !muted) beep(getAudioCtx(), 660, 0.1, 0.2);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, muted]);

  const selectPreset = (p) => {
    clearInterval(intervalRef.current);
    setPreset(p); setTotal(p.seconds); setRemaining(p.seconds);
    setRunning(false); setDone(false); setCustom('');
  };

  const applyCustom = () => {
    const secs = Math.max(5, Math.min(3600, Number(custom) * 60 || 0));
    if (!secs) return;
    clearInterval(intervalRef.current);
    setTotal(secs); setRemaining(secs); setRunning(false); setDone(false);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRemaining(total); setRunning(false); setDone(false);
  };

  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const r = 52;
  const circ = 2 * Math.PI * r;
  const stroke = circ - (pct / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl shadow-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-brew-green" />
          <h3 className="font-bold text-sm">Brewing Timer</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={15} /></button>}
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => selectPreset(p)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border text-xs font-medium transition-all ${
              preset.label === p.label ? 'bg-brew-green text-white border-brew-green shadow-sm' : 'bg-muted/40 border-border hover:bg-muted'
            }`}
          >
            <span className="text-base">{p.emoji}</span>
            <span className="leading-tight text-center">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Custom time */}
      <div className="flex gap-2 mb-5">
        <input
          type="number"
          min="1" max="60"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Custom (min)"
          className="flex-1 border border-input bg-background rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brew-green"
        />
        <button onClick={applyCustom} className="px-3 py-1.5 bg-secondary border border-border rounded-xl text-xs font-medium hover:bg-muted transition-colors">Set</button>
      </div>

      {/* Circle timer */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative">
          <svg width="130" height="130" className="-rotate-90">
            <circle cx="65" cy="65" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <motion.circle
              cx="65" cy="65" r={r} fill="none"
              stroke={done ? '#22c55e' : running ? 'hsl(var(--brew-green))' : 'hsl(var(--muted-foreground))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={stroke}
              transition={{ duration: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                  <p className="text-3xl">✅</p>
                  <p className="text-xs font-semibold text-brew-green mt-1">Done!</p>
                </motion.div>
              ) : (
                <motion.div key="time" className="text-center">
                  <p className="font-playfair text-3xl font-bold">{mins}:{secs}</p>
                  <p className="text-xs text-muted-foreground">{preset.label}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={reset} className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
          <RotateCcw size={16} className="text-muted-foreground" />
        </button>
        <RippleButton
          onClick={() => { if (done) reset(); else setRunning(!running); }}
          className="px-8 py-2.5 flex items-center gap-2"
        >
          {done ? <><RotateCcw size={15} /> Restart</> : running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
        </RippleButton>
      </div>
    </motion.div>
  );
}