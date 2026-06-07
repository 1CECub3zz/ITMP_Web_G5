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
            : await searchCommunityBrews(search, typeFilter, 0);

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
            <h1 className="font-playfair text-3xl font-bold mb-6">Community Recipes</h1>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search beans..." className="w-full pl-9 pr-4 py-2 border rounded-xl" />
              </div>
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="border rounded-xl px-4 py-2">
                <option value="all">All Types</option>
                {BREW_TYPES.map((type) => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
              </select>
            </div>

            <div className="border-2 border-primary/20 rounded-2xl overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">Beverage</th>
                  <th className="text-left px-4 py-3 font-semibold">Owner</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Method</th>
                  <th className="text-left px-4 py-3 font-semibold">Rating</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
                </thead>
                <tbody>
                <AnimatePresence>
                  {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-muted animate-pulse" /></td></tr>)
                      : paginatedBrews.map((brew, index) => (
                          <motion.tr key={brew.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.04 }} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                  {brew.image_url ? <img src={brew.image_url} className="w-full h-full object-cover" /> : <span>☕</span>}
                                </div>
                                <span className="font-medium">{brew.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{brew.owner_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{brew.type}</td>
                            <td className="px-4 py-3 text-muted-foreground">{brew.method}</td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><StarRating value={brew.rating} readonly size={14} /><span className="text-xs text-muted-foreground"><MessageSquare size={12} className="inline" /> {brew.commentCount}</span></div></td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => navigate(`/brew/${brew.id}`)} className="p-1.5 rounded-lg hover:bg-muted"><Eye size={16} /></button>
                            </td>
                          </motion.tr>
                      ))}
                </AnimatePresence>
                </tbody>
              </table>
            </div>

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