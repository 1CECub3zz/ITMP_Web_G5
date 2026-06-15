import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getEarnedBadges, BADGES } from '@/lib/badges';
import Navbar from '@/components/layout/Navbar';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { useI18n } from '@/lib/I18nContext';
import { getMyBrews } from '@/api/db-services';

export default function BadgesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'earned' | 'locked'

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      try {
        const cloudBrews = await getMyBrews();
        const mapped = cloudBrews.map(brew => ({
          method: brew.parameters?.method || '',
          rating: brew.review?.rating || 0,
          createdAt: brew.createdAt || null,
        }));
        if (alive) setEarned(getEarnedBadges(mapped));
      } catch (e) {
        console.error('Badge fetch error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const earnedCount = earned.length;
  const totalCount = BADGES.length;
  const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Filtered badges
  const filteredBadges =
    filter === 'earned'
      ? BADGES.filter(b => earned.includes(b.id))
      : filter === 'locked'
        ? BADGES.filter(b => !earned.includes(b.id))
        : BADGES;

  const filters = [
    { key: 'all', label: `All (${totalCount})` },
    { key: 'earned', label: `Earned (${earnedCount})` },
    { key: 'locked', label: `Locked (${totalCount - earnedCount})` },
  ];

  return (
    <div className="min-h-screen bg-page-main flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-brew-green mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> {t('common.back') || 'Back'}
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brew-gold/10 dark:bg-brew-gold/20 mb-4">
              <Trophy size={32} className="text-brew-gold" />
            </div>
            <h1 className="font-playfair text-4xl font-bold mb-2">
              {t('badges.title') || 'My Achievements'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              {t('badges.subtitle') || 'Unlock badges by logging your coffee journey.'}
            </p>

            {/* Progress bar */}
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between text-sm font-medium mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-brew-gold font-bold">{pct}%</span>
              </div>
              <div className="h-3 bg-muted/50 dark:bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-brew-gold to-amber-400 rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {earnedCount} of {totalCount} badges unlocked
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-brew-green text-white shadow-md shadow-brew-green/20'
                    : 'bg-card/50 dark:bg-card/30 text-muted-foreground hover:bg-muted/60 border border-border/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Badge grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-36 bg-card/40 dark:bg-card/20 border border-border/30 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="text-center py-16">
              <Lock size={40} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No badges in this category yet.</p>
            </div>
          ) : (
            <BadgeGrid badges={filteredBadges} earnedIds={earned} />
          )}

          {/* Motivation footer */}
          {!loading && earnedCount < totalCount && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-10 text-center glass-card bg-card/40 dark:bg-card/20 border border-border/40 rounded-3xl p-6"
            >
              <Sparkles size={20} className="mx-auto mb-2 text-brew-gold" />
              <p className="text-sm text-muted-foreground">
                Keep brewing to unlock {totalCount - earnedCount} more badge{totalCount - earnedCount !== 1 ? 's' : ''}!
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}