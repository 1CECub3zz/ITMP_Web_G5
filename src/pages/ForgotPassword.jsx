import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/localClient';
import RippleButton from '@/components/ui/RippleButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiClient.auth.resetPasswordRequest(email);
      setResetLink(`/reset-password?token=${result.resetToken}`);
    } catch {}
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-brew-cream flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brew-green flex items-center justify-center mx-auto mb-3 shadow-lg"><span className="text-3xl">☕</span></div>
          <h1 className="font-playfair text-3xl font-bold text-brew-green">Reset Password</h1>
        </div>
        {sent ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center space-y-4">
            <p className="text-2xl">📧</p>
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">If an account exists for {email}, a local reset link has been generated.</p>
            {resetLink && (
              <Link to={resetLink} className="block text-sm text-brew-green hover:underline break-all">
                Open reset link
              </Link>
            )}
            <Link to="/login"><RippleButton variant="outline" className="w-full">Back to Login</RippleButton></Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Enter your email and we'll send you a reset link.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
            <RippleButton type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</RippleButton>
            <p className="text-center text-sm"><Link to="/login" className="text-muted-foreground hover:text-brew-green transition-colors">← Back to Login</Link></p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
