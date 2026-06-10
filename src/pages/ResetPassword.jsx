import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// 💥 引入真实 API
import { confirmNewPassword } from '@/api/db-services';
import RippleButton from '@/components/ui/RippleButton';
import { Coffee } from 'lucide-react';

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('oobCode'); // 💥 Firebase 默认的参数名
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid or missing reset token.'); return; }

    setLoading(true);
    // 💥 触发真实的 Firebase 密码重置
    const result = await confirmNewPassword(token, password);
    if (result.success) {
      setDone(true);
    } else {
      setError('Reset failed. The link may have expired or is invalid.');
    }
    setLoading(false);
  };

  return (
      <div className="min-h-screen bg-brew-cream flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brew-green flex items-center justify-center mx-auto mb-3 shadow-lg"><Coffee className="text-white" size={32} /></div>
            <h1 className="font-playfair text-3xl font-bold text-brew-green">New Password</h1>
          </div>
          {done ? (
              <div className="text-center space-y-4">
                <p className="text-2xl">✅</p>
                <p className="font-medium">Password updated!</p>
                <Link to="/login"><RippleButton className="w-full mt-4">Sign In</RippleButton></Link>
              </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="New password" className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Confirm password" className="w-full border border-input bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brew-green" />
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                <RippleButton type="submit" className="w-full" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</RippleButton>
              </form>
          )}
        </motion.div>
      </div>
  );
}