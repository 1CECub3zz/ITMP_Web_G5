import { motion } from 'framer-motion';
import { BADGES } from '@/lib/badges';
import { Lock } from 'lucide-react';

export default function BadgeGrid({ earned, showLocked = true, compact = false }) {
  const earnedIds = new Set(earned.map(b => b.id));

  const display = showLocked ? BADGES : BADGES.filter(b => earnedIds.has(b.id));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earned.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            title={`${badge.label}: ${badge.description}`}
            className="w-9 h-9 rounded-full bg-brew-green/10 border-2 border-brew-green/30 flex items-center justify-center text-lg cursor-default hover:scale-110 transition-transform"
          >
            {badge.emoji}
          </motion.div>
        ))}
        {earned.length === 0 && (
          <p className="text-xs text-muted-foreground">No badges yet — keep brewing!</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {display.map((badge, i) => {
        const isEarned = earnedIds.has(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
              isEarned
                ? 'bg-brew-green/10 border-brew-green/40 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                : 'bg-muted/30 border-border opacity-50 grayscale'
            }`}
          >
            {!isEarned && (
              <div className="absolute top-1.5 right-1.5">
                <Lock size={10} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-2xl">{badge.emoji}</span>
            <p className="text-xs font-semibold leading-tight">{badge.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
            {isEarned && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-brew-green rounded-full flex items-center justify-center"
              >
                <span className="text-white text-[8px] font-bold">✓</span>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
