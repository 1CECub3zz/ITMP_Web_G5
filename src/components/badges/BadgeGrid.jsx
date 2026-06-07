import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function BadgeGrid({ badges = [], earnedIds = [] }) {

  // 💥 终极防御：如果数据是 undefined 或者不是数组，立刻拦截，绝不执行 map！
  if (!badges || !Array.isArray(badges) || badges.length === 0) {
    return (
        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <span className="text-3xl block mb-2">🏆</span>
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
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                      isEarned
                          ? 'border-brew-green bg-brew-green/5 shadow-sm'
                          : 'border-border bg-card opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                  }`}
              >
                {isEarned && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-brew-green text-white rounded-full flex items-center justify-center shadow-md z-10"
                    >
                      <Check size={14} strokeWidth={3} />
                    </motion.div>
                )}

                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-bold text-center text-sm mb-1 text-foreground">{badge.name}</h3>
                <p className="text-xs text-center text-muted-foreground leading-tight">{badge.description}</p>
              </motion.div>
          );
        })}
      </div>
  );
}