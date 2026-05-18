import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Heart } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import { apiClient } from '@/api/localClient';

const placeholderImages = {
  Coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  Tea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  Matcha: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80',
  Juice: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
  Other: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
};

export default function BrewCard({ brew, onUpdate }) {
  const navigate = useNavigate();

  const toggleFavourite = async (e) => {
    e.stopPropagation();
    await apiClient.entities.Brew.update(brew.id, { is_favourite: !brew.is_favourite });
    if (onUpdate) onUpdate();
  };

  const img = brew.image_url || placeholderImages[brew.type] || placeholderImages.Other;

  return (
    <motion.div
      whileHover={{ y: -4, shadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/brew/${brew.id}`)}
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        <img
          src={img}
          alt={brew.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = placeholderImages.Other; }}
        />
        <motion.button
          whileTap={{ scale: 1.4 }}
          onClick={toggleFavourite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow"
        >
          <Heart
            size={16}
            className={brew.is_favourite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
          />
        </motion.button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{brew.name}</h3>
        <StarRating value={brew.rating || 0} readonly size={16} />
        <p className="text-xs text-muted-foreground mt-1">
          {brew.brew_date ? format(new Date(brew.brew_date), 'd MMMM yyyy') : format(new Date(brew.created_date), 'd MMMM yyyy')}
        </p>
      </div>
    </motion.div>
  );
}
