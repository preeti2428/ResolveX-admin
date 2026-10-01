'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  User,
  Shield,
  KeyRound,
  Phone,
  Mail,
  GraduationCap,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/users/profile');
      if (res.success && res.user) {
        setProfile(res.user);
        setName(res.user.name?.split(' (')[0] || '');
        setPhone(res.user.phone || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        phone: phone.trim(),
      };

      const res = await apiRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      if (res.success) {
        setSuccess(res.message || 'Profile updated successfully.');
        // Update auth state if name changed
        if (res.user && user) {
          const updatedUser = { ...user, name: res.user.name };
          localStorage.setItem('resolvex_user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const initials = (name || user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#FAF9F5]">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#D4A017]" />
            <h3 className="text-base font-bold text-[#1B2A4A]">
              Account &amp; Profile Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#1B2A4A] hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* User Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-[#D4A017]/30">
            <div className="w-14 h-14 rounded-2xl bg-[#1B2A4A] text-[#D4A017] font-extrabold text-xl flex items-center justify-center shadow-md ring-4 ring-[#FAF3DE]">
              {initials}
            </div>
            <div>
              <h4 className="font-extrabold text-base text-[#1B2A4A]">
                {(profile?.name || user?.name)?.split(' (')[0]}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                {profile?.email || user?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF3DE] text-[#1B2A4A] border border-[#D4A017]/30">
                  <Shield size={11} className="text-[#D4A017]" /> {profile?.role || user?.role}
                </span>
                {profile?.year && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                    Year {profile.year} • {profile.branch}-{profile.section}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Personal Particulars */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Information
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number / WhatsApp Contact
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#24375D] transition-all shadow-md shadow-[#1B2A4A]/25 disabled:opacity-60 active:scale-95"
            >
              <Save size={14} className="text-[#D4A017]" />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
