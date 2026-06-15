import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trophy, Users, Coffee, TrendingUp, Award, Clock, ChevronRight, Star, Flame } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/AuthContext';
import { getEarnedBadges, BADGES } from '@/lib/badges';
import { useI18n } from '@/lib/I18nContext';
import { getMyBrews } from '@/api/db-services';

function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 6) return '🌙';
  if (h < 12) return '☀️';
  if (h < 17) return '☕';
  return '🌆';
}

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? 'text-brew-gold fill-brew-gold' : 'text-border'}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalBrews: 0,
    avgRating: 0,
    earnedBadges: 0,
    recentBrews: [],
    topMethod: '-',
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      try {
        const brews = await getMyBrews();
        if (!alive) return;

        const total = brews.length;
        const avg =
          total > 0
            ? (
                brews.reduce((a, b) => a + (b.review?.rating || 0), 0) / total
              ).toFixed(1)
            : 0;

        const mapped = brews.map(b => ({
          method: b.parameters?.method || '',
          rating: b.review?.rating || 0,
          createdAt: b.createdAt || null,
        }));

        // Top method
        const methodCounts = {};
        mapped.forEach(b => {
          if (b.method) methodCounts[b.method] = (methodCounts[b.method] || 0) + 1;
        });
        const topMethod = Object.keys(methodCounts).sort(
          (a, b) => methodCounts[b] - methodCounts[a],
        )[0] || '-';

        // Brew streak (consecutive days)
        let streak = 0;
        if (brews.length > 0) {
          const dates = brews
            .map(b => {
              try {
                const d = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return d.toDateString();
              } catch { return null; }
            })
            .filter(Boolean);
          const unique = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
          streak = 1;
          for (let i = 1; i < unique.length; i++) {
            const diff = (new Date(unique[i - 1]) - new Date(unique[i])) / 86400000;
            if (diff <= 1.5) streak++;
            else break;
          }
        }

        setStats({
          totalBrews: total,
          avgRating: avg,
          earnedBadges: getEarnedBadges(mapped).length,
          recentBrews: brews.slice(0, 4),
          topMethod,
          streak,
        });
      } catch (e) {
        console.error('Dashboard sync failed:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const statCards = [
    { label: t('dashboard.totalBrews'), value: stats.totalBrews, icon: Coffee, color: 'text-blue-500', bgIcon: 'bg-blue-500/10 dark:bg-blue-500/20' },
    { label: t('dashboard.avgRating'), value: stats.avgRating, icon: TrendingUp, color: 'text-emerald-500', bgIcon: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
    { label: t('dashboard.badgesEarned'), value: `${stats.earnedBadges}/${BADGES.length}`, icon: Award, color: 'text-amber-500', bgIcon: 'bg-amber-500/10 dark:bg-amber-500/20' },
    { label: 'Streak', value: `${stats.streak}d`, icon: Flame, color: 'text-orange-500', bgIcon: 'bg-orange-500/10 dark:bg-orange-500/20' },
  ];

  const badgeProgress = BADGES.length > 0 ? Math.round((stats.earnedBadges / BADGES.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-page-main">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <p className="text-muted-foreground text-sm mb-1">
              {getGreetingEmoji()} {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-playfair text-3xl md:text-4xl font-bold">
              {t('dashboard.welcome')}, {user?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/add-brew')}
            className="bg-brew-green hover:bg-brew-green/90 text-white px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brew-green/25"
          >
            <Plus size={20} /> {t('dashboard.logNewBrew')}
          </motion.button>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card bg-card/50 dark:bg-card/30 border border-border/50 p-5 rounded-3xl relative overflow-hidden group cursor-default"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.bgIcon} ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
              </div>
              <p className="text-3xl font-black font-playfair tracking-tight">
                {loading ? <span className="inline-block w-12 h-8 bg-muted/50 rounded animate-pulse" /> : stat.value}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <h2 className="font-playfair text-xl font-bold mb-4">{t('dashboard.quickActions')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { to: '/records', icon: BookOpen, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-500/10 dark:bg-blue-500/20', title: t('dashboard.myRecords'), desc: t('dashboard.myRecordsDesc') },
                  { to: '/community', icon: Users, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', title: t('dashboard.community'), desc: t('dashboard.communityDesc') },
                ].map((card) => (
                  <Link
                    key={card.to}
                    to={card.to}
                    className="group p-5 glass-card bg-card/50 dark:bg-card/30 border border-border/50 rounded-3xl hover:border-brew-green/40 hover:shadow-xl hover:shadow-brew-green/5 transition-all"
                  >
                    <div className={`w-12 h-12 ${card.iconBg} ${card.iconColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <card.icon size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Recent Brews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-xl font-bold">Recent Brews</h2>
                <Link to="/records" className="text-sm text-brew-green font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-2">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-card/50 dark:bg-card/30 border border-border/30 rounded-2xl animate-pulse" />
                  ))
                ) : stats.recentBrews.length === 0 ? (
                  <div className="text-center py-8 glass-card bg-card/50 dark:bg-card/30 border border-border/50 rounded-3xl">
                    <Coffee size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">No brews yet. Start your journey!</p>
                  </div>
                ) : (
                  stats.recentBrews.map((brew, i) => (
                    <motion.div
                      key={brew.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      <Link
                        to={`/brew/${brew.id}`}
                        className="flex items-center gap-4 p-4 glass-card bg-card/50 dark:bg-card/30 border border-border/40 rounded-2xl hover:border-brew-green/30 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brew-green/10 dark:bg-brew-green/20 flex items-center justify-center text-brew-green shrink-0">
                          <Coffee size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {brew.parameters?.method || brew.parameters?.type || 'Brew'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {brew.parameters?.type || '-'}
                            {brew.parameters?.actualWeightGrams ? ` · ${brew.parameters.actualWeightGrams}g` : ''}
                          </p>
                        </div>
                        {brew.review?.rating > 0 && (
                          <StarDisplay rating={brew.review.rating} />
                        )}
                        <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-brew-green transition-colors shrink-0" />
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right column — Achievements summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Badge progress card */}
            <Link
              to="/badges"
              className="block glass-card bg-card/50 dark:bg-card/30 border border-border/50 rounded-3xl p-6 hover:border-brew-gold/40 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-16 h-16 shrink-0">
                  {/* Progress ring */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke="hsl(var(--brew-gold))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - badgeProgress / 100)}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy size={20} className="text-brew-gold" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('dashboard.achievements')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.earnedBadges}/{BADGES.length} unlocked
                  </p>
                </div>
                <ChevronRight size={18} className="ml-auto text-muted-foreground/50 group-hover:text-brew-gold transition-colors" />
              </div>
              {/* Badge preview */}
              <div className="flex gap-2 flex-wrap">
                {BADGES.slice(0, 6).map(b => {
                  const isEarned = stats.earnedBadges > 0; // Simplified check
                  return (
                    <div
                      key={b.id}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
                        isEarned
                          ? 'bg-brew-gold/10 border-brew-gold/30'
                          : 'bg-muted/30 border-border/30 grayscale opacity-50'
                      }`}
                    >
                      {b.icon}
                    </div>
                  );
                })}
              </div>
            </Link>

            {/* Favorite method card */}
            <div className="glass-card bg-card/50 dark:bg-card/30 border border-border/50 rounded-3xl p-6">
              <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-3">Top Method</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 flex items-center justify-center">
                  <Coffee size={20} />
                </div>
                <p className="font-playfair text-2xl font-bold">{loading ? '-' : stats.topMethod}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}