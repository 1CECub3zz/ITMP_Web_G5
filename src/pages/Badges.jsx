import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { getEarnedBadges, BADGES } from '@/lib/badges';
import Navbar from '@/components/layout/Navbar';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { useI18n } from '@/lib/I18nContext';

// 💥 1. 引入真实的云端拉取 API，抛弃 apiClient
import { getMyBrews } from '@/api/db-services';

export default function BadgesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      if (!user) return;
      try {
        // 💥 2. 真实数据拉取
        const cloudBrews = await getMyBrews();

        // 💥 3. BFF 适配器：将 Firebase 数据结构映射为勋章计算函数期望的格式
        const mappedBrews = cloudBrews.map(brew => ({
          type: brew.basics?.roaster || 'pourover',
          method: brew.parameters?.method || 'V60',
          rating: brew.review?.rating || 0
        }));

        if (isMounted) {
          const earnedIds = getEarnedBadges(mappedBrews);
          setEarned(earnedIds);
        }
      } catch (error) {
        console.error('Error fetching badges from cloud:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBadges();
    return () => { isMounted = false; };
  }, [user]);

  return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-12">
              <h1 className="font-playfair text-4xl font-bold mb-4">{t('badges.title')}</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('badges.subtitle')}
              </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse text-muted-foreground">Syncing achievements with cloud...</div>
                </div>
            ) : (
                <BadgeGrid badges={BADGES} earnedIds={earned} />
            )}
          </motion.div>
        </main>
      </div>
  );
}