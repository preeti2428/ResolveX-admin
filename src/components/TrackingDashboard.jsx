import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Clock, CheckCircle2, AlertCircle, Timer, FileText, Calendar } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Resolution Tracking</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track grievance submission and resolution times.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Resolved</p>
              <p className="text-lg font-bold text-slate-800 leading-tight">{resolvedGrievances.length}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Grievances</p>
              <p className="text-lg font-bold text-slate-800 leading-tight">{grievances.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grievance Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted By</th>
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
                        <div className="text-xs text-slate-400 capitalize">{grievance.submitted_by_role}</div>
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
