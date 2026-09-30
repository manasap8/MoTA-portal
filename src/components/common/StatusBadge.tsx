import React from 'react';
import {
  FileText,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Sparkles,
  Archive,
  Compass,
} from 'lucide-react';
import { ApplicationStatus } from '../../types';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  switch (status) {
    case 'Draft':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );

    case 'Submitted':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Send className="w-3.5 h-3.5 text-blue-600" />
          Submitted
        </span>
      );

    case 'Under Verification':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Under Verification
        </span>
      );

    case 'Deficient':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          Deficient
        </span>
      );

    case 'Eligible':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Eligible
        </span>
      );

    case 'Ineligible':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Ineligible
        </span>
      );

    case 'Shortlisted':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-purple-50 text-purple-800 border border-purple-200 ${sizeClasses}`}>
          <Award className="w-3.5 h-3.5 text-purple-600" />
          Shortlisted
        </span>
      );

    case 'Selected':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-xs ${sizeClasses}`}>
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          Selected
        </span>
      );

    case 'Not Selected':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-300 ${sizeClasses}`}>
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          Not Selected
        </span>
      );

    case 'Post-Selection':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses}`}>
          <Compass className="w-3.5 h-3.5 text-teal-600" />
          Post-Selection
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
