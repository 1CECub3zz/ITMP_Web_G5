import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trophy, Users, Coffee, TrendingUp, Award, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/AuthContext';
import { getEarnedBadges } from '@/lib/badges';
import { useI18n } from '@/lib/I18nContext';

// 💥 引入真实 API
import { getMyBrews } from '@/api/db-services';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalBrews: 0,
    avgRating: 0,
    earnedBadges: 0,
    recentBrews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // 💥 核心云端计算
        const myCloudBrews = await getMyBrews();

        if (!isMounted) return;

        const total = myCloudBrews.length;
        const avg = total > 0
            ? (myCloudBrews.reduce((acc, brew) => acc + (brew.review?.rating || 0), 0) / total).toFixed(1)
            : 0;

        // 映射供勋章系统计算
        const mappedForBadges = myCloudBrews.map(b => ({
          type: b.basics?.roaster || 'pourover',
          method: b.parameters?.method || 'V60',
          rating: b.review?.rating || 0
        }));

        setStats({
          totalBrews: total,
          avgRating: avg,
          earnedBadges: getEarnedBadges(mappedForBadges).length,
          recentBrews: myCloudBrews.slice(0, 3) // 取最近3条
        });
      } catch (error) {
        console.error("Dashboard cloud sync failed:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { isMounted = false; };
  }, [user]);

  const statCards = [
    { label: t('dashboard.totalBrews'), value: stats.totalBrews.toString(), icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: t('dashboard.avgRating'), value: stats.avgRating.toString(), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: t('dashboard.badgesEarned'), value: stats.earnedBadges.toString(), icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: t('dashboard.timeBrewing'), value: `${stats.totalBrews * 3}m`, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold">{t('dashboard.welcome')}, {user?.full_name?.split(' ')[0]}</h1>
              <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
            </div>
            <button onClick={() => navigate('/add-brew')} className="bg-brew-green hover:bg-brew-green/90 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
              <Plus size={20} /> {t('dashboard.logNewBrew')}
            </button>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loading ? '-' : stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="md:col-span-2 space-y-6">
              <h2 className="font-playfair text-xl font-bold">{t('dashboard.quickActions')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/records" className="group p-6 bg-card border border-border rounded-2xl hover:border-brew-green/50 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{t('dashboard.myRecords')}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.myRecordsDesc')}</p>
                </Link>
                <Link to="/community" className="group p-6 bg-card border border-border rounded-2xl hover:border-brew-green/50 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{t('dashboard.community')}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.communityDesc')}</p>
                </Link>
                <Link to="/badges" className="group p-6 bg-card border border-border rounded-2xl hover:border-brew-green/50 hover:shadow-md transition-all sm:col-span-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Trophy size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{t('dashboard.achievements')}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.achievementsDesc')}</p>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
  );
}