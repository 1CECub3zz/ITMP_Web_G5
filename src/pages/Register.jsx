import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerNewUser } from '@/api/db-services';
import RippleButton from '@/components/ui/RippleButton';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useI18n } from '@/lib/I18nContext';

// 💥 关键点：这里必须有 export default
export default function Register() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerNewUser(email, password, fullName);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.errorMessage);
      }
    } catch (err) {
      setError(t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-brew-cream flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="font-playfair text-3xl font-bold text-brew-green">Create Account</h1>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full border rounded-xl px-4 py-2.5 text-sm" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border rounded-xl px-4 py-2.5 text-sm" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border rounded-xl px-4 py-2.5 text-sm" />

              {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>}

              <RippleButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Sign Up'}
              </RippleButton>
            </form>
            <p className="text-center mt-4 text-sm">
              Already have an account? <Link to="/login" className="text-brew-green font-semibold">Sign In</Link>
            </p>
          </motion.div>
        </div>
      </div>
  );
}