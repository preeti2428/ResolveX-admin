'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  PinOff,
  AlertTriangle,
  Info,
  Zap,
  X,
  RefreshCw,
  Users,
  GraduationCap,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  normal: {
    label: 'Normal',
    icon: Info,
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    icon_color: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  important: {
    label: 'Important',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    icon_color: 'text-amber-500 dark:text-amber-400',
    dot: 'bg-amber-400',
  },
  urgent: {
    label: 'Urgent',
    icon: Zap,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/60',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    icon_color: 'text-red-500 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

// ─── Audience config ──────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone', icon: Users },
  { value: 'cr', label: 'CRs Only', icon: GraduationCap },
  { value: 'teacher', label: 'Faculty Only', icon: BookOpen },
];

// ─── Format relative time ─────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Single Announcement Card ─────────────────────────────────────────────────
function AnnouncementCard({ ann, isAdmin, onDelete, onTogglePin }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.normal;
  const PriorityIcon = cfg.icon;
  const isLong = ann.content.length > 200;

  const handleDelete = async () => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeleting(true);
    try {
      await onDelete(ann._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${cfg.bg} ${cfg.border} ${
        ann.is_pinned ? 'ring-2 ring-indigo-400/40 dark:ring-indigo-500/30' : ''
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${cfg.icon_color}`}>
          <PriorityIcon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {ann.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                <Pin size={9} /> Pinned
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
              {cfg.label}
            </span>
            {isAdmin && ann.audience !== 'all' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                → {AUDIENCE_OPTIONS.find(a => a.value === ann.audience)?.label}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {ann.title}
          </h3>

          <p className={`text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
            {ann.content}
          </p>

          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
            </button>
          )}

          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Posted by <span className="font-semibold text-slate-500 dark:text-slate-400">{ann.posted_by_name}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(ann.createdAt)}</span>
          </div>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onTogglePin(ann._id, !ann.is_pinned)}
              title={ann.is_pinned ? 'Unpin' : 'Pin to top'}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              {ann.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete announcement"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Post Announcement Form ───────────────────────────────────────────────────
function PostAnnouncementForm({ onPosted }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [audience, setAudience] = useState('all');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content cannot be empty.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, content, priority, audience, is_pinned: pinned }),
      });
      setTitle('');
      setContent('');
      setPriority('normal');
      setAudience('all');
      setPinned(false);
      setOpen(false);
      onPosted();
    } catch (err) {
      setError(err.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        id="post-announcement-btn"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#1B2A4A] bg-[#D4A017] hover:bg-[#C9A227] shadow-md shadow-[#D4A017]/20 transition-all hover:scale-105 active:scale-95"
      >
        <Plus size={14} /> Post Announcement
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#D4A017]/30 bg-[#FAF9F5] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-[#1B2A4A] flex items-center gap-2">
          <Megaphone size={16} className="text-[#D4A017]" /> New Announcement
        </h4>
        <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={14} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Announcement title *"
          value={title}
          maxLength={150}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <textarea
          placeholder="Write your announcement message here... *"
          value={content}
          maxLength={1000}
          rows={3}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <p className="text-right text-[11px] text-slate-400">{content.length}/1000</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="normal">🔵 Normal</option>
              <option value="important">🟡 Important</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Send To</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">👥 Everyone</option>
              <option value="cr">🎓 CRs Only</option>
              <option value="teacher">📚 Faculty Only</option>
            </select>
          </div>
        </div>

        {/* Pin toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <div
            onClick={() => setPinned(!pinned)}
            className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${pinned ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${pinned ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">Pin to top</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#24375D] transition-all shadow-sm disabled:opacity-60"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main AnnouncementBoard ───────────────────────────────────────────────────
export default function AnnouncementBoard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setError('');
      const res = await apiRequest('/api/announcements');
      setAnnouncements(res.announcements || []);
    } catch (err) {
      setError('Could not load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    // Poll every 60 seconds for new announcements
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  const handleDelete = async (id) => {
    await apiRequest(`/api/announcements/${id}`, { method: 'DELETE' });
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
  };

  const handleTogglePin = async (id, is_pinned) => {
    await apiRequest(`/api/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_pinned }),
    });
    fetchAnnouncements();
  };

  const urgentCount = announcements.filter(a => a.priority === 'urgent').length;
  const hasNew = announcements.length > 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 text-red-400 border border-red-100/60 shrink-0">
            <Megaphone size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800">
                Announcements
              </h2>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Latest updates from your department
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnnouncements}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-bold text-[#C61A22] hover:bg-red-50 transition-colors"
        >
          View All <span className="text-[14px]">›</span>
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Admin: post form */}
          {isAdmin && (
            <PostAnnouncementForm onPosted={fetchAnnouncements} />
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center py-2">{error}</p>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl bg-slate-100 dark:bg-slate-800 h-20 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && announcements.length === 0 && !error && (
            <div className="relative text-center py-16 px-6 bg-white rounded-b-3xl">
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="relative mb-5">
                  <Megaphone size={56} className="text-slate-400 stroke-1" />
                  <div className="absolute -top-2 -right-3 bg-red-500 text-white text-[12px] font-bold w-6 h-6 rounded-lg flex items-center justify-center shadow-sm">
                    0
                  </div>
                </div>
                <h3 className="text-[16px] font-extrabold text-slate-800 mb-1.5">No recent announcements</h3>
                <p className="text-[13px] font-medium text-slate-800">Stay tuned for updates from your department.</p>
                {isAdmin && (
                  <button className="mt-5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-[#C61A22] hover:bg-[#A8161D] transition-colors shadow-sm">
                    Post Announcement
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Announcement list */}
          {!loading && announcements.map((ann) => (
            <AnnouncementCard
              key={ann._id}
              ann={ann}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
