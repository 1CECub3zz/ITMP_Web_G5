import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  const [hovered, setHovered] = useState(0);

  const display = hovered || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={readonly}
          whileTap={!readonly ? { scale: 1.4 } : {}}
          whileHover={!readonly ? { scale: 1.2 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={`focus:outline-none ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${
              star <= display
                ? 'fill-brew-gold text-brew-gold'
                : 'fill-transparent text-muted-foreground/40'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
}