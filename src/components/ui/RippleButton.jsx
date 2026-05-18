import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RippleButton({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    if (onClick) onClick(e);
  };

  const baseStyles = 'relative overflow-hidden font-medium rounded-xl px-5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-brew-green text-white hover:bg-brew-green-light active:scale-95 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary text-foreground border border-border hover:bg-muted active:scale-95',
    outline: 'bg-transparent border-2 border-brew-green text-brew-green hover:bg-brew-green/10 active:scale-95',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{ width: 60, height: 60, top: r.y - 30, left: r.x - 30 }}
          />
        ))}
      </AnimatePresence>
      {children}
    </button>
  );
}