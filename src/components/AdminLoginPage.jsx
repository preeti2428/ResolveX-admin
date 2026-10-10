'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function AdminLoginPage() {
  const { login, loginWithGoogle, logout } = useAuth();
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '');
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Admin email and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(email.trim(), password, 'admin');
      if (!res.success) {
        setError(res.message || 'Login failed.');
      } else if (res.user && res.user.role !== 'admin') {
        logout();
        setError('Access Restricted: Only Department Administrators (HOD) can access this portal.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res.success && res.user && res.user.role !== 'admin') {
        logout();
        setError('Access Restricted: Only Department Administrators (HOD) can access this portal.');
      }
    } catch (err) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between text-slate-800 p-3 sm:p-5 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login_page.png')" }}
    >
      {/* Top Header */}
      <header className="text-center pt-3 pb-1 relative z-10">
        <div className="flex flex-col items-center mb-1">
          <img
            src="/logo.png"
            alt="ResolveX Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xs -mb-2"
          />
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Resolve<span className="text-[#C61A22]">X</span>
          </span>
        </div>
        <p className="text-xs font-medium text-[#475569]">
          AI / AI&amp;ML Department Grievance Control Center &bull; Administration
        </p>
      </header>

      {/* Single Compact Glass Card - Admin Only */}
      <main className="max-w-md w-full mx-auto my-auto py-4 relative z-10">
        <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-5 sm:p-6 shadow-xl border border-[#C61A22]/10 ring-1 ring-[#C61A22]/5 transition-all duration-300">
          
          {/* Admin Header */}
          <div className="mb-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200/60 text-[#C61A22] mx-auto mb-3 flex items-center justify-center shadow-xs">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-base font-extrabold text-[#0F172A] leading-tight">Admin Portal</h2>
            <p className="text-[11px] font-medium text-[#64748B] mt-1">Department HOD &amp; Central Governance</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-3.5 p-2.5 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Admin Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail size={15} className="text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aiml.edu"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-[#C61A22] focus:ring-1 focus:ring-[#C61A22] outline-none transition-all shadow-sm"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock size={15} className="text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-[#C61A22] focus:ring-1 focus:ring-[#C61A22] outline-none transition-all font-mono shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#C61A22] hover:bg-[#A8161D] active:bg-[#8B1218] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In as Admin'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Quick Fill Demo */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-[#64748B] font-medium text-[11px]">Quick Fill:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@aiml.edu');
                setPassword('Admin@123');
                setError('');
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-900 font-semibold text-[11px] px-3 py-1 rounded-md transition-colors cursor-pointer border border-rose-200/60"
            >
              HOD Admin Demo
            </button>
          </div>

          {/* Institutional Google SSO */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium mb-2">Or continue with institutional account</span>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Authentication Failed')}
              theme="outline"
              shape="pill"
              size="medium"
            />
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="text-center pt-3 pb-1 relative z-10">
        <div className="w-16 h-px bg-slate-200/80 mx-auto mb-2" />
        <p className="text-[11px] text-[#64748B]">
          ResolveX &copy; {new Date().getFullYear()} Department of AI / AI&amp;ML &bull; Administration Portal
        </p>
      </footer>
    </div>
  );
}
