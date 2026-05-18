import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/localClient';
import { motion } from 'framer-motion';
import { Heart, Star, MessageSquare, TrendingUp, Plus, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import BrewCard from '@/components/brew/BrewCard';
import RippleButton from '@/components/ui/RippleButton';
import BadgeGrid from '@/components/badges/BadgeGrid';
import BadgeUnlockToast from '@/components/badges/BadgeUnlockToast';
import { getEarnedBadges } from '@/lib/badges';
import { useI18n } from '@/lib/I18nContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [brews, setBrews] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState(null);
  const prevBadgeCount = useState(0);

  const loadData = async () => {
    const [b, c] = await Promise.all([
      apiClient.entities.Brew.list('-created_date', 200),
      apiClient.entities.Comment.list('-created_date', 100),
    ]);
    setBrews(b);
    setComments(c);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const totalBrews = brews.length;
  const favourites = brews.filter((b) => b.is_favourite).length;
  const rated = brews.filter((b) => b.rating);
  const avgRating = rated.length ? (rated.reduce((a, b) => a + b.rating, 0) / rated.length).toFixed(1) : '—';
  const totalComments = comments.length;
  const recentBrews = brews.slice(0, 4);
  const earnedBadges = getEarnedBadges(brews);

  const stats = [
    { label: t('dashboard.favourites'), value: favourites, icon: Heart, trend: '+2 from last week', color: 'text-red-400' },
    { label: t('dashboard.avgRating'), value: avgRating, icon: Star, trend: '+0.5 from last week', color: 'text-brew-gold', star: true },
    { label: t('dashboard.comments'), value: totalComments, icon: MessageSquare, trend: '+1 from last week', color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Welcome card */}
          <div className="bg-card border border-border rounded-2xl p-6 min-w-[220px]">
            <h2 className="font-playfair text-2xl font-bold mb-1">{t('dashboard.welcomeBack', { name: user?.full_name?.split(' ')[0] || 'Brewer' })}</h2>
            <p className="text-muted-foreground text-sm mb-4">{t('dashboard.subtitle')}</p>
            <div className="bg-secondary rounded-xl p-4 mb-4">
              <p className="font-playfair text-4xl font-bold text-brew-green">{totalBrews}</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.totalBrews')}</p>
            </div>
            <RippleButton onClick={() => navigate('/add-brew')} className="w-full flex items-center justify-center gap-2">
              <Plus size={16} /> {t('dashboard.addNew')}
            </RippleButton>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <p className="font-playfair text-4xl font-bold">
                    {stat.value}
                    {stat.star && stat.value !== '—' && <span className="text-brew-gold text-2xl ml-1">★</span>}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-brew-green-light">
                  <TrendingUp size={12} /> {stat.trend}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Badges section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-brew-green" />
              <h3 className="font-playfair text-lg font-bold">{t('dashboard.yourBadges')}</h3>
            </div>
            <button onClick={() => navigate('/badges')} className="text-sm text-brew-green font-medium hover:underline">{t('common.viewAll')} →</button>
          </div>
          <BadgeGrid earned={earnedBadges} showLocked={false} compact />
        </motion.div>

        {/* Recent Brews */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-playfair text-xl font-bold">{t('dashboard.recentBrews')}</h3>
          <button
            onClick={() => navigate('/records')}
            className="text-sm text-brew-green font-medium hover:underline flex items-center gap-1"
          >
            {t('common.viewAll')} →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : recentBrews.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">☕</p>
            <p className="font-medium">{t('dashboard.noBrews')}</p>
            <RippleButton onClick={() => navigate('/add-brew')} className="mt-4">{t('dashboard.addFirstBrew')}</RippleButton>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentBrews.map((brew, i) => (
              <motion.div key={brew.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <BrewCard brew={brew} onUpdate={loadData} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    <BadgeUnlockToast badge={newBadge} onDone={() => setNewBadge(null)} />
    </div>
  );
}
