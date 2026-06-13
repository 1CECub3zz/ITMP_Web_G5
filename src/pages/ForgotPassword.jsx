import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sendResetEmail } from '@/api/db-services';
import RippleButton from '@/components/ui/RippleButton';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Coffee } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!executeRecaptcha) {
      setError(t('auth.recaptchaNotReady'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      await executeRecaptcha('forgot_password');
      const result = await sendResetEmail(email);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.errorMessage);
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brew-cream flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brew-green flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Coffee className="text-white" size={32} />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-brew-green">{t('auth.resetPassword')}</h1>
        </div>
        {sent ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center space-y-4">
            <p className="text-2xl">📧</p>
            <p className="font-medium">{t('auth.checkEmail')}</p>
            <p className="text-sm text-muted-foreground">
              {t('auth.resetEmailSent').replace('{email}', email)}
            </p>
            <Link to="/login">
              <RippleButton variant="outline" className="w-full mt-4">{t('auth.backToLogin')}</RippleButton>
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{t('auth.resetPasswordSubtitle')}</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green"
            />
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <RippleButton type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </RippleButton>
            <p className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:text-brew-green transition-colors">← {t('auth.backToLogin')}</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}