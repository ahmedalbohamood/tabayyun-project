import { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, AlertCircle, BarChart2, ChevronDown,
  FileWarning, Inbox, Clock, CheckCheck, Activity, ChevronLeft,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { monthlyData, typeDistribution, type Report } from './mock-data';
import { ReportPanel } from './report-panel';
import { translations, type Lang } from '../translations';

const priorityConfig = {
  high: { bg: 'rgba(192,57,43,0.12)', color: '#e74c3c', dot: '#e74c3c' },
  medium: { bg: 'rgba(230,126,34,0.12)', color: '#f39c12', dot: '#f39c12' },
  low: { bg: 'rgba(39,174,96,0.12)', color: '#2ecc71', dot: '#2ecc71' },
};

const statusConfig: Record<string, { bg: string; color: string }> = {
  'جديد': { bg: 'rgba(41,128,185,0.12)', color: '#3498db' },
  'قيد التحقيق': { bg: 'rgba(230,126,34,0.12)', color: '#f39c12' },
  'قيد المراجعة': { bg: 'rgba(142,68,173,0.12)', color: '#9b59b6' },
  'مغلق': { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' },
  'محوّل': { bg: 'rgba(0,180,80,0.12)', color: '#2ecc71' },
  'يتطلب تحقيقاً عاجلاً': { bg: 'rgba(192,57,43,0.12)', color: '#e74c3c' },
  'معالجة روتينية': { bg: 'rgba(39,174,96,0.12)', color: '#2ecc71' },
};

type ApiReport = {
  id: number;
  report_number: string;
  title: string;
  description: string;
  full_name?: string | null;
  is_anonymous: boolean;
  user_selected_category?: string | null;
  ai_category?: string | null;
  government_entity?: string | null;
  city?: string | null;
  attachment_path?: string | null;
  readiness_score: number;
  priority?: string | null;
  status?: string | null;
  analysis_summary?: string | null;
  system_recommendation?: string | null;
  extracted_evidence: string[];
  mentioned_entities: string[];
  important_dates: string[];
  financial_amounts: string[];
  priority_reasons: string[];
  created_at: string;
};

function mapPriority(priority?: string | null): Report['priority'] {
  if (priority === 'عالية') return 'high';
  if (priority === 'متوسطة') return 'medium';
  return 'low';
}

function mapRecommendation(value?: string | null): Report['recommendation'] {
  if (value === 'يتطلب تحقيقاً عاجلاً') return 'يتطلب تحقيقاً عاجلاً';
  if (value === 'معالجة روتينية') return 'المعلومات غير كافية';
  return 'يحتاج إلى مراجعة إضافية';
}

function formatDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ar-SA');
}

function toDashboardReport(r: ApiReport): Report {
  return {
    id: r.report_number,
    type: r.ai_category || r.user_selected_category || 'غير واضح',
    credibility: r.readiness_score || 0,
    priority: mapPriority(r.priority),
    status: (r.status as Report['status']) || 'جديد',
    date: formatDate(r.created_at),
    entity: r.government_entity || 'غير محدد',
    city: r.city || 'غير محدد',
    description: r.description,
    submitter: r.is_anonymous ? 'مجهول' : (r.full_name || 'غير محدد'),
    attachments: r.attachment_path ? 1 : 0,
    aiSummary: r.analysis_summary || 'لا يوجد ملخص متاح.',
    evidence: r.extracted_evidence || [],
    entities: r.mentioned_entities || [],
    dates: r.important_dates || [],
    amounts: r.financial_amounts || [],
    factors: r.priority_reasons || [],
    recommendation: mapRecommendation(r.system_recommendation || r.status),
  };
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden bg-white"
      style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="text-right">
          <p className="text-3xl" style={{ color: '#1a2e20', fontWeight: 800, lineHeight: 1 }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: `${color}99` }}>{sub}</p>}
        </div>
      </div>
      <p className="text-xs text-right" style={{ color: '#5a7a62' }}>{label}</p>
    </div>
  );
}

const LightTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-right bg-white" style={{ border: '1px solid rgba(0,92,46,0.2)', boxShadow: '0 8px 24px rgba(0,92,46,0.12)' }}>
      <p className="text-xs mb-1" style={{ color: '#5a7a62' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: <span style={{ fontWeight: 700 }}>{p.value}</span></p>
      ))}
    </div>
  );
};

