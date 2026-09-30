import React from 'react';
import { Sparkles, ShieldCheck, UserCheck } from 'lucide-react';

interface TagBadgeProps {
  type: 'ai' | 'rule' | 'human';
  label?: string;
  size?: 'sm' | 'md';
}

export const TagBadge: React.FC<TagBadgeProps> = ({ type, label, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (type === 'ai') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
        <Sparkles className="w-3 h-3 text-purple-600" />
        {label || 'AI-assisted finding'}
      </span>
    );
  }

  if (type === 'rule') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}>
        <ShieldCheck className="w-3 h-3 text-sky-600" />
        {label || 'Rule-based result'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
      <UserCheck className="w-3 h-3 text-emerald-600" />
      {label || 'Official decision (human)'}
    </span>
  );
};
