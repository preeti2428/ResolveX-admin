import React, { useState, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Trash2, 
  Clock, 
  User, 
  Check, 
  ZoomIn, 
  RefreshCw 
} from 'lucide-react';
import { apiRequest } from '../lib/api-client';

export default function SolveGrievanceModal({ grievance, onClose, onSuccess }) {
  if (!grievance) return null;

  const ticketId = (grievance.id || grievance._id || '').slice(-5).toUpperCase();
  const [status, setStatus] = useState(grievance.status === 'resolved' ? 'resolved' : 'resolved');
  const [adminNotes, setAdminNotes] = useState(grievance.admin_notes || '');
  const [resolutionPhoto, setResolutionPhoto] = useState(grievance.resolution_photo_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showZoom, setShowZoom] = useState(false);

  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Photo size must be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setResolutionPhoto(event.target.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setResolutionPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const gid = grievance.id || grievance._id;
      const res = await apiRequest(`/api/grievances/${gid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          admin_notes: adminNotes,
          resolution_photo_url: status === 'resolved' ? resolutionPhoto : undefined,
        }),
      });

      if (res.success) {
        setSuccessMsg(
          status === 'resolved'
            ? '✓ Grievance marked as resolved and resolution proof photo saved!'
            : '✓ Status updated successfully!'
        );
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 900);
      } else {
        setError(res.message || 'Failed to update grievance resolution.');
      }
    } catch (err) {
      setError(err.message || 'Network error while updating resolution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Resolve Grievance
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                  #{ticketId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mark ticket as fixed and attach photo proof for verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Grievance Ticket Context Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <User size={13} className="text-slate-400" />
                <span>
                  {grievance.submitter_name || grievance.submitted_by_name || 'Anonymous'}
                </span>
                <span className="text-[11px] font-normal text-slate-500 capitalize">
                  ({grievance.submitter_role || grievance.submitted_by_role || 'CR'})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                Yr {grievance.year || 1} • {grievance.branch || 'AIML'}-{grievance.section || 'A'}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200 mr-1.5">
                Category:
              </span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {grievance.category_name || 'General'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
              "{grievance.description || 'No statement provided'}"
            </p>
          </div>

          <form id="solve-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Resolution Status Select */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                1. Redressal Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('resolved')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    status === 'resolved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={18} className={status === 'resolved' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>Resolved</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('in_progress')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    status === 'in_progress'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Clock size={18} className={status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>In Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('rejected')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    status === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <X size={18} className={status === 'rejected' ? 'text-rose-600' : 'text-slate-400'} />
                  <span>Rejected</span>
                </button>
              </div>
            </div>

            {/* Department Resolution Note / Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                2. Resolution Remarks / Action Taken
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Technician replaced projector cable, inspected audio output, and tested screen with CR."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
              />
            </div>

            {/* Resolution Proof Photo Upload */}
            {status === 'resolved' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera size={14} className="text-emerald-600" />
                    3. Upload Resolution Proof Photo (Evidence)
                  </label>
                  {resolutionPhoto && (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <Check size={12} /> Photo Attached
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Upload a photo of the repaired equipment, cleaned facility, or resolved setup as proof.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {!resolutionPhoto ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-emerald-50/70 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Camera size={22} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Click to choose photo or take picture
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP (Max 8MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-slate-900 max-h-56 flex items-center justify-center group">
                      <img
                        src={resolutionPhoto}
                        alt="Resolution Proof Preview"
                        className="w-full h-auto max-h-56 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setShowZoom(true)}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="View Full Size"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={13} /> Change Photo
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} /> Remove Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            form="solve-form"
            type="submit"
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
              status === 'resolved'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Resolution...</span>
              </>
            ) : status === 'resolved' ? (
              <>
                <CheckCircle2 size={15} />
                <span>✓ Confirm & Mark as Resolved</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Save Status Update</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Photo Zoom Modal */}
      {showZoom && resolutionPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowZoom(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={resolutionPhoto}
              alt="Zoomed Resolution Proof"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
