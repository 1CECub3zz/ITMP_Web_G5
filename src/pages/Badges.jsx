import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      if (!user) return;
      try {
        const cloudBrews = await getMyBrews();
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
      // 💥 修复 1：将页面设置为 flex 垂直布局，确保 Navbar 永远吸顶
      <div className="min-h-screen bg-background flex flex-col">

        {/* 💥 修复 2：注入全局导航中枢！彻底打破“孤岛”，恢复丝滑切换 */}
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">

          {/* 💥 修复 3：增加原生返回按钮，提供更具掌控感的 UX 体验 */}
          <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-brew-green mb-6 transition-colors font-medium"
          >
            <ArrowLeft size={18} /> {t('common.back') || 'Back'}
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-12">
              <h1 className="font-playfair text-4xl font-bold mb-4">{t('badges.title') || 'My Achievements'}</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('badges.subtitle') || 'Unlock badges by logging your coffee journey.'}
              </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse text-muted-foreground font-medium">Syncing achievements with cloud...</div>
                </div>
            ) : (
                <BadgeGrid badges={BADGES} earnedIds={earned} />
            )}
          </motion.div>
        </main>
      </div>
  );
}