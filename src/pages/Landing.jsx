import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home, PlusCircle, BookOpen, Star, Coffee } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import RippleButton from '@/components/ui/RippleButton';
import { useI18n } from '@/lib/I18nContext';

const menuItems = [
  { icon: Home, key: 'nav.dashboard', path: '/' },
  { icon: PlusCircle, key: 'nav.addBrew', path: '/add-brew' },
  { icon: BookOpen, key: 'nav.records', path: '/records' },
  { icon: Star, key: 'nav.reviews', path: '/reviews' },
];

export default function Landing() {
  const { t } = useI18n();

  return (

    <div className="min-h-screen bg-brew-cream flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brew-green flex items-center justify-center">
            <Coffee className="text-white" size={20} />
          </div>
          <span className="font-playfair font-bold text-xl text-brew-green">BrewTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 rounded-xl border-2 border-brew-green text-brew-green font-semibold text-sm hover:bg-brew-green hover:text-white transition-colors"
            >
              {t('landing.login')}
            </motion.button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-12 flex items-center">
        <div className="flex-1 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-3xl md:text-4xl font-semibold text-brew-brown mb-3">{t('landing.welcome')}</p>
            <h1 className="font-playfair text-7xl md:text-8xl lg:text-9xl font-black text-brew-green leading-none mb-6" style={{ fontStyle: 'italic' }}>
              BrewTrack
            </h1>
            <p className="text-muted-foreground text-xl md:text-2xl mb-6 max-w-xl leading-relaxed">
              {t('landing.tagline')}
            </p>
            <p className="text-brew-brown/80 text-base md:text-lg mb-8 max-w-2xl leading-relaxed">
              {t('landing.communityCallout')}
            </p>
            <Link to="/login">
              <RippleButton className="text-lg px-8 py-4 rounded-2xl flex items-center gap-2">
                {t('landing.getStarted')} <ArrowRight size={18} />
              </RippleButton>
            </Link>
          </motion.div>
        </div>

        {/* Floating menu card */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hidden md:block"
        >
          <div className="bg-brew-green rounded-3xl p-6 shadow-2xl w-56">
            {menuItems.map((item, i) => (
              <Link to={item.path || '/login'} key={item.key}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                    i === 0 ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{t(item.key)}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Decorative image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 1 }}
          className="absolute right-0 bottom-0 w-1/2 h-full pointer-events-none overflow-hidden"
        >
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=60"
            alt=""
            className="w-full h-full object-cover grayscale"
          />
        </motion.div>
      </main>
    </div>
  );
}
