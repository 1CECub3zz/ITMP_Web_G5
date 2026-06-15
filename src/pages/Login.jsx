import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginWithEmail, loginWithGoogleAuth } from '@/api/db-services';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import RippleButton from '@/components/ui/RippleButton';
import { Eye, EyeOff, Coffee } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      if (result.success) navigate('/', { replace: true });
      else setError(result.errorMessage || t('auth.invalidCredentials'));
    } catch (err) {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    const result = await loginWithGoogleAuth();
    if (result.success) navigate('/', { replace: true });
    else setError(result.errorMessage);
  };

  return (
      <div className="min-h-screen bg-page-light flex items-center justify-center px-4">
        <div className="w-full max-w-md relative">
          <div className="absolute -top-14 right-0"><LanguageSwitcher compact /></div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-card border border-border rounded-3xl shadow-2xl p-8">

            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-brew-green flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Coffee className="text-white" size={32} />
              </div>
              <h1 className="font-playfair text-3xl font-bold text-brew-green">BrewTrack</h1>
              <p className="text-muted-foreground text-sm mt-1">{t('auth.signInTitle')}</p>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              {t('auth.continueGoogle')}
            </motion.button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('auth.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full border border-input bg-background rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</motion.p>}
              <RippleButton type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </RippleButton>
            </form>

            <div className="text-center mt-5 space-y-2">
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-brew-green transition-colors">{t('auth.forgotPassword')}</Link>
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')} <Link to="/register" className="text-brew-green font-semibold hover:underline">{t('auth.signUp')}</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
  );
}