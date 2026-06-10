import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Eye, Coffee, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/use-toast';
import { getMyBrews, deleteBrewLog } from '@/api/db-services';
import { BREW_TYPES } from '@/lib/brewMeta';
import { useI18n } from '@/lib/I18nContext';

const mapBackendToFrontend = (cloudBrews) => cloudBrews.map(brew => ({
  id: brew.id,
  name: brew.basics?.beanName || 'Unknown Brew',
  type: brew.basics?.roaster || 'pourover',
  method: brew.parameters?.method || 'V60',
  brew_date: brew.createdAt ? brew.createdAt.toDate().toISOString() : new Date().toISOString(),
  rating: brew.review?.rating || 0,
  image_url: brew.imageUrl || null
}));

export default function Records() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    const fetchMyRecords = async () => {
      setLoading(true);
      try {
        const myData = await getMyBrews();
        if (isMounted) setBrews(mapBackendToFrontend(myData));
      } catch (error) {
        toast({ variant: 'destructive', description: "Failed to sync with cloud." });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMyRecords();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (brewId) => {
    if (!window.confirm("⚠️ Are you sure you want to permanently delete this brew?")) return;
    setDeletingId(brewId);
    try {
      const result = await deleteBrewLog(brewId);
      if (result.success) {
        setBrews(prev => prev.filter(brew => brew.id !== brewId));
        toast({ description: "🗑️ Record deleted." });
      } else throw new Error(result.errorMessage);
    } catch (error) {
      toast({ variant: 'destructive', description: "Delete failed: " + error.message });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBrews = brews.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || b.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-playfair text-3xl font-bold mb-6">{t('records.title')}</h1>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('records.searchPlaceholder')} className="w-full pl-9 pr-4 py-2 border rounded-xl" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-xl px-4 py-2">
                <option value="all">{t('records.allTypes')}</option>
                {BREW_TYPES.map((type) => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)
                    : filteredBrews.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                          <Coffee size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground mb-4">{brews.length === 0 ? t('dashboard.noBrews') : t('records.noBrews')}</p>
                          {brews.length === 0 && <button onClick={() => navigate('/add-brew')} className="px-6 py-2 bg-brew-green text-white rounded-lg">{t('dashboard.addFirstBrew')}</button>}
                        </motion.div>
                    ) : filteredBrews.map((brew) => (
                        <motion.div key={brew.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col">
                          <div className="h-32 bg-muted flex justify-center items-center relative overflow-hidden">
                            {brew.image_url ? <img src={brew.image_url} className="w-full h-full object-cover" /> : <Coffee className="text-muted-foreground/20 w-16 h-16" />}
                          </div>
                          <div className="p-4 flex-grow flex flex-col">
                            <h3 className="font-bold text-lg mb-1">{brew.name}</h3>
                            <p className="text-xs text-muted-foreground mb-3">{brew.method} • {format(new Date(brew.brew_date), 'MMM d, yyyy')}</p>
                            <div className="mb-4"><StarRating value={brew.rating} readonly size={16} /></div>
                            <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                              <button onClick={() => navigate(`/brew/${brew.id}`)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"><Eye size={16} /> {t('common.viewDetails')}</button>
                              <button onClick={() => handleDelete(brew.id)} disabled={deletingId === brew.id} className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50">
                                {deletingId === brew.id ? <span className="animate-pulse">⏳</span> : <Trash2 size={16} />}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                    ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </div>
  );
}