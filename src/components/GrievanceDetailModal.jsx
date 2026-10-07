'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from './StatusBadge';
import ComplaintLetterModal from './ComplaintLetterModal';
import { 
  X, 
  Calendar, 
  User, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  History,
  MessageSquare,
  Printer,
  Send,
  CornerDownLeft
} from 'lucide-react';

export default function GrievanceDetailModal({ grievanceId, onClose, onStatusUpdated }) {
  const { user } = useAuth();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin action states
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const fileInputRef = React.useRef(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  const [assignedDept, setAssignedDept] = useState('none');
  const [assigning, setAssigning] = useState(false);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolutionPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Discussion & Comments states
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Formal letter / PDF modal
  const [showLetterModal, setShowLetterModal] = useState(false);

  useEffect(() => {
    if (grievanceId) {
      loadGrievanceDetails();
    }
  }, [grievanceId]);

  const loadGrievanceDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`/api/grievances/${grievanceId}`);
      if (res.success && res.grievance) {
        setGrievance(res.grievance);
        setNewStatus(res.grievance.status);
        setAdminNotes(res.grievance.admin_notes || '');
        setResolutionPhoto(res.grievance.resolution_photo_url || null);
        setAssignedDept(res.grievance.assigned_department || 'none');
      }
    } catch (err) {
      setError(err.message || 'Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setError('');
    setUpdateSuccess('');

    try {
      const res = await apiRequest(`/api/grievances/${grievanceId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assigned_department: assignedDept === 'none' ? null : assignedDept }),
      });

      if (res.success) {
        setUpdateSuccess(res.message || 'Grievance assigned successfully');
        loadGrievanceDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign grievance');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setUpdateSuccess('');

    try {
      const res = await apiRequest(`/api/grievances/${grievanceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes.trim(),
          resolution_photo_url: newStatus === 'resolved' ? resolutionPhoto : undefined,
        }),
      });

      if (res.success) {
        setUpdateSuccess(res.message || 'Status updated successfully');
        loadGrievanceDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendComment = async (e) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || postingComment) return;

    setPostingComment(true);
    setCommentError('');
    try {
      const res = await apiRequest(`/api/grievances/${grievanceId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message: commentText.trim() }),
      });
      if (res.success && res.comments) {
        setGrievance((prev) => ({ ...prev, comments: res.comments }));
        setCommentText('');
      }
    } catch (err) {
      setCommentError(err.message || 'Failed to post message');
    } finally {
      setPostingComment(false);
    }
  };

  if (!grievanceId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FAF3DE] text-[#D4A017] border border-[#D4A017]/30">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1B2A4A]">
                  Grievance #{grievanceId.slice(-6).toUpperCase()}
                </h3>
                {grievance && <StatusBadge status={grievance.status} />}
              </div>
              <p className="text-xs text-slate-500">
                Department Redressal Tracker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1B2A4A] hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {loading && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              Loading grievance details...
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl text-sm bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {updateSuccess && (
            <div className="p-3.5 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{updateSuccess}</span>
            </div>
          )}

          {grievance && (
            <>
              {/* Meta Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {grievance.category_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Year & Branch</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Year {grievance.year || 1} • {grievance.branch || 'AIML'}-{grievance.section || 'A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Filed By</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {grievance.submitted_by_name?.split(' (')[0] || grievance.submitter_name?.split(' (')[0] || 'Anonymous'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Submitted On</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(grievance.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Resolved By</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {grievance.resolved_by_name || 'Pending Review'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Issue Statement & Description
                </h4>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {grievance.description || 'No detailed description provided.'}
                </div>
              </div>

              {/* Dynamic Specifics */}
              {grievance.details && Object.keys(grievance.details).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Department Parameter Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.entries(grievance.details).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60"
                      >
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment */}
              {grievance.attachment_url && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Attached Evidence
                  </h4>
                  {grievance.attachment_url.startsWith('data:video') || grievance.attachment_url.endsWith('.mp4') || grievance.attachment_url.endsWith('.webm') || grievance.attachment_url.endsWith('.mov') ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72 flex items-center justify-center bg-black">
                      <video
                        src={grievance.attachment_url}
                        controls
                        className="max-h-72 w-full object-contain"
                      />
                    </div>
                  ) : grievance.attachment_url.startsWith('data:image') || grievance.attachment_url.endsWith('.png') || grievance.attachment_url.endsWith('.jpg') || grievance.attachment_url.endsWith('.jpeg') || grievance.attachment_url.endsWith('.webp') ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 flex items-center justify-center bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={grievance.attachment_url}
                        alt="Evidence"
                        className="max-h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <a
                      href={grievance.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 hover:underline"
                    >
                      <ExternalLink size={14} />
                      View Uploaded Document
                    </a>
                  )}
                </div>
              )}

              {/* Admin Note if already present */}
              {grievance.admin_notes && (
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                    <MessageSquare size={14} />
                    Official Department Action Note
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-3">
                    {grievance.admin_notes}
                  </p>
                  {grievance.resolution_photo_url && (
                    <div className="mt-3 border-t border-indigo-200/50 pt-3">
                      <p className="text-xs font-semibold text-indigo-600 mb-2">Resolution Proof:</p>
                      <a href={grievance.resolution_photo_url} target="_blank" rel="noreferrer">
                        <img 
                          src={grievance.resolution_photo_url} 
                          alt="Resolution Proof" 
                          className="max-w-full sm:max-w-xs rounded-xl border border-indigo-200 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {!grievance.admin_notes && grievance.resolution_photo_url && (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                    <CheckCircle size={14} />
                    Resolution Proof Photo
                  </div>
                  <a href={grievance.resolution_photo_url} target="_blank" rel="noreferrer">
                    <img 
                      src={grievance.resolution_photo_url} 
                      alt="Resolution Proof" 
                      className="max-w-full sm:max-w-xs rounded-xl border border-emerald-200 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  </a>
                </div>
              )}

              {/* Audit Timeline */}
              {grievance.logs && grievance.logs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <History size={14} />
                    Audit Trail & Status History
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {grievance.logs.map((log, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                        <div className="text-xs">
                          <div className="flex items-start gap-2 pt-0.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.note?.startsWith('Grievance submitted by')
                                ? 'Ticket Submitted'
                                : log.note?.includes('Note: ')
                                ? log.note.split('Note: ')[1].trim()
                                : `Status: ${log.new_status.replace('_', ' ')}`}
                            </span>
                            <StatusBadge status={log.new_status} />
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {new Date(log.changed_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign to Department (Admin only) */}
              {user?.role === 'admin' && (
                <form
                  onSubmit={handleAssign}
                  className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 space-y-4 mb-4"
                >
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Forward / Assign Grievance
                    </h4>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Select Department
                      </label>
                      <select
                        value={assignedDept}
                        onChange={(e) => setAssignedDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="none">None (General Admin)</option>
                        <option value="infra">Infrastructure (Infra Head)</option>
                        <option value="it_infra">IT Infrastructure (IT Infra Head)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={assigning}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md disabled:opacity-60"
                    >
                      {assigning ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </form>
              )}

              {/* Admin Resolution Form Controls */}
              {(user?.role === 'admin' || user?.role === 'infra_head' || user?.role === 'it_infra_head') && (
                <form
                  onSubmit={handleStatusUpdate}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      HOD / Admin Grievance Action
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Update Redressal Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Add Department Note / Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lab assistant deployed, projector bulb replaced"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  {newStatus === 'resolved' && (
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Upload Resolution Proof Photo (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
                        >
                          {resolutionPhoto && resolutionPhoto.startsWith('data:') ? 'Change Photo' : 'Select Photo'}
                        </button>
                        {resolutionPhoto && resolutionPhoto.startsWith('data:') && (
                          <div className="flex items-center gap-2">
                            <img src={resolutionPhoto} alt="Resolution" className="h-10 w-10 object-cover rounded-lg border border-slate-200" />
                            <button
                              type="button"
                              onClick={() => setResolutionPhoto(null)}
                              className="text-xs text-rose-500 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#24375D] transition-all shadow-md shadow-[#1B2A4A]/20 disabled:opacity-60"
                    >
                      {updating ? 'Saving...' : 'Apply Status Update'}
                    </button>
                  </div>
                </form>
              )}

              {/* Discussion & Live Comments Thread Removed per request */}
            </>
          )}
        </div>
      </div>

      {/* Official Complaint Letter / Resolution Certificate Modal */}
      {showLetterModal && grievance && (
        <ComplaintLetterModal
          grievance={grievance}
          onClose={() => setShowLetterModal(false)}
        />
      )}
    </div>
  );
}
