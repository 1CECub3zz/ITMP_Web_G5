import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Eye, Edit, Coffee } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/I18nContext';

import { getMyBrews, deleteBrewLog } from '@/api/db-services';
import { BREW_PLACEHOLDER_ICONS } from '@/lib/brewMeta';

const mapBackendToFrontend = (cloudBrews) => {
  return cloudBrews.map(brew => ({
    id: brew.id,
    name: brew.basics?.beanName || 'Unknown Brew',
    type: brew.basics?.roaster || 'pourover',
    method: brew.parameters?.method || 'V60',
    brew_date: brew.createdAt ? brew.createdAt.toDate().toISOString() : new Date().toISOString(),
    rating: brew.review?.rating || 0,
    image_url: brew.imageUrl || null
  }));
};

export default function Records() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  // 防止重复点击删除的锁定状态
  const [deletingId, setDeletingId] = useState(null); 

  useEffect(() => {
    let isMounted = true;
    const fetchMyRecords = async () => {
      setLoading(true);
      try {
        const myData = await getMyBrews();
        if (isMounted) {
          setBrews(mapBackendToFrontend(myData));
        }
      } catch (error) {
        console.error("❌ Failed to fetch personal records:", error);
        toast({ variant: 'destructive', description: "Failed to sync with cloud database." });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMyRecords();
    
    return () => { isMounted = false; };
  }, [toast]);

  const handleDelete = async (brewId) => {
    const isConfirmed = window.confirm("⚠️ Are you sure you want to permanently delete this brew? This action cannot be undone.");
    if (!isConfirmed) return;

    setDeletingId(brewId);
    
    try {

      const result = await deleteBrewLog(brewId);
      
      if (result.success) {

        setBrews(prev => prev.filter(brew => brew.id !== brewId));
        toast({ description: "🗑️ Record permanently deleted." });
      } else {
        throw new Error(result.errorMessage);
      }
    } catch (error) {
      toast({ variant: 'destructive', description: "Delete failed: " + error.message });
    } finally {
      setDeletingId(null); 
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl font-bold mb-6">My Brew Records</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
                ))
              ) : brews.length === 0 ? (
                <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20"
                >
                  <Coffee size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't logged any brews yet.</p>
                  <button onClick={() => navigate('/add-brew')} className="px-6 py-2 bg-brew-green text-white rounded-lg font-medium">
                    Log Your First Brew
                  </button>
                </motion.div>
              ) : (
                brews.map((brew, index) => (
                  <motion.div
                    key={brew.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col"
                  >
                    <div className="h-32 bg-muted relative overflow-hidden flex justify-center items-center">
                      {brew.image_url ? (
                        <img src={brew.image_url} alt="Brew" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl opacity-50">{BREW_PLACEHOLDER_ICONS[brew.type] || '☕'}</span>
                      )}
                    </div>

                    <div className="p-4 flex-grow flex flex-col">
                      <h3 className="font-bold text-lg mb-1">{brew.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {brew.method} • {format(new Date(brew.brew_date), 'MMM d, yyyy')}
                      </p>
                      <div className="mb-4">
                        <StarRating value={brew.rating} readonly size={16} />
                      </div>

                      <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                        <button 
                           onClick={() => navigate(`/brew/${brew.id}`)}
                           className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                        >
                          <Eye size={16} /> View
                        </button>

                        <button 
                           onClick={() => handleDelete(brew.id)}
                           disabled={deletingId === brew.id}
                           className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === brew.id ? <span className="animate-pulse">⏳</span> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
