import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export default function BadgeUnlockToast({ badge, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!badge) return;
    // Fire confetti
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#2d6a4f', '#40916c', '#d4a373', '#ffd166'] });
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 3500);
    return () => clearTimeout(t);
  }, [badge, onDone]);

  return (
    <AnimatePresence>
      {visible && badge && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brew-green text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[280px]"
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6 }}
            className="text-4xl"
          >
            {badge.icon}
          </motion.span>
          <div>
            <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Badge Unlocked!</p>
            <p className="font-bold text-lg">{badge.name}</p>
            <p className="text-xs opacity-75">{badge.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}