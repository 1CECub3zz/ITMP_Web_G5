import { motion } from 'framer-motion';
import { Check, Award } from 'lucide-react';

export default function BadgeGrid({ badges = [], earnedIds = [] }) {

  // 💥 Ultimate defense: If data is undefined or not an array, intercept immediately and never execute map!
  if (!badges || !Array.isArray(badges) || badges.length === 0) {
    return (
        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <Award size={32} className="mx-auto mb-2 opacity-50 text-brew-gold" />
          Loading achievement data...
        </div>
    );
  }

  return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge, index) => {
          const isEarned = earnedIds.includes(badge.id);

          return (
              <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`relative p-6 rounded-3xl transition-all duration-500 flex flex-col items-center justify-center overflow-hidden group ${
                      isEarned
                          ? 'glass-card bg-card/60 border border-brew-gold/30 shadow-lg shadow-brew-gold/10'
                          : 'glass-card bg-card/20 border border-border/30 opacity-60 grayscale hover:grayscale-[50%] hover:opacity-100'
                  }`}
              >
                {/* Shiny glow effect for earned badges */}
                {isEarned && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-brew-gold/5 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                )}

                {isEarned && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-br from-brew-gold to-amber-600 text-white rounded-full flex items-center justify-center shadow-md z-10"
                    >
                      <Check size={14} strokeWidth={4} />
                    </motion.div>
                )}

                <motion.div 
                  className="text-5xl mb-4 relative z-10"
                  animate={isEarned ? { 
                    rotateY: [0, 10, -10, 0],
                    transition: { repeat: Infinity, duration: 5, ease: "easeInOut" }
                  } : {}}
                >
                  {badge.icon}
                </motion.div>
                <h3 className={`font-bold text-center text-sm mb-1 z-10 ${isEarned ? 'text-brew-gold' : 'text-foreground'}`}>{badge.name}</h3>
                <p className="text-xs text-center text-muted-foreground leading-relaxed z-10">{badge.description}</p>
              </motion.div>
          );
        })}
      </div>
  );
}