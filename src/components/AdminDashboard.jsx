'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from './StatusBadge';
import GrievanceDetailModal from './GrievanceDetailModal';
import AnnouncementBoard from './AnnouncementBoard';
import AnalyticsDashboard from './AnalyticsDashboard';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Trash2, 
  ArrowUpRight, 
  AlertCircle, 
  RefreshCw,
  Layers,
  GraduationCap,
  BookOpen,
  X,
  PieChart,
  BarChart3,
  Megaphone,
  MessageSquare,
  Send
} from 'lucide-react';

export default function AdminDashboard({ sidebarTab }) {
  const { user } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'users'

  // Grievance management states
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0 });
  const [yearStats, setYearStats] = useState({ year1: 0, year2: 0, year3: 0, year4: 0 });
  const [branchStats, setBranchStats] = useState({ aiml: 0, ai: 0 });
  const [loadingGrievances, setLoadingGrievances] = useState(true);
  const [grievanceError, setGrievanceError] = useState('');
  
  // Filter states
  const [yearFilter, setYearFilter] = useState('1'); // '1' | '2' | '3' | '4'
  const [branchFilter, setBranchFilter] = useState('all'); // 'all' | 'AIML' | 'AI'
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected grievance for modal
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  // User management states
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userYearFilter, setUserYearFilter] = useState('all');
  const [userBranchFilter, setUserBranchFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Create user form modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('cr');
  const [newUserYear, setNewUserYear] = useState('1');
  const [newUserBranch, setNewUserBranch] = useState('AIML');
  const [newUserSection, setNewUserSection] = useState('A');
  const [savingUser, setSavingUser] = useState(false);

  // Message modal state (Admin -> CR/Faculty direct messaging)
  const [messageModalGrievance, setMessageModalGrievance] = useState(null);
  const [adminMessageText, setAdminMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const [messageError, setMessageError] = useState('');

  const handleOpenMessageModal = (grievance, e) => {
    if (e) e.stopPropagation();
    setMessageModalGrievance(grievance);
    setAdminMessageText('');
    setMessageSuccess('');
    setMessageError('');
  };

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!adminMessageText.trim() || sendingMessage || !messageModalGrievance) return;

    setSendingMessage(true);
    setMessageError('');
    setMessageSuccess('');

    const targetId = messageModalGrievance.id || messageModalGrievance._id;

    try {
      const res = await apiRequest(`/api/grievances/${targetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message: adminMessageText.trim() }),
      });

      if (res.success) {
        setMessageSuccess('Message dispatched! CR/Faculty has received the notification.');
        setAdminMessageText('');
        setTimeout(() => {
          setMessageModalGrievance(null);
          setMessageSuccess('');
        }, 1500);
      } else {
        setMessageError(res.message || 'Failed to send message');
      }
    } catch (err) {
      setMessageError(err.message || 'Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    loadAllGrievances();
  }, [yearFilter, branchFilter, statusFilter, categoryFilter, roleFilter, searchQuery]);

  useEffect(() => {
    if (sidebarTab === 'Grievances') {
      setActiveTab('grievances');
    }
  }, [sidebarTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, userRoleFilter, userYearFilter, userBranchFilter, userSearchQuery]);

  const loadAllGrievances = async () => {
    setLoadingGrievances(true);
    setGrievanceError('');
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiRequest(`/api/grievances/all?${params.toString()}`);
      if (res.success) {
        setGrievances(res.grievances || []);
        if (res.stats) setStats(res.stats);
        if (res.yearStats) setYearStats(res.yearStats);
        if (res.branchStats) setBranchStats(res.branchStats);
      }
    } catch (err) {
      setGrievanceError(err.message || 'Failed to fetch grievances');
    } finally {
      setLoadingGrievances(false);
    }
  };

  const handleQuickStatusUpdate = async (grievanceId, status, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiRequest(`/api/grievances/${grievanceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          admin_notes: status === 'resolved' ? 'Directly inspected and resolved by HOD office.' : 'Assigned to lab maintenance staff.',
        }),
      });
      if (res.success) {
        setGrievances((prev) =>
          prev.map((g) =>
            (g.id || g._id) === grievanceId ? { ...g, status } : g
          )
        );
        loadAllGrievances();
      }
    } catch (err) {
      console.error('Quick status update failed:', err);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUserError('');
    try {
      const params = new URLSearchParams();
      if (userRoleFilter !== 'all') params.append('role', userRoleFilter);
      if (userYearFilter !== 'all') params.append('year', userYearFilter);
      if (userBranchFilter !== 'all') params.append('branch', userBranchFilter);
      if (userSearchQuery.trim()) params.append('search', userSearchQuery.trim());

      const res = await apiRequest(`/api/users?${params.toString()}`);
      if (res.success) {
        setUsersList(res.users || []);
      }
    } catch (err) {
      setUserError(err.message || 'Failed to load user accounts');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleActive = async (targetUser) => {
    try {
      const res = await apiRequest(`/api/users/${targetUser.id || targetUser._id}/toggle-active`, {
        method: 'PATCH',
      });
      if (res.success) {
        setUserSuccess(res.message);
        loadUsers();
        setTimeout(() => setUserSuccess(''), 3500);
      }
    } catch (err) {
      setUserError(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${targetUser.name}'?`)) {
      return;
    }
    try {
      const res = await apiRequest(`/api/users/${targetUser.id || targetUser._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setUserSuccess(res.message);
        loadUsers();
        setTimeout(() => setUserSuccess(''), 3500);
      }
    } catch (err) {
      setUserError(err.message || 'Failed to delete user account');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    setUserError('');
    try {
      const res = await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
          department: 'AIML',
          branch: newUserBranch,
          year: newUserRole === 'cr' ? Number(newUserYear) : null,
          section: newUserRole === 'cr' ? newUserSection : null,
        }),
      });

      if (res.success) {
        setIsAddUserOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserYear('1');
        setNewUserBranch('AIML');
        setNewUserSection('A');
        setUserSuccess('Account created successfully.');
        loadUsers();
        setTimeout(() => setUserSuccess(''), 3500);
      }
    } catch (err) {
      setUserError(err.message || 'Failed to create user account');
    } finally {
      setSavingUser(false);
    }
  };

  const isGrievancesOnly = sidebarTab === 'Grievances';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {!isGrievancesOnly && (
        <div className="relative rounded-2xl overflow-hidden border border-red-100 bg-white shadow-sm">
        {/* Background Overlay */}
        <div className="absolute inset-y-0 right-0 w-[80%] sm:w-[70%] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent z-10" />
          <img 
            src="/login_page.png" 
            alt="Campus" 
            className="w-full h-full object-cover opacity-100"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-50/60 to-transparent pointer-events-none" />

        <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-6 sm:p-8">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 shadow-sm">
              <ShieldCheck size={14} /> HOD &amp; Central Redressal Committee • All 4 Academic Years
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
              AI &amp; AIML Department Grievance Control Center
            </h1>
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">
              Centralized monitoring and grievance resolution across 1st, 2nd, 3rd, and 4th years of Artificial Intelligence &amp; Machine Learning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('grievances')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'grievances'
                  ? 'bg-red-50 text-[#C61A22] shadow-sm border-red-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-[#C61A22] border-slate-200 shadow-sm'
              }`}
            >
              Grievances ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'users'
                  ? 'bg-red-50 text-[#C61A22] shadow-sm border-red-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-[#C61A22] border-slate-200 shadow-sm'
              }`}
            >
              CR &amp; Faculty Accounts
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                activeTab === 'announcements'
                  ? 'bg-red-50 text-[#C61A22] shadow-sm border-red-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-[#C61A22] border-slate-200 shadow-sm'
              }`}
            >
              <Megaphone size={13} /> Announcements
            </button>

          </div>
        </div>
      </div>
      )}



      {!isGrievancesOnly && activeTab === 'announcements' && (
        <div className="space-y-4">
          <AnnouncementBoard />
        </div>
      )}

      {activeTab === 'grievances' && (
        <>
          {/* Year-Wise Cohort Tabs & Overall Stats */}
          <div className="space-y-4">
            {/* Year Quick-Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-3">
                <GraduationCap size={15} className="text-[#C61A22]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Academic Year:
                </span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22]"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {/* Branch quick filter */}
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                  Branch:
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                  {['all', 'AIML', 'AI'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBranchFilter(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        branchFilter === b
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {b === 'all' ? 'Both' : b}
                    </button>
                  ))}
                </div>
              </div>
            </div>



            {/* KPI Status Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filtered Total</span>
                  <span className="text-xl font-bold text-slate-900 block mt-0.5">{grievances.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <FileText size={18} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
                  <span className="text-xl font-bold text-amber-600 block mt-0.5">{stats.pending}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={18} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">In Progress</span>
                  <span className="text-xl font-bold text-blue-600 block mt-0.5">{stats.in_progress}</span>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <RefreshCw size={18} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Resolved</span>
                  <span className="text-xl font-bold text-emerald-600 block mt-0.5">{stats.resolved}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle size={18} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rejected</span>
                  <span className="text-xl font-bold text-rose-600 block mt-0.5">{stats.rejected}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <XCircle size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Grievances Master Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Department Grievance Log
                </h3>
                <p className="text-xs text-slate-500">
                  {yearFilter === 'all' ? 'All 4 Years' : `Year ${yearFilter}`} • {branchFilter === 'all' ? 'AIML & AI' : branchFilter} • {grievances.length} tickets found
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search submitter or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22] w-52"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22]"
                >
                  <option value="all">All Submissions</option>
                  <option value="cr">CR Submissions</option>
                  <option value="teacher">Faculty Submissions</option>
                </select>

                <button
                  onClick={loadAllGrievances}
                  title="Refresh"
                  className="p-2 rounded-xl text-slate-500 hover:text-[#C61A22] hover:bg-red-50 transition-colors"
                >
                  <RefreshCw size={14} className={loadingGrievances ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Table */}
            {loadingGrievances ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                Loading department grievances...
              </div>
            ) : grievances.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <FileText size={28} className="mx-auto text-slate-400 mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No grievances found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  No grievances match the active Year, Branch, and Status filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-red-50/50 border-b border-red-100 text-red-800 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Cohort</th>
                      <th className="py-3 px-4">Submitter</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {grievances.map((g) => (
                      <tr
                        key={g.id || g._id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C61A22]">
                          #{(g.id || g._id).slice(-5).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Yr {g.year || 1} • {g.branch || 'AIML'}-{g.section || 'A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {(g.submitter_name || g.submitted_by_name || 'Anonymous')?.split(' (')[0]}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="capitalize">{g.submitter_role || g.submitted_by_role || 'Student'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {g.category_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="line-clamp-2 text-slate-700 dark:text-slate-300">
                            {g.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {new Date(g.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {g.status !== 'resolved' && (
                              <button
                                onClick={(e) => handleQuickStatusUpdate(g.id || g._id, 'resolved', e)}
                                title="One-Click Mark as Resolved"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all border border-emerald-200 dark:border-emerald-800/60 active:scale-95 shadow-sm"
                              >
                                <CheckCircle size={13} />
                                <span className="hidden xl:inline">Resolve</span>
                              </button>
                            )}
                            {g.status === 'pending' && (
                              <button
                                onClick={(e) => handleQuickStatusUpdate(g.id || g._id, 'in_progress', e)}
                                title="Mark Under Repair / In Progress"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all border border-blue-200 dark:border-blue-800/60 active:scale-95 shadow-sm"
                              >
                                <Clock size={13} />
                                <span className="hidden xl:inline">Repair</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => handleOpenMessageModal(g, e)}
                              title="Send Message to CR / Faculty about this issue"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all border border-indigo-200 dark:border-indigo-800/60 active:scale-95 shadow-sm cursor-pointer"
                            >
                              <MessageSquare size={13} />
                              <span className="hidden xl:inline">Message</span>
                            </button>
                            <button
                              onClick={() => setSelectedGrievanceId(g.id || g._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-sm"
                            >
                              Review
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* User Management Toolbar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Authorized Department Accounts (Years 1-4)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage Class Representatives (CRs) for 1st, 2nd, 3rd, and 4th Years, and Faculty accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, year..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22] w-48"
                />
              </div>

              <select
                value={userYearFilter}
                onChange={(e) => setUserYearFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22]"
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              <select
                value={userBranchFilter}
                onChange={(e) => setUserBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22]"
              >
                <option value="all">All Branches</option>
                <option value="AIML">AIML</option>
                <option value="AI">AI</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-[#C61A22]"
              >
                <option value="all">All Roles</option>
                <option value="cr">CRs Only</option>
                <option value="teacher">Faculty Only</option>
                <option value="admin">Administrators</option>
              </select>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#C61A22] hover:bg-[#A8161D] transition-colors shadow-sm"
              >
                <UserPlus size={14} /> Add Account
              </button>
            </div>
          </div>

          {userSuccess && (
            <div className="m-4 p-3 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
              <CheckCircle size={15} />
              <span>{userSuccess}</span>
            </div>
          )}

          {userError && (
            <div className="m-4 p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{userError}</span>
            </div>
          )}

          {/* Users Table */}
          {loadingUsers ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading user accounts...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-red-50/50 border-b border-red-100 text-red-800 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Year & Branch</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {u.role === 'cr' && u.year ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Year {u.year} • {u.branch || 'AIML'}
                          </span>
                        ) : (
                          u.department || 'AIML'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {u.section ? `Section ${u.section}` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.is_active
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {u.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleToggleActive(u)}
                              title={u.is_active ? 'Deactivate account' : 'Activate account'}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                u.is_active
                                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete account"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-purple-600 dark:text-purple-400" />
                Register Department Account
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Gupta or Dr. Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. cr.yr1@aiml.edu"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cr">CR (Class Rep)</option>
                    <option value="teacher">Faculty / Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch *
                  </label>
                  <select
                    value={newUserBranch}
                    onChange={(e) => setNewUserBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="AIML">AIML</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
              </div>

              {newUserRole === 'cr' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year *
                    </label>
                    <select
                      value={newUserYear}
                      onChange={(e) => setNewUserYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Section *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="A, B, C"
                      value={newUserSection}
                      onChange={(e) => setNewUserSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-60"
                >
                  {savingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Direct Message Modal */}
      {messageModalGrievance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Send Message to Submitter
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct notification to {messageModalGrievance.submitter_name} ({messageModalGrievance.submitter_role?.toUpperCase()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalGrievance(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grievance Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Ticket #{messageModalGrievance.id?.slice(-6).toUpperCase()} • {messageModalGrievance.category_name}
                </span>
                <span className="font-semibold text-slate-500">
                  Yr {messageModalGrievance.year} {messageModalGrievance.branch}-{messageModalGrievance.section}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                "{messageModalGrievance.description}"
              </p>
            </div>

            {messageSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle size={15} />
                <span>{messageSuccess}</span>
              </div>
            )}

            {messageError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{messageError}</span>
              </div>
            )}

            {/* Message Form */}
            <form onSubmit={handleSendAdminMessage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Message / Instruction for {messageModalGrievance.submitter_name}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type an official message or instruction regarding this grievance... (e.g. Please provide photo evidence, technician assigned, come to cabin)"
                  value={adminMessageText}
                  onChange={(e) => setAdminMessageText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Quick Template Chips */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Quick Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Investigating: Department team is actively inspecting this issue.",
                    "Technician Assigned: A technician has been dispatched to resolve this.",
                    "Visit HOD Cabin: Please meet in the HOD cabin with further details.",
                    "Rectified: The issue has been fixed. Please check and confirm."
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminMessageText(tmpl)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                    >
                      {tmpl.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMessageModalGrievance(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !adminMessageText.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Send size={13} />
                  <span>{sendingMessage ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Detail Modal */}
      <GrievanceDetailModal
        grievanceId={selectedGrievanceId}
        onClose={() => setSelectedGrievanceId(null)}
        onStatusUpdated={loadAllGrievances}
      />
    </div>
  );
}
