import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare, Search, Coffee } from 'lucide-react';
import Masonry from 'react-masonry-css';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import { getTopRatedBrews, searchCommunityBrews } from '@/api/db-services';
import { BREW_TYPES } from '@/lib/brewMeta';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/I18nContext';

const PAGE_SIZE = 6;

const mapBackendToFrontend = (cloudBrews) => cloudBrews.map(brew => ({
  id: brew.id, name: brew.basics?.beanName || 'Unknown', owner_name: brew.authorName || 'Community Brewer',
  type: brew.basics?.roaster || 'pourover', method: brew.parameters?.method || 'V60',
  brew_date: brew.createdAt ? brew.createdAt.toDate().toISOString() : new Date().toISOString(),
  rating: brew.review?.rating || 0, image_url: brew.imageUrl || null, commentCount: brew.metrics?.commentCount || 0
}));

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
        let fetchedBrews = (!search.trim() && typeFilter === 'all')
          ? await getTopRatedBrews()
          : await searchCommunityBrews(search, typeFilter);

        if (!isMounted) return;
        const othersBrews = fetchedBrews.filter(b => b.authorUid !== user?.uid);
        setBrews(mapBackendToFrontend(othersBrews));
      } catch (error) { console.error(error); } finally { if (isMounted) setLoading(false); }
    };

    const delayDebounceFn = setTimeout(() => fetchCloudData(), 400);
    return () => { isMounted = false; clearTimeout(delayDebounceFn); };
  }, [user?.uid, search, typeFilter]);

  const totalPages = Math.ceil(brews.length / PAGE_SIZE) || 1;
  const paginatedBrews = brews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl font-bold mb-6">{t('community.title')}</h1>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('community.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 border rounded-xl" />
            </div>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="border rounded-xl px-4 py-2">
              <option value="all">{t('community.allTypes')}</option>
              {BREW_TYPES.map((type) => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brew-green/30 border-t-brew-green rounded-full animate-spin"></div>
            </div>
          ) : paginatedBrews.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border-2 border-border/50 border-dashed">
              <Coffee size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">{t('community.noRecipes')}</p>
              <p className="text-sm">{t('community.emptyHint')}</p>
            </div>
          ) : (
            <Masonry
              breakpointCols={{ default: 3, 1100: 3, 700: 2, 500: 1 }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {paginatedBrews.map((brew, index) => (
                <motion.div
                  key={brew.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/brew/${brew.id}`)}
                  className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  {brew.image_url ? (
                    <div className="aspect-[4/5] w-full overflow-hidden bg-muted relative">
                      <img src={brew.image_url} alt={brew.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-[4/5] w-full bg-brew-green/10 flex items-center justify-center relative overflow-hidden">
                      <Coffee size={64} className="text-brew-green/20" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-playfair text-xl font-bold leading-tight line-clamp-2 group-hover:text-brew-green transition-colors">{brew.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <StarRating value={brew.rating} readonly size={14} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare size={12} /> {brew.commentCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                        {brew.owner_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{brew.owner_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{brew.type} • {brew.method}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </Masonry>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end mt-4 gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 hover:bg-muted"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 hover:bg-muted"><ChevronRight size={16} /></button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}