import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLoginPage from '@/components/AdminLoginPage';
import AnnouncementBoard from '@/components/AnnouncementBoard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

function AdminRouter() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

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
      case 'My Profile':
        return (
          <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-6">Administrator Profile</h1>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-rose-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-md">
                {user.name ? user.name[0] : 'A'}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider mt-1">{user.role} • {user.department || 'AIML'}</p>
              <p className="text-sm text-slate-400 mt-1">{user.email}</p>
            </div>
          </div>
        );
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
