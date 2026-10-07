'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  FileCheck,
  ShieldCheck,
  Building,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  QrCode
} from 'lucide-react';

export default function ComplaintLetterModal({ grievance, onClose }) {
  const printAreaRef = useRef(null);

  if (!grievance) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(grievance.created_at).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const resolvedDate = grievance.resolved_at
    ? new Date(grievance.resolved_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Under Administrative Processing';

  const refNumber = `RX-AIML-${new Date(grievance.created_at).getFullYear()}-${grievance.id?.slice(-6).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Controls bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#FAF9F5] print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="text-[#1B2A4A]" size={20} />
            <span className="font-bold text-sm text-[#1B2A4A]">
              Official Grievance Resolution Certificate &amp; Docket
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#1B2A4A] hover:bg-[#24375D] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Printer size={15} className="text-[#D4A017]" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#1B2A4A] hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Formal Printable Document Body */}
        <div
          ref={printAreaRef}
          className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 font-serif print:p-8 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible"
        >
          {/* Header with College & Department Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-6 space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src="/logo.png" alt="ResolveX" className="w-7 h-7 object-contain" />
              <div className="inline-block px-3 py-1 rounded-full border border-slate-800 text-[10px] font-sans font-extrabold uppercase tracking-widest text-slate-700">
                Department Grievance Redressal Cell (ResolveX)
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 font-sans">
              Department of Artificial Intelligence & Machine Learning
            </h1>
            <p className="text-xs font-sans text-slate-600">
              Faculty of Engineering & Technology • AI & AIML Academic Complex
            </p>
            <div className="flex items-center justify-between text-xs font-sans pt-4 text-slate-700 font-semibold border-t border-slate-300 mt-4">
              <span><b>Ref No:</b> {refNumber}</span>
              <span><b>Date of Filing:</b> {formattedDate}</span>
              <span><b>Resolution Status:</b> {grievance.status?.toUpperCase()}</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-1">
            <h2 className="text-lg font-bold uppercase tracking-wide font-sans underline decoration-2 underline-offset-4 text-slate-900">
              Formal Grievance Redressal & Resolution Report
            </h2>
          </div>

          {/* Section 1: Submitter Particulars */}
          <div className="space-y-2 font-sans">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 p-1.5 rounded">
              1. Complainant / Submitter Particulars
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-2">
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-bold text-slate-900">{grievance.submitter_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Designation / Role:</span>
                <span className="font-bold text-slate-900 uppercase">{grievance.submitter_role}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Academic Cohort:</span>
                <span className="font-bold text-slate-900">
                  Year {grievance.year || 1} • {grievance.branch || 'AIML'}-{grievance.section || 'A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Official Email:</span>
                <span className="font-bold text-slate-900">{grievance.submitter_email}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Grievance Classification & Specifics */}
          <div className="space-y-2 font-sans">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 p-1.5 rounded">
              2. Grievance Domain & Infrastructure Parameters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-2 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-bold text-slate-900">{grievance.category_name}</span>
              </div>
              {grievance.details &&
                Object.entries(grievance.details).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-500 block capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="font-bold text-slate-900">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Grievance Statement */}
          <div className="space-y-2 font-sans">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 p-1.5 rounded">
              3. Description of Incident / Grievance Statement
            </h3>
            <div className="p-4 border border-slate-200 rounded-lg text-xs leading-relaxed bg-slate-50 text-slate-900 font-sans whitespace-pre-wrap">
              {grievance.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Section 4: Administrative Resolution & Action Taken */}
          <div className="space-y-2 font-sans">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 p-1.5 rounded">
              4. Redressal Action & Official Findings
            </h3>
            <div className="p-4 border-2 border-slate-900 rounded-lg text-xs space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Final Status:</span>
                  <span className="font-black text-sm uppercase text-slate-900">
                    {grievance.status === 'resolved' ? '✅ COMPLAINT REDRESSED & RESOLVED' : grievance.status?.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Action Competent Authority:</span>
                  <span className="font-bold text-slate-900">{grievance.resolved_by_name || 'Prof. S. R. Sharma (HOD AIML & AI)'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Official Resolution Remark:</span>
                <p className="font-semibold text-slate-900 mt-1 italic">
                  "{grievance.admin_notes || 'The infrastructure issue was inspected, necessary repair/remedial action was executed, and verified by departmental staff.'}"
                </p>
              </div>

              <div className="pt-1 text-[11px] text-slate-500">
                <b>Date of Final Sign-off:</b> {resolvedDate}
              </div>
            </div>
          </div>

          {/* Section 5: Status Audit Timeline */}
          {grievance.logs && grievance.logs.length > 0 && (
            <div className="space-y-2 font-sans">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 p-1.5 rounded">
                5. Chronological Audit Trail
              </h3>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Actor / Authority</th>
                    <th className="p-2">Transition</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {grievance.logs.map((l, i) => (
                    <tr key={i} className="text-[11px]">
                      <td className="p-2 font-mono text-slate-600">{new Date(l.changed_at).toLocaleString()}</td>
                      <td className="p-2 font-medium">{l.changed_by_name || 'System / Admin'}</td>
                      <td className="p-2 font-bold uppercase">{l.new_status}</td>
                      <td className="p-2 text-slate-700">{l.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures & Seal Block */}
          <div className="pt-12 grid grid-cols-3 gap-6 text-center font-sans text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">{grievance.submitter_name}</p>
              <p className="text-[11px] text-slate-500">Complainant / Representative Signature</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Department Inspection Officer</p>
              <p className="text-[11px] text-slate-500">Verification & Field Check</p>
            </div>
            <div className="border-t border-slate-900 pt-2">
              <div className="inline-block px-2 py-0.5 rounded border border-purple-800 text-[10px] font-black text-purple-900 mb-1">
                SEAL OF REDRESSAL
              </div>
              <p className="font-black text-slate-950">Prof. S. R. Sharma</p>
              <p className="text-[11px] text-slate-600 font-medium">Head of Department (AIML & AI)</p>
            </div>
          </div>

          {/* Footer watermark & verification */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] font-sans text-slate-400">
            <span>Generated electronically via ResolveX Redressal Engine. System verification ID: <b>{grievance.id}</b></span>
            <span>Page 1 of 1 • Official Academic Record</span>
          </div>
        </div>
      </div>
    </div>
  );
}
