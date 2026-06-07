import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Eye, MessageSquare, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';

import { getTopRatedBrews, searchCommunityBrews } from '@/api/db-services'; 

import { BREW_PLACEHOLDER_ICONS, BREW_TYPES } from '@/lib/brewMeta';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/I18nContext';

const PAGE_SIZE = 6;

const mapBackendToFrontend = (cloudBrews) => {
  return cloudBrews.map(brew => ({
    id: brew.id,
    name: brew.basics?.beanName || 'Unknown Brew',
    owner_name: brew.authorName || 'Community Brewer',
    type: brew.basics?.roaster || 'pourover', 
    method: brew.parameters?.method || 'V60',
    brew_date: brew.createdAt ? brew.createdAt.toDate().toISOString() : new Date().toISOString(),
    rating: brew.review?.rating || 0,
    image_url: brew.imageUrl || null,
    commentCount: brew.metrics?.commentCount || 0 
  }));
};

export default function CommunityRecipes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const fetchCloudData = async () => {
      setLoading(true);
      try {
        let fetchedBrews = [];
        
        if (!search.trim() && typeFilter === 'all') {
           fetchedBrews = await getTopRatedBrews();
        } else {
          
           fetchedBrews = await searchCommunityBrews(search, typeFilter, 0);
        }

        if (!isMounted) return;

        const othersBrews = fetchedBrews.filter(brew => brew.authorUid !== user?.uid && brew.authorEmail !== user?.email);

        setBrews(mapBackendToFrontend(othersBrews));
      } catch (error) {
        console.error("❌ Failed to fetch community recipes from Cloud:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchCloudData();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [user?.uid, user?.email, search, typeFilter]);

  const totalPages = Math.ceil(brews.length / PAGE_SIZE);
  const paginatedBrews = brews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl font-bold mb-1">{t('community.title')}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t('community.subtitle')}</p>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t('community.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-input bg-card rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brew-green"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(1);
              }}
              className="border border-input bg-card rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brew-green"
            >
              <option value="all">{t('records.allTypes')}</option>
              {BREW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>{t('community.recipeCount', { count: brews.length })}</span>
          </div>

          <div className="border-2 border-primary/20 rounded-2xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">{t('records.beverage')}</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">{t('common.owner')}</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">{t('records.type')}</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">{t('records.method')}</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">{t('records.date')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('reviews.title')}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t('records.actions')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {loading ? (
                    [...Array(4)].map((_, index) => (
                      <tr key={index} className="border-b border-border">
                        <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : paginatedBrews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="space-y-2">
                          <p>{t('community.noRecipes')}</p>
                          <p className="text-xs">{t('community.emptyHint')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedBrews.map((brew, index) => (
                    <motion.tr
                      key={brew.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                            {brew.image_url ? (
                              <img src={brew.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span>{BREW_PLACEHOLDER_ICONS[brew.type] || '☕'}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{brew.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{t('community.sharedBy', { name: brew.owner_name })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{brew.owner_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t(`types.${brew.type}`)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{brew.method ? t(`methods.${brew.method}`) : '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {format(new Date(brew.brew_date), 'd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StarRating value={brew.rating || 0} readonly size={14} />
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare size={12} /> {brew.commentCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => navigate(`/brew/${brew.id}`, { state: { backTo: '/community', backLabel: t('brewDetail.backToCommunity') } })}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-brew-green"
                          >
                            <Eye size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>{t('records.showing', { start: (page - 1) * PAGE_SIZE + 1, end: Math.min(page * PAGE_SIZE, brews.length), total: brews.length })}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button key={index} onClick={() => setPage(index + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === index + 1 ? 'bg-brew-green text-white' : 'hover:bg-muted'}`}>
                    {index + 1}
                  </button>
                ))}
                <button onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
