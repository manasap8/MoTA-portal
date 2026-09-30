import React, { useState, useEffect } from 'react';
import { Settings, PlusCircle, CheckCircle2, ShieldCheck, Play, Save, X } from 'lucide-react';
import { api } from '../../services/api';
import { Scheme, SchemeRule, Application } from '../../types';
import { useToast } from '../../context/ToastContext';
import { TagBadge } from '../../components/common/TagBadge';

export const AdminRulesPage: React.FC = () => {
  const { showToast } = useToast();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('scheme_nfst');
  const [rules, setRules] = useState<SchemeRule[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [testAppId, setTestAppId] = useState<string>('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // New rule modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [newTargetKey, setNewTargetKey] = useState('annualIncome');
  const [newOperator, setNewOperator] = useState('lessThanOrEqual');
  const [newExpectedValue, setNewExpectedValue] = useState('600000');
  const [newWeight, setNewWeight] = useState(20);

  useEffect(() => {
    const init = async () => {
      try {
        const [schemeList, appList] = await Promise.all([
          api.getSchemes(),
          api.getApplications(),
        ]);
        setSchemes(schemeList);
        setApplications(appList);
        if (appList.length > 0) setTestAppId(appList[0].id);

        if (schemeList.length > 0) {
          const defaultScheme = schemeList[0];
          setSelectedSchemeId(defaultScheme.id);
          setRules(defaultScheme.eligibilityRules || []);
        }
      } catch (err) {
        console.error('Failed to load rules:', err);
      }
    };
    init();
  }, []);

  const handleSelectScheme = (sId: string) => {
    setSelectedSchemeId(sId);
    const found = schemes.find((s) => s.id === sId);
    if (found) {
      setRules(found.eligibilityRules || []);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterion.trim()) return;

    const newRule: SchemeRule = {
      id: `rule_${Date.now()}`,
      criterion: newCriterion,
      type: 'required',
      targetType: newOperator.includes('document') ? 'document' : 'field',
      targetKey: newTargetKey,
      operator: newOperator as any,
      expectedValue: isNaN(Number(newExpectedValue)) ? newExpectedValue : Number(newExpectedValue),
      weight: Number(newWeight),
      failMessage: `Condition not met: ${newCriterion}`,
      evidenceSource: 'Uploaded Certificate',
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    setShowAddModal(false);
    setNewCriterion('');

    try {
      setSaving(true);
      await api.updateRules(selectedSchemeId, updatedRules);
      showToast('Eligibility rule added and persisted to database.', 'success');
    } catch (err: any) {
      showToast('Failed to persist rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    try {
      await api.updateRules(selectedSchemeId, updated);
      showToast('Rule removed from scheme matrix.', 'info');
    } catch (err) {
      showToast('Failed to remove rule', 'error');
    }
  };

  // Test rule matrix on sample application
  const handleTestRules = async () => {
    if (!testAppId) return;
    try {
      setTesting(true);
      const appDetails = await api.getApplicationById(testAppId);
      setTestResult(appDetails.eligibility);
      showToast('Rule matrix evaluation test completed.', 'success');
    } catch (err: any) {
      showToast('Test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Statutory Rule Engine Configuration</h1>
            <TagBadge type="rule" label="Configurable Logic" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure statutory eligibility operators, income ceilings, mark thresholds, and test rules against live records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSchemeId}
            onChange={(e) => handleSelectScheme(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-600"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Rules in Evaluation Matrix ({rules.length})
          </span>
          <span className="text-[11px] text-slate-400">Pure Deterministic Functions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{rule.criterion}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                    {rule.type}
                  </span>
                </div>
                <div className="text-slate-500 flex items-center gap-2 text-[11px]">
                  <span>Field/Doc: <code className="bg-slate-100 px-1 rounded">{rule.targetKey}</code></span>
                  <span>Operator: <code className="bg-slate-100 px-1 rounded">{rule.operator}</code></span>
                  <span>Value: <code className="bg-slate-100 px-1 rounded">{String(rule.expectedValue)}</code></span>
                  <span>Weight: <strong>{rule.weight} pts</strong></span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 self-end sm:self-center"
              >
                Delete Rule
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Rule Sandbox / Tester */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rule Simulator (Test on Live Application)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify how the current rule matrix evaluates against an actual applicant record.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={testAppId}
              onChange={(e) => setTestAppId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.applicationNumber} ({a.applicantName})
                </option>
              ))}
            </select>

            <button
              onClick={handleTestRules}
              disabled={testing}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{testing ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Simulation Overall Result:</span>
              <span className="font-bold text-emerald-800">{testResult.overallStatus}</span>
            </div>
            <p className="text-slate-600">{testResult.explanation}</p>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Statutory Eligibility Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Criterion Description *</label>
                <input
                  type="text"
                  required
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder="e.g. Minimum 60% in Master's degree"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Key *</label>
                  <input
                    type="text"
                    required
                    value={newTargetKey}
                    onChange={(e) => setNewTargetKey(e.target.value)}
                    placeholder="e.g. marksPercentage"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operator *</label>
                  <select
                    value={newOperator}
                    onChange={(e) => setNewOperator(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  >
                    <option value="equals">equals (==)</option>
                    <option value="notEquals">notEquals (!=)</option>
                    <option value="greaterThanOrEqual">greaterThanOrEqual (&gt;=)</option>
                    <option value="lessThanOrEqual">lessThanOrEqual (&lt;=)</option>
                    <option value="contains">contains</option>
                    <option value="documentExists">documentExists</option>
                    <option value="documentVerified">documentVerified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Threshold / Value *</label>
                  <input
                    type="text"
                    required
                    value={newExpectedValue}
                    onChange={(e) => setNewExpectedValue(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight Points</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save & Deploy Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
