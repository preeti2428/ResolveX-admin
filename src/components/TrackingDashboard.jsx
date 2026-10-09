import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Clock, CheckCircle2, AlertCircle, Timer, FileText, Calendar, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function TrackingDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // --- Aggregations for Charts ---

  // 1. Status Distribution (Pie Chart)
  const statusData = useMemo(() => {
    const counts = grievances.reduce((acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { name: 'Submitted', value: counts['submitted'] || 0, color: '#94a3b8' }, // slate-400
      { name: 'In Progress', value: counts['in_progress'] || 0, color: '#f59e0b' }, // amber-500
      { name: 'Resolved', value: counts['resolved'] || 0, color: '#10b981' }, // emerald-500
      { name: 'Rejected', value: counts['rejected'] || 0, color: '#f43f5e' } // rose-500
    ].filter(item => item.value > 0);
  }, [grievances]);

  // 2. Year & Section Distribution (Bar Chart)
  const demographicsData = useMemo(() => {
    const counts = {};
    grievances.forEach(g => {
      const year = g.year || 'Unknown';
      const section = g.section || 'Unknown';
      const label = `Yr ${year} - Sec ${section}`;
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.keys(counts)
      .map(key => ({ name: key, Grievances: counts[key] }))
      .sort((a, b) => b.Grievances - a.Grievances) // Sort by count descending
      .slice(0, 10); // Top 10
  }, [grievances]);

  // Calculate Average Resolution Time for Resolved Grievances
  const avgResolutionText = useMemo(() => {
    const resolved = grievances.filter(g => g.status === 'resolved' && g.created_at && g.updated_at);
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
  }, [grievances]);

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

  const resolvedGrievances = grievances.filter(g => g.status === 'resolved');
  
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Analytics & Tracking</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Visualize grievance data and resolution times.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
              <p className="text-xl font-black text-slate-800 leading-tight">{grievances.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</p>
              <p className="text-xl font-black text-slate-800 leading-tight">{resolvedGrievances.length}</p>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <PieChartIcon size={20} className="text-indigo-500" />
            <h2 className="text-lg font-bold">Grievance Status Distribution</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
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
          </div>
        </div>

        {/* Year/Section Bar Chart */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <BarChart2 size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold">Grievances by Year & Section</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={demographicsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                <Bar dataKey="Grievances" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tracking Table Row */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Timer size={20} className="text-slate-500" />
            Detailed Time Tracking
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grievance Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitter (Yr/Sec)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timing</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grievances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No grievances found to track.
                  </td>
                </tr>
              ) : (
                grievances.map((grievance) => {
                  const timeTaken = calculateTimeTaken(grievance.created_at, grievance.updated_at, grievance.status);
                  return (
                    <tr key={grievance.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 mb-1">{grievance.category_name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{grievance.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{grievance.submitted_by_name}</div>
                        <div className="text-xs text-slate-400">
                          {grievance.year ? `Yr ${grievance.year}` : 'N/A'} • {grievance.section ? `Sec ${grievance.section}` : 'N/A'}
                        </div>
                      </td>
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
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(grievance.status)}`}>
                          {grievance.status.replace('_', ' ')}
                        </span>
                      </td>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
