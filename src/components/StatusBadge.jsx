'use client';

import React from 'react';
import { Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const configs = {
    pending: {
      label: 'Pending',
      icon: Clock,
      classes: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    in_progress: {
      label: 'In Progress',
      icon: RefreshCw,
      classes: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle2,
      classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      classes: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  };

  const current = configs[status] || configs.pending;
  const IconComponent = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${current.classes}`}
    >
      <IconComponent size={12} className={status === 'in_progress' ? 'animate-spin' : ''} />
      <span>{current.label}</span>
    </span>
  );
}
