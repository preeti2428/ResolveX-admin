import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function AdminLoginPage() {
  const { login, loginWithGoogle, logout } = useAuth();
  const [email, setEmail] = useState('admin@aiml.edu');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password, null);
      if (!res.success) {
        setError(res.message || 'Login failed.');
      } else if (res.user && !['admin', 'infra_head', 'it_infra_head'].includes(res.user.role)) {
        logout();
        setError('Access Restricted: Only Authorities (Admin/Infra) can log in to this portal.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res.success && res.user && !['admin', 'infra_head', 'it_infra_head'].includes(res.user.role)) {
        logout();
        setError('Access Restricted: Only Authorities (Admin/Infra) can log in to this portal.');
      }
    } catch (err) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 shadow-lg mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-[#1E293B] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-rose-500" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ResolveX Admin</h1>
          <p className="text-xs uppercase font-bold tracking-widest text-rose-400 mt-1">
            Department HOD & Governance Portal
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Artificial Intelligence & Machine Learning Department
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aiml.edu"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Prefill */}
        <div className="mt-6 pt-6 border-t border-slate-700/60 text-center space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Demo Authority Credentials
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@aiml.edu');
              setPassword('Admin@123');
              setError('');
            }}
            className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-rose-300 font-medium transition-colors flex items-center justify-between"
          >
            <span>HOD: admin@aiml.edu</span>
            <span className="text-slate-400">Pass: Admin@123</span>
          </button>
        </div>

        {/* Google SSO */}
        <div className="mt-4 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Authentication Failed')}
            theme="filled_black"
            shape="pill"
            size="medium"
          />
        </div>
      </div>
    </div>
  );
}
