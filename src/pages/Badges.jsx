import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/localClient';
import { useAuth } from '@/lib/AuthContext';
import { getEarnedBadges, BADGES } from '@/lib/badges';
import Navbar from '@/components/layout/Navbar';
import { Award } from 'lucide-react';

const CATEGORIES = [
  { id: 'milestone', label: '🏆 Milestones' },
  { id: 'variety', label: '🎨 Variety' },
  { id: 'rating', label: '⭐ Rating' },
  { id: 'engagement', label: '💬 Engagement' },
];

export default function Badges() {
  const { user } = useAuth();
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.Brew.list('-created_date', 200).then(b => { setBrews(b); setLoading(false); });
  }, []);

  const earned = getEarnedBadges(brews);
  const earnedIds = new Set(earned.map(b => b.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brew-green/10 flex items-center justify-center">
              <Award size={20} className="text-brew-green" />
            </div>
            <div>
              <h1 className="font-playfair text-3xl font-bold">Brewing Badges</h1>
              <p className="text-muted-foreground text-sm">Earn achievements as you brew</p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Your Progress</p>
              <span className="text-sm font-bold text-brew-green">{earned.length} / {BADGES.length}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(earned.length / BADGES.length) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-brew-green rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {BADGES.length - earned.length} badge{BADGES.length - earned.length !== 1 ? 's' : ''} remaining — keep brewing!
            </p>
          </div>

          {/* Per category */}
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : CATEGORIES.map(cat => {
            const catBadges = BADGES.filter(b => b.category === cat.id);
            const catEarned = catBadges.filter(b => earnedIds.has(b.id));
            return (
              <div key={cat.id} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-lg">{cat.label}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {catEarned.length}/{catBadges.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {catBadges.map((badge, i) => {
                    const isEarned = earnedIds.has(badge.id);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all cursor-default ${
                          isEarned
                            ? 'bg-brew-green/10 border-brew-green/40 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                            : 'bg-muted/30 border-border opacity-50 grayscale'
                        }`}
                      >
                        {isEarned && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brew-green rounded-full flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold">✓</span>
                          </div>
                        )}
                        <span className="text-2xl">{badge.emoji}</span>
                        <p className="text-xs font-semibold leading-tight">{badge.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
