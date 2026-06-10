import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import StarRating from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { getBrewById, getCommentsForBrew, addCommentToBrew } from '@/api/db-services';
import { format } from 'date-fns';
import { useI18n } from '@/lib/I18nContext';

export default function BrewDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useI18n();

    const [brew, setBrew] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [brewData, commentsData] = await Promise.all([
                    getBrewById(id),
                    getCommentsForBrew(id)
                ]);
                if (!isMounted) return;
                if (!brewData) {
                    toast({ variant: 'destructive', description: "Brew not found." });
                    navigate('/community');
                    return;
                }
                setBrew(brewData);
                setComments(commentsData);
            } catch (error) {
                console.error("❌ Failed to fetch details:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [id, navigate, toast]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const result = await addCommentToBrew(id, newComment);
            if (result.success) {
                const optimisticComment = {
                    id: Date.now().toString(),
                    text: newComment,
                    authorName: user?.full_name || "Me",
                    createdAt: { toDate: () => new Date() }
                };
                setComments(prev => [...prev, optimisticComment]);
                setNewComment("");
                toast({ description: "💬 Comment posted!" });
            } else {
                throw new Error(result.errorMessage);
            }
        } catch (error) {
            toast({ variant: 'destructive', description: error.message });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center h-[60vh] animate-pulse font-playfair text-xl">
                    Brewing details...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft size={16} /> {t('common.back')}
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm mb-8">
                    {brew.imageUrl && (
                        <div className="w-full h-64 sm:h-80 bg-muted relative">
                            <img src={brew.imageUrl} alt="Brew" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="font-playfair text-3xl font-bold mb-2">{brew.basics?.beanName}</h1>
                                <p className="text-muted-foreground">{t('brewDetail.brewer')}: {brew.authorName || 'Community Brewer'} • {format(brew.createdAt?.toDate() || new Date(), 'MMM d, yyyy')}</p>
                            </div>
                            <StarRating value={brew.review?.rating || 0} readonly size={20} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-border my-6">
                            <div><p className="text-xs text-muted-foreground mb-1">{t('records.type')}</p><p className="font-medium capitalize">{brew.basics?.roaster ? (t(`types.${brew.basics.roaster}`) !== `types.${brew.basics.roaster}` ? t(`types.${brew.basics.roaster}`) : brew.basics.roaster) : '—'}</p></div>
                            <div><p className="text-xs text-muted-foreground mb-1">{t('records.method')}</p><p className="font-medium capitalize">{brew.parameters?.method ? (t(`methods.${brew.parameters.method}`) !== `methods.${brew.parameters.method}` ? t(`methods.${brew.parameters.method}`) : brew.parameters.method) : '—'}</p></div>
                            <div><p className="text-xs text-muted-foreground mb-1">Dose</p><p className="font-medium">{brew.parameters?.dose_grams}g</p></div>
                        </div>

                        {brew.review?.comment && (
                            <div className="bg-muted/30 p-4 rounded-2xl">
                                <p className="text-sm italic text-foreground">"{brew.review.comment}"</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h3 className="font-playfair text-2xl font-bold mb-6 flex items-center gap-2">
                        <MessageSquare size={24} /> Discussion ({comments.length})
                    </h3>

                    <div className="space-y-4 mb-8">
                        <AnimatePresence>
                            {comments.length === 0 ? (
                                <p className="text-muted-foreground text-sm italic">{t('brewDetail.noComments')}</p>
                            ) : (
                                comments.map((comment) => (
                                    <motion.div key={comment.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border p-4 rounded-2xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm">{comment.authorName}</span>
                                            <span className="text-xs text-muted-foreground">
                        {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'MMM d, p') : 'Just now'}
                      </span>
                                        </div>
                                        <p className="text-sm text-foreground">{comment.text}</p>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('brewDetail.writeComment')}
                            className="flex-1 border border-input bg-card rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brew-green"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                        />
                        <button
                            onClick={handleSendComment}
                            disabled={sending || !newComment.trim()}
                            className="bg-brew-green text-white px-5 rounded-xl hover:bg-brew-green-light transition-colors disabled:opacity-50"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}