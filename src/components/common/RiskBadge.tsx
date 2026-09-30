import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon } from 'lucide-react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score }) => {
  switch (level) {
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          LOW RISK {score !== undefined && `(${score}%)`}
        </span>
      );

    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          MEDIUM RISK {score !== undefined && `(${score}%)`}
        </span>
      );

    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          HIGH RISK {score !== undefined && `(${score}%)`}
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {level}
        </span>
      );
  }
};
