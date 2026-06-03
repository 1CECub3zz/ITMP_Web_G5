import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/localClient';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useI18n } from '@/lib/I18nContext';
import { logoutUser } from '@/api/db-services';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkUserAuth } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navLinks = [
    { label: t('nav.dashboard'), path: '/' },
    { label: t('nav.addBrew'), path: '/add-brew' },
    { label: t('nav.records'), path: '/records' },
    { label: t('nav.community'), path: '/community' },
    { label: t('nav.reviews'), path: '/reviews' },
    { label: `🏆 ${t('nav.badges')}`, path: '/badges' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    const { redirectPath } = apiClient.auth.logout('/welcome');
    await checkUserAuth();
    await logoutUser();
    navigate(redirectPath, { replace: true });
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-brew-green flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <span className="text-white text-lg">☕</span>
          </div>
          <span className="font-playfair font-bold text-xl text-brew-green">BrewTrack</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive(link.path)
                  ? 'text-brew-green font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brew-green rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Profile */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher compact />
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-full bg-secondary border-2 border-border flex items-center justify-center hover:border-brew-green transition-all duration-200 hover:scale-105"
          >
            <User size={18} className="text-muted-foreground" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-52 bg-card border border-border rounded-xl shadow-xl p-2 z-50"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold truncate">{user?.full_name || 'Brewer'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut size={14} /> {t('nav.signOut')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden ml-2 p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-card"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              <LanguageSwitcher compact className="mb-2" />
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-brew-green text-white'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
