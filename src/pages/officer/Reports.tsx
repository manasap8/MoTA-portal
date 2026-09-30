import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Clock } from 'lucide-react';
import { api } from '../../services/api';

export const OfficerReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('applications-summary');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReport(reportType);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Official Reports & Gazette Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate live audit-verified administrative reports with print formatting and CSV data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <a
            href={`/api/reports/${reportType}/csv`}
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { code: 'applications-summary', label: 'Applications Summary' },
          { code: 'eligibility-report', label: 'Statutory Eligibility' },
          { code: 'document-verification', label: 'Document Scrutiny' },
          { code: 'deficiencies', label: 'Deficiencies Audit' },
          { code: 'selection', label: 'Selection & Merit List' },
        ].map((t) => (
          <button
            key={t.code}
            onClick={() => setReportType(t.code)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              reportType === t.code
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Table View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {reportData?.title || 'Report Output'} ({reportData?.totalRecords || 0} Records)
          </span>
          <span className="text-[11px] text-slate-400">Live Database Extract</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Clock className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Compiling report records...</span>
          </div>
        ) : !reportData?.records?.length ? (
          <div className="p-12 text-center text-xs text-slate-400">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  {Object.keys(reportData.records[0]).map((col) => (
                    <th key={col} className="py-3 px-4 capitalize">
                      {col.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reportData.records.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="py-3 px-4">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