export function InvestigatorDashboard({ lang }: { lang: Lang }) {
  const tr = translations[lang];

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(tr.filterAll);
  const [priorityFilter, setPriorityFilter] = useState(tr.filterAll);
  const [showCharts, setShowCharts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/api/reports`);

        if (!response.ok) {
          throw new Error('Failed to load reports');
        }

        const data: ApiReport[] = await response.json();
        setReports(data.map(toDashboardReport));
      } catch (error) {
        console.error(error);
        setLoadError('تعذر تحميل البلاغات من الباك إند.');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const translateType = (type: string) => tr.typeNames?.[type] ?? type;
  const translateEntity = (entity: string) => tr.entityNames?.[entity] ?? entity;
  const translateStatus = (status: string) => tr.statusNames?.[status] ?? status;
  const translateMonth = (month: string) => tr.monthNames?.[month] ?? month;

  const translatedMonthlyData = monthlyData.map(d => ({ ...d, month: translateMonth(d.month) }));
  const translatedTypeDistribution = typeDistribution.map(t => ({ ...t, name: translateType(t.name) }));

  const suspicionTypes = [tr.filterAll, ...tr.suspicionTypes];
  const priorityFilters = [tr.filterAll, tr.filterHigh, tr.filterMedium, tr.filterLow];

  const priorityLabels = {
    high: tr.priorityHigh,
    medium: tr.priorityMedium,
    low: tr.priorityLow,
  };

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const displayType = translateType(r.type);
      const displayEntity = translateEntity(r.entity);

      const matchSearch =
        !search ||
        r.id.includes(search) ||
        displayType.includes(search) ||
        displayEntity.includes(search) ||
        r.type.includes(search) ||
        r.entity.includes(search);

      const matchType = typeFilter === tr.filterAll || displayType === typeFilter || r.type === typeFilter;

      const matchPriority =
        priorityFilter === tr.filterAll ||
        (priorityFilter === tr.filterHigh && r.priority === 'high') ||
        (priorityFilter === tr.filterMedium && r.priority === 'medium') ||
        (priorityFilter === tr.filterLow && r.priority === 'low');

      return matchSearch && matchType && matchPriority;
    });
  }, [reports, search, typeFilter, priorityFilter, tr]);

  const stats = {
    total: reports.length,
    high: reports.filter(r => r.priority === 'high').length,
    medium: reports.filter(r => r.priority === 'medium').length,
    low: reports.filter(r => r.priority === 'low').length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0f4f1 0%, #e8f0eb 60%, #f5f8f6 100%)' }}>
      <header className="sticky top-0 z-20 px-6 py-4 backdrop-blur-sm"
        style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(0,92,46,0.12)' }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: '#e8f0eb', color: '#005c2e', border: '1px solid rgba(0,92,46,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00b450' }} />
              <span>{tr.systemOnline}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-sm" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.dashboardTitle}</p>
              <p className="text-xs" style={{ color: '#5a7a62' }}>{tr.dashboardSubtitle}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #005c2e, #00894a)' }}>
              <Activity size={18} className="text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {loadError && (
          <div className="rounded-xl p-4 text-right bg-white" style={{ border: '1px solid rgba(192,57,43,0.25)', color: '#c0392b' }}>
            {loadError}
          </div>
        )}

        {loading && (
          <div className="rounded-xl p-4 text-right bg-white" style={{ border: '1px solid rgba(0,92,46,0.12)', color: '#005c2e' }}>
            جاري تحميل البلاغات...
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={tr.totalReports} value={stats.total} icon={<Inbox size={16} />} color="#3b82f6" sub={tr.thisMonth} />
          <StatCard label={tr.highPriority} value={stats.high} icon={<AlertCircle size={16} />} color="#e74c3c" sub={tr.highPrioritySub} />
          <StatCard label={tr.mediumPriority} value={stats.medium} icon={<Clock size={16} />} color="#f39c12" sub={tr.mediumPrioritySub} />
          <StatCard label={tr.lowPriority} value={stats.low} icon={<CheckCheck size={16} />} color="#2ecc71" sub={tr.lowPrioritySub} />
        </div>

        <div>
          <button
            onClick={() => setShowCharts(v => !v)}
            className="flex items-center gap-2 mb-4 text-sm transition-all"
            style={{ color: '#005c2e' }}>
            <ChevronDown size={14} className="transition-transform" style={{ transform: showCharts ? 'rotate(0)' : 'rotate(-90deg)' }} />
            <BarChart2 size={14} />
            <span style={{ fontWeight: 600 }}>{tr.chartsLabel}</span>
          </button>

          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
                <p className="text-sm text-right mb-4" style={{ color: '#1a2e20', fontWeight: 600 }}>{tr.monthlyChart}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={translatedMonthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,92,46,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: '#5a7a62', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5a7a62', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<LightTooltip />} />
                    <Bar dataKey="high" name={tr.filterHigh} fill="#e74c3c" radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="medium" name={tr.filterMedium} fill="#f39c12" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="low" name={tr.filterLow} fill="#27ae60" radius={[3, 3, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
                <p className="text-sm text-right mb-4" style={{ color: '#1a2e20', fontWeight: 600 }}>{tr.typeChart}</p>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={translatedTypeDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                      {translatedTypeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<LightTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                  {translatedTypeDistribution.map(t => (
                    <div key={t.name} className="flex items-center justify-end gap-1.5 text-xs" style={{ color: '#3d6b47' }}>
                      <span>{t.name} ({t.value}%)</span>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-2 flex-wrap">
            <FilterDropdown label={tr.filterType} options={suspicionTypes} value={typeFilter} onChange={v => setTypeFilter(v)} />
            <FilterDropdown label={tr.filterPriority} options={priorityFilters} value={priorityFilter} onChange={v => setPriorityFilter(v)} />
          </div>

          <div className="relative flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder={tr.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl text-right outline-none"
              style={{ background: '#f5f8f6', border: '1px solid rgba(0,92,46,0.15)', color: '#1a2e20', fontSize: 13 }}
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#5a7a62' }} />
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: '#5a7a62', whiteSpace: 'nowrap' }}>
            <FileWarning size={13} />
            <span>{tr.reportCount(filtered.length)}</span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#e8f0eb', borderBottom: '1px solid rgba(0,92,46,0.12)' }}>
                  {tr.tableHeaders.map((h, i) => (
                    <th key={i} className="px-4 py-3 text-right text-xs whitespace-nowrap" style={{ color: '#005c2e', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((report, idx) => {
                  const p = priorityConfig[report.priority];
                  const pLabel = priorityLabels[report.priority];
                  const s = statusConfig[report.status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' };

                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="cursor-pointer transition-all"
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#fafcfb',
                        borderBottom: '1px solid rgba(0,92,46,0.06)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,92,46,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafcfb')}>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono" style={{ color: '#005c2e' }}>{report.id}</span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm" style={{ color: '#1a2e20', fontWeight: 500 }}>{translateType(report.type)}</span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs" style={{ color: '#3d6b47' }}>{translateEntity(report.entity)}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm" style={{ color: report.credibility >= 80 ? '#2ecc71' : report.credibility >= 60 ? '#f39c12' : '#e74c3c', fontWeight: 700 }}>
                            {report.credibility}%
                          </span>
                          <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(0,92,46,0.1)' }}>
                            <div className="h-1.5 rounded-full" style={{
                              width: `${report.credibility}%`,
                              background: report.credibility >= 80 ? '#2ecc71' : report.credibility >= 60 ? '#f39c12' : '#e74c3c'
                            }} />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: p.bg, color: p.color, fontWeight: 600 }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5" style={{ background: p.dot }} />
                          {pLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color, fontWeight: 500 }}>
                          {translateStatus(report.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-mono" style={{ color: '#5a7a62' }}>{report.date}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <ChevronLeft size={14} style={{ color: '#9ca3af' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center" style={{ color: '#5a7a62' }}>
                <Inbox size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">{tr.noResults}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs" style={{ color: '#5a7a62' }}>{tr.lastUpdated}</span>
            <p className="text-sm text-right" style={{ color: '#1a2e20', fontWeight: 600 }}>{tr.recentLog}</p>
          </div>

          <div className="space-y-2">
            {reports.slice(0, 5).map(r => {
              const p = priorityConfig[r.priority];
              const pLabel = priorityLabels[r.priority];

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-black/5">
                  <div className="flex items-center gap-2">
                    <ChevronLeft size={12} style={{ color: '#9ca3af' }} />
                    <span className="text-xs font-mono" style={{ color: '#5a7a62' }}>{r.date}</span>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color, fontWeight: 600 }}>{pLabel}</span>
                    <span className="text-xs" style={{ color: '#3d6b47' }}>{translateType(r.type)} — {translateEntity(r.entity)}</span>
                    <span className="text-xs font-mono" style={{ color: '#005c2e' }}>{r.id}</span>
                  </div>
                </div>
              );
            })}

            {reports.length === 0 && !loading && (
              <p className="text-sm text-center py-4" style={{ color: '#5a7a62' }}>
                لا توجد بلاغات حقيقية بعد.
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedReport && (
        <ReportPanel report={selectedReport} onClose={() => setSelectedReport(null)} lang={lang} />
      )}
    </div>
  );
}

function FilterDropdown({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-4 py-2.5 rounded-xl text-right appearance-none cursor-pointer text-xs outline-none"
        style={{ background: '#f5f8f6', border: '1px solid rgba(0,92,46,0.15)', color: '#1a2e20' }}>
        {options.map(o => <option key={o} value={o} style={{ background: '#ffffff', color: '#1a2e20' }}>{o}</option>)}
      </select>
      <Filter size={11} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5a7a62' }} />
    </div>
  );
}