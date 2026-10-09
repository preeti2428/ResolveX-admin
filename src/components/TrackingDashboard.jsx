import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api-client';
import GrievanceDetailModal from './GrievanceDetailModal';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  FileText, 
  Calendar, 
  PieChart as PieChartIcon, 
  BarChart2, 
  Filter, 
  RotateCcw,
  GraduationCap,
  Building,
  Users,
  Eye,
  UserCheck
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function TrackingDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected grievance to view in modal
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState('all'); // 'all', 'AIML', 'AI'
  const [selectedYear, setSelectedYear] = useState('all');     // 'all', '1', '2', '3', '4'
  const [selectedSection, setSelectedSection] = useState('all'); // 'all', 'A', 'B', 'C', ...

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/grievances/all');
      if (data.success) {
        setGrievances(data.grievances);
      } else {
        setError(data.message || 'Failed to fetch tracking data');
      }
    } catch (err) {
      setError(err.message || 'Error loading tracking data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to normalize branch values ('aiml', 'AIML', 'AI&ML' -> 'AIML')
  const normalizeBranch = (branch) => {
    if (!branch) return 'AIML';
    const b = branch.toUpperCase().replace(/[\s&_]/g, '');
    if (b.includes('AIML')) return 'AIML';
    if (b === 'AI') return 'AI';
    return branch.toUpperCase();
  };

  // Helper to get readable Assigned Incharge name
  const getAssignedDepartmentLabel = (dept) => {
    switch (dept) {
      case 'infra': return 'Infra Incharge';
      case 'it_infra': return 'IT Infra Incharge';
      case 'ac':
      case 'ac_incharge': return 'AC Incharge';
      default: return 'Not Assigned';
    }
  };

  // Extract unique available sections dynamically based on branch and year
  const availableSections = useMemo(() => {
    const sectionsSet = new Set();
    grievances.forEach(g => {
      const gBranch = normalizeBranch(g.branch);
      const gYear = String(g.year || 1);
      
      const branchMatch = selectedBranch === 'all' || gBranch === selectedBranch;
      const yearMatch = selectedYear === 'all' || gYear === selectedYear;

      if (branchMatch && yearMatch && g.section) {
        sectionsSet.add(g.section.toUpperCase());
      }
    });

    const list = Array.from(sectionsSet).sort();
    if (list.length === 0) return ['A', 'B', 'C'];
    return list;
  }, [grievances, selectedBranch, selectedYear]);

  // Filter grievances according to chosen Branch, Year, and Section
  const filteredGrievances = useMemo(() => {
    return grievances.filter(g => {
      const gBranch = normalizeBranch(g.branch);
      const gYear = String(g.year || 1);
      const gSection = (g.section || 'A').toUpperCase();

      if (selectedBranch !== 'all' && gBranch !== selectedBranch) {
        return false;
      }
      if (selectedYear !== 'all' && gYear !== selectedYear) {
        return false;
      }
      if (selectedSection !== 'all' && gSection !== selectedSection.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [grievances, selectedBranch, selectedYear, selectedSection]);

  const resetFilters = () => {
    setSelectedBranch('all');
    setSelectedYear('all');
    setSelectedSection('all');
  };

  const hasActiveFilters = selectedBranch !== 'all' || selectedYear !== 'all' || selectedSection !== 'all';

  const calculateTimeTaken = (createdAt, updatedAt, status) => {
    if (status !== 'resolved') return 'Pending';
    
    const start = new Date(createdAt);
    const end = new Date(updatedAt);
    
    const days = differenceInDays(end, start);
    const hours = differenceInHours(end, start) % 24;
    const minutes = differenceInMinutes(end, start) % 60;
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // 1. Status Distribution (Pie Chart)
  const statusData = useMemo(() => {
    const counts = filteredGrievances.reduce((acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { name: 'Submitted', value: counts['submitted'] || 0, color: '#94a3b8' },
      { name: 'In Progress', value: counts['in_progress'] || 0, color: '#f59e0b' },
      { name: 'Resolved', value: counts['resolved'] || 0, color: '#10b981' },
      { name: 'Rejected', value: counts['rejected'] || 0, color: '#f43f5e' }
    ].filter(item => item.value > 0);
  }, [filteredGrievances]);

  // 2. Adaptive Bar Chart Data
  const { barChartTitle, barChartData, barChartKey } = useMemo(() => {
    const counts = {};

    if (selectedYear !== 'all' && selectedSection !== 'all') {
      filteredGrievances.forEach(g => {
        const cat = g.category_name || 'General';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      const data = Object.keys(counts)
        .map(key => ({ name: key, count: counts[key] }))
        .sort((a, b) => b.count - a.count);
      return {
        barChartTitle: `Year ${selectedYear} (Sec ${selectedSection}) - Grievances by Category`,
        barChartData: data,
        barChartKey: 'count'
      };
    } else if (selectedYear !== 'all') {
      filteredGrievances.forEach(g => {
        const sec = (g.section || 'A').toUpperCase();
        const label = `Section ${sec}`;
        counts[label] = (counts[label] || 0) + 1;
      });
      availableSections.forEach(sec => {
        const label = `Section ${sec}`;
        if (!counts[label]) counts[label] = 0;
      });

      const data = Object.keys(counts)
        .map(key => ({ name: key, count: counts[key] }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return {
        barChartTitle: `Year ${selectedYear} - Grievances by Section`,
        barChartData: data,
        barChartKey: 'count'
      };
    } else {
      filteredGrievances.forEach(g => {
        const yr = g.year || 1;
        const sec = (g.section || 'A').toUpperCase();
        const label = `Yr ${yr} - Sec ${sec}`;
        counts[label] = (counts[label] || 0) + 1;
      });
      const data = Object.keys(counts)
        .map(key => ({ name: key, count: counts[key] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      return {
        barChartTitle: 'Grievances by Year & Section',
        barChartData: data,
        barChartKey: 'count'
      };
    }
  }, [filteredGrievances, selectedYear, selectedSection, availableSections]);

  // Average Resolution Time
  const avgResolutionText = useMemo(() => {
    const resolved = filteredGrievances.filter(g => g.status === 'resolved' && g.created_at && g.updated_at);
    if (resolved.length === 0) return 'N/A';

    const totalMinutes = resolved.reduce((acc, g) => {
      return acc + differenceInMinutes(new Date(g.updated_at), new Date(g.created_at));
    }, 0);

    const avgMinutes = Math.round(totalMinutes / resolved.length);
    const days = Math.floor(avgMinutes / (24 * 60));
    const hours = Math.floor((avgMinutes % (24 * 60)) / 60);
    const mins = avgMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }, [filteredGrievances]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      </div>
    );
  }

  const resolvedCount = filteredGrievances.filter(g => g.status === 'resolved').length;
  
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Analytics & Tracking</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track grievance lifecycle, resolution speeds, and demographic patterns.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Filtered</p>
              <p className="text-xl font-black text-slate-800 leading-tight">
                {filteredGrievances.length} <span className="text-xs font-normal text-slate-400">/ {grievances.length}</span>
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</p>
              <p className="text-xl font-black text-slate-800 leading-tight">{resolvedCount}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Resolution</p>
              <p className="text-xl font-black text-slate-800 leading-tight">{avgResolutionText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Filter size={16} className="text-blue-600" />
            <span>Filter Grievances by Branch, Year & Section</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Branch Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building size={13} className="text-slate-400" />
              1. Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Branches (AI & AIML)</option>
              <option value="AIML">AI & ML (AIML)</option>
              <option value="AI">AI (Artificial Intelligence)</option>
            </select>
          </div>

          {/* 2. Year Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-slate-400" />
              2. Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedSection('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Years (1st, 2nd, 3rd, 4th)</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* 3. Section Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users size={13} className="text-slate-400" />
              3. Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">
                {selectedYear !== 'all' ? `All Sections of Year ${selectedYear}` : 'All Sections'}
              </option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Currently Viewing:</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
            Branch: {selectedBranch === 'all' ? 'All' : selectedBranch === 'AIML' ? 'AI&ML' : 'AI'}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
            Year: {selectedYear === 'all' ? 'All Years' : `Year ${selectedYear}`}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
            Section: {selectedSection === 'all' ? 'All Sections' : `Section ${selectedSection}`}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800">
              <PieChartIcon size={20} className="text-indigo-500" />
              <h2 className="text-lg font-bold">Status Distribution</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{filteredGrievances.length} tickets</span>
          </div>

          <div className="h-[280px] w-full">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No grievance records found for this filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dynamic Demographics Bar Chart */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800">
              <BarChart2 size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold">{barChartTitle}</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Breakdown</span>
          </div>

          <div className="h-[280px] w-full">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No data available for the selected filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    angle={barChartData.length > 5 ? -45 : 0}
                    textAnchor={barChartData.length > 5 ? 'end' : 'middle'}
                    height={barChartData.length > 5 ? 60 : 30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey={barChartKey} name="Grievances" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Table Row */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Timer size={20} className="text-slate-500" />
            Detailed Time Tracking
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
            Showing {filteredGrievances.length} Grievances
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grievance & Assignment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitter (Branch/Yr/Sec)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timing</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Taken</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrievances.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No grievances found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredGrievances.map((grievance) => {
                  const timeTaken = calculateTimeTaken(grievance.created_at, grievance.updated_at, grievance.status);
                  const branchDisplay = normalizeBranch(grievance.branch) === 'AIML' ? 'AI&ML' : (grievance.branch || 'AIML');
                  const assignedLabel = getAssignedDepartmentLabel(grievance.assigned_department);
                  const isAssigned = grievance.assigned_department && grievance.assigned_department !== 'none';

                  return (
                    <tr key={grievance.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* 1. Grievance & Assignment */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 mb-1">{grievance.category_name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px] mb-1.5">{grievance.description}</div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isAssigned 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            <UserCheck size={11} className={isAssigned ? 'text-indigo-600' : 'text-slate-400'} />
                            <span>{assignedLabel}</span>
                          </span>
                        </div>
                      </td>

                      {/* 2. Submitter Info */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{grievance.submitted_by_name}</div>
                        <div className="text-xs text-slate-400 font-medium">
                          {branchDisplay} • Yr {grievance.year || 1} • Sec {grievance.section || 'A'}
                        </div>
                      </td>

                      {/* 3. Timing */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Started: {format(new Date(grievance.created_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        {grievance.status === 'resolved' && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 size={12} />
                            <span>Solved: {format(new Date(grievance.updated_at), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(grievance.status)}`}>
                          {grievance.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* 5. Time Taken */}
                      <td className="px-6 py-4">
                        {grievance.status === 'resolved' ? (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <Clock size={14} className="text-emerald-500" />
                            {timeTaken}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                            <Timer size={14} />
                            {timeTaken}
                          </div>
                        )}
                      </td>

                      {/* 6. Action (Eye Icon on the right) */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedGrievanceId(grievance.id || grievance._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200/90 hover:border-blue-300 shadow-sm transition-all hover:scale-105 cursor-pointer"
                          title="View Grievance & Assignment Details"
                        >
                          <Eye size={15} className="text-blue-500" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grievance Detail Modal Popup (Read-only for tracking view) */}
      {selectedGrievanceId && (
        <GrievanceDetailModal
          grievanceId={selectedGrievanceId}
          onClose={() => setSelectedGrievanceId(null)}
          readOnly={true}
          onStatusUpdated={() => {
            fetchGrievances();
          }}
        />
      )}
    </div>
  );
}
