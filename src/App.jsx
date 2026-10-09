import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { apiRequest } from '@/lib/api-client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLoginPage from '@/components/AdminLoginPage';
import AnnouncementBoard from '@/components/AnnouncementBoard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import TrackingDashboard from '@/components/TrackingDashboard';
import { Trash2, Shield, Mail, Building, CheckCircle2, AlertCircle } from 'lucide-react';

function MyProfileView() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Optimize to max 400x400 square for compact storage
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64Url = canvas.toDataURL('image/jpeg', 0.85);

        try {
          const res = await apiRequest('/api/users/profile', {
            method: 'PATCH',
            body: JSON.stringify({ avatar_url: base64Url }),
          });

          if (res.success) {
            updateUser({ avatar_url: base64Url });
            setSuccess('Profile photo updated successfully!');
            setTimeout(() => setSuccess(''), 4000);
          } else {
            setError(res.message || 'Failed to update profile photo.');
          }
        } catch (err) {
          setError(err.message || 'Error uploading profile photo.');
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: null }),
      });

      if (res.success) {
        updateUser({ avatar_url: null });
        setSuccess('Profile photo removed.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.message || 'Failed to remove photo.');
      }
    } catch (err) {
      setError(err.message || 'Error removing photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 sm:p-10 animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Administrator Profile</h1>

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 font-medium shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 font-medium shadow-sm">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
        {/* Circular Avatar Container */}
        <div className="relative inline-block mx-auto mb-5">
          <div
            style={{ width: '128px', height: '128px', backgroundColor: '#FB7185', borderColor: '#93C5FD' }}
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 rounded-full overflow-hidden aspect-square border-[6px] shadow-xl flex items-center justify-center text-white select-none transition-transform hover:scale-[1.02] cursor-pointer"
            title="Upload Profile Photo"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || 'User'}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span style={{ fontSize: '64px', lineHeight: 1 }} className="font-black tracking-tight text-white mb-2">
                {user.name ? user.name.trim().charAt(0).toUpperCase() : 'A'}
              </span>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Remove Photo (Only shown if photo is currently uploaded) */}
        {user.avatar_url && (
          <div className="mb-4">
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemovePhoto}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={12} />
              Remove Photo
            </button>
          </div>
        )}

        {/* User Identity Details */}
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {user.name}
        </h2>

        <p className={`text-sm font-medium text-slate-500 mt-1 flex items-center justify-center gap-1.5 ${!user.year ? 'mb-10' : ''}`}>
          <Mail size={14} className="text-slate-400" />
          {user.email}
        </p>

        {user.year && (
          <p className="text-xs text-slate-400 mt-1 mb-10">
            Year {user.year} • Section {user.section || 'A'}
          </p>
        )}

        {/* Detailed Info Grid */}
        <div className="mt-10 pt-10 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</p>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Building size={14} className="text-[#1B2A4A]" />
              {user.department === 'AIML' ? 'AI / AI&ML' : (user.department || 'AI / AI&ML')}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role Authority</p>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Shield size={14} className="text-[#D4A017]" />
              {user.role === 'cr' ? 'Class Representative' : user.role === 'teacher' ? 'Department Faculty' : 'System Admin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminRouter() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const prevUserIdRef = useRef(user?._id || user?.id);

  // Always reset to Dashboard page whenever user logs out or signs in with any role
  useEffect(() => {
    const currentId = user?._id || user?.id;
    if (!user || currentId !== prevUserIdRef.current) {
      setActiveTab('Dashboard');
    }
    prevUserIdRef.current = currentId;
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0F172A] text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-[#1E293B] p-2.5 flex items-center justify-center shadow-md border border-slate-700 animate-pulse">
          <img src="/logo.png" alt="ResolveX Logo" className="w-10 h-10 object-contain" />
        </div>
        <p className="text-xs font-semibold text-slate-400">Loading ResolveX Admin Panel...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPage />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0F172A] text-white">
        <div className="max-w-md w-full bg-[#1E293B] border border-red-500/30 p-8 rounded-2xl text-center shadow-2xl">
          <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-400 mb-6">
            You are currently logged in as <span className="font-bold text-rose-400">{user.name}</span> with role <span className="font-mono text-amber-300">({user.role.toUpperCase()})</span>. Only Department Administrators (HOD) can access this admin panel.
          </p>
          <button
            onClick={logout}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Switch to Admin Account
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
      case 'Grievances':
        return <AdminDashboard sidebarTab={activeTab} />;
      case 'Analytics':
        return (
          <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Department Analytics & Insights</h1>
            <AnalyticsDashboard />
          </div>
        );
      case 'Announcements':
        return (
          <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Department Circulars & Broadcasts</h1>
            <AnnouncementBoard />
          </div>
        );
      case 'Tracking':
        return <TrackingDashboard />;
      case 'My Profile':
        return <MyProfileView />;
      default:
        return <AdminDashboard sidebarTab={activeTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
