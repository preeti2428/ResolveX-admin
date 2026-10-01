'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from './NotificationBell';
import UserProfileModal from './UserProfileModal';
import { LogOut, ShieldCheck, BookOpen, GraduationCap, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 shadow-sm">
            <ShieldCheck size={14} />
            HOD / Admin
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 shadow-sm">
            <BookOpen size={14} />
            Faculty
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#C61A22]/20 text-[#fca5a5] border border-[#C61A22]/40 shadow-sm">
            <GraduationCap size={14} />
            CR {user.year ? `(Yr ${user.year} ${user.branch || 'AIML'}-${user.section || 'A'})` : user.section ? `(Sec ${user.section})` : ''}
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white text-slate-800 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="ResolveX Logo" 
              className="w-10 h-10 object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-extrabold tracking-tight text-slate-800">
                  ResolveX
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold hidden sm:block mt-0.5">
                AI / AI&ML Department Grievance Redressal Portal
              </p>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
            </div>

            <button
              onClick={() => setIsProfileOpen(true)}
              title="Account & Profile Settings"
              className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="text-sm font-semibold text-slate-700 hidden sm:block">
                {user.name?.split(' (')[0] || user.email || 'Admin'}
              </div>
              <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <LogOut size={14} className="text-slate-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </header>
  );
}
