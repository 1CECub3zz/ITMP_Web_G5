import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/localClient';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import RippleButton from '@/components/ui/RippleButton';
import { BREW_PLACEHOLDER_IMAGES } from '@/lib/brewMeta';
import { useI18n } from '@/lib/I18nContext';

export default function Reviews() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [brews, setBrews] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [b, c] = await Promise.all([
        apiClient.entities.Brew.list('-created_date', 100),
        apiClient.entities.Comment.list('-created_date', 500),
      ]);
      setBrews(b);
      setComments(c);
      setLoading(false);
    };
    load();
  }, []);

  const handleRate = async (brewId, rating) => {
    await apiClient.entities.Brew.update(brewId, { rating });
    setBrews(prev => prev.map(b => b.id === brewId ? { ...b, rating } : b));
  };

  // Sort by rating desc
  const topRated = [...brews].filter(b => b.rating).sort((a, b) => b.rating - a.rating).slice(0, 3);

  // Sort by comment count
  const commentCounts = {};
  comments.forEach(c => { commentCounts[c.brew_id] = (commentCounts[c.brew_id] || 0) + 1; });
  const mostCommented = [...brews]
    .filter(b => commentCounts[b.id])
    .sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0))
    .slice(0, 3);

  // All brews, rated/commented first
  const reviewedBrews = [...brews].sort((a, b) => {
    const aScore = (a.rating ? 1 : 0) + (commentCounts[a.id] ? 1 : 0);
    const bScore = (b.rating ? 1 : 0) + (commentCounts[b.id] ? 1 : 0);
    return bScore - aScore;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl font-bold mb-6">{t('reviews.title')}</h1>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main list */}
            <div className="flex-1 space-y-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />
                ))
              ) : reviewedBrews.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">⭐</p>
                  <p>{t('reviews.noReviews')}</p>
                </div>
              ) : reviewedBrews.map((brew, i) => {
                const count = commentCounts[brew.id] || 0;
                const img = brew.image_url || BREW_PLACEHOLDER_IMAGES[brew.type] || BREW_PLACEHOLDER_IMAGES.Other;
                return (
                  <motion.div
                    key={brew.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-card border border-border rounded-2xl p-4 flex gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      <img src={img} alt={brew.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = BREW_PLACEHOLDER_IMAGES.Other; }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-playfair font-bold text-lg">{brew.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {brew.brew_date ? format(new Date(brew.brew_date), 'd MMM yyyy') : format(new Date(brew.created_date), 'd MMM yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{t('reviews.type')}: {t(`types.${brew.type}`)}</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={brew.rating || 0} onChange={(r) => handleRate(brew.id, r)} size={18} />
                        <span className="text-sm text-muted-foreground">({t('reviews.comments', { count })})</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <RippleButton variant="outline" onClick={() => navigate(`/brew/${brew.id}`)}>
                        {t('common.viewDetails')}
                      </RippleButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div className="lg:w-64 space-y-4">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3">{t('reviews.topRated')}</h3>
                {topRated.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('reviews.noRated')}</p>
                ) : topRated.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
                    <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                    <button onClick={() => navigate(`/brew/${b.id}`)} className="text-sm font-semibold hover:text-brew-green transition-colors text-left">{b.name}</button>
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3">{t('reviews.mostCommented')}</h3>
                {mostCommented.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('reviews.noComments')}</p>
                ) : mostCommented.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
                    <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                    <button onClick={() => navigate(`/brew/${b.id}`)} className="text-sm font-semibold hover:text-brew-green transition-colors text-left">{b.name}</button>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
