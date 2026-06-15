import { X, FileText, Users, Calendar, Banknote, Brain, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import type { Report } from './mock-data';
import { translations, type Lang } from '../translations';

interface ReportPanelProps {
  report: Report | null;
  onClose: () => void;
  lang: Lang;
}

const priorityConfig = {
  high: { bg: 'rgba(192,57,43,0.1)', color: '#c0392b', border: 'rgba(192,57,43,0.25)' },
  medium: { bg: 'rgba(230,126,34,0.1)', color: '#e67e22', border: 'rgba(230,126,34,0.25)' },
  low: { bg: 'rgba(39,174,96,0.1)', color: '#27ae60', border: 'rgba(39,174,96,0.25)' },
};

const recommendationConfig = {
  'يتطلب تحقيقاً عاجلاً': { icon: <AlertTriangle size={15} />, bg: 'rgba(192,57,43,0.08)', color: '#c0392b', border: 'rgba(192,57,43,0.2)' },
  'يحتاج إلى مراجعة إضافية': { icon: <Info size={15} />, bg: 'rgba(230,126,34,0.08)', color: '#e67e22', border: 'rgba(230,126,34,0.2)' },
  'المعلومات غير كافية': { icon: <CheckCircle size={15} />, bg: 'rgba(107,114,128,0.08)', color: '#6b7280', border: 'rgba(107,114,128,0.2)' },
};

function CredibilityBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? '#005c2e' : value >= 60 ? '#e67e22' : '#c0392b';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm" style={{ color, fontWeight: 700 }}>{value}%</span>
        <span className="text-xs" style={{ color: '#5a7a62' }}>{label}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'rgba(0,92,46,0.1)' }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  );
}

export function ReportPanel({ report, onClose, lang }: ReportPanelProps) {
  if (!report) return null;
  const tr = translations[lang];
  const translateType = (type: string) => tr.typeNames?.[type] ?? type;
  const translateEntity = (entity: string) => tr.entityNames?.[entity] ?? entity;
  const translateRecommendation = (rec: string) => tr.recommendationNames?.[rec] ?? rec;
  const priority = priorityConfig[report.priority];
  const priorityLabel = tr[report.priority === 'high' ? 'priorityHigh' : report.priority === 'medium' ? 'priorityMedium' : 'priorityLow'];
  const rec = recommendationConfig[report.recommendation];

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="mr-auto h-full overflow-y-auto"
        style={{
          width: 'min(520px, 92vw)',
          background: 'linear-gradient(180deg, #f0f4f1 0%, #f5f8f6 100%)',
          borderRight: '1px solid rgba(0,92,46,0.12)',
          boxShadow: '-20px 0 60px rgba(0,92,46,0.12)',
        }}>

        {/* Panel Header */}
        <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(0,92,46,0.12)' }}>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:bg-black/5">
            <X size={18} style={{ color: '#5a7a62' }} />
          </button>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#5a7a62' }}>{tr.reportDetailsTitle}</p>
            <p className="text-sm" style={{ color: '#1a2e20', fontWeight: 700, fontFamily: 'monospace' }}>{report.id}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#5a7a62' }}>{tr.suspicionTypeLabel}</p>
              <p className="text-sm" style={{ color: '#1a2e20', fontWeight: 600 }}>{translateType(report.type)}</p>
            </div>
            <div className="rounded-xl p-4 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)' }}>
              <p className="text-xs mb-1" style={{ color: '#5a7a62' }}>{tr.submissionDate}</p>
              <p className="text-sm" style={{ color: '#1a2e20', fontWeight: 600 }} dir="ltr">{report.date}</p>
            </div>
          </div>

          {/* Priority & Credibility */}
          <div className="rounded-xl p-5 space-y-4 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`, fontWeight: 600 }}>
                {priorityLabel}
              </span>
              <span className="text-xs" style={{ color: '#5a7a62' }}>{tr.priorityLevel}</span>
            </div>
            <CredibilityBar value={report.credibility} label={tr.credibilityLabel} />
          </div>

          {/* AI Analysis */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(0,92,46,0.04)', border: '1px solid rgba(0,92,46,0.12)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e8f0eb' }}>
                <Brain size={14} style={{ color: '#005c2e' }} />
              </div>
              <h3 className="text-sm" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.aiAnalysis}</h3>
            </div>

            <p className="text-sm mb-5 leading-relaxed" style={{ color: '#3d6b47' }}>{report.aiSummary}</p>

            <div className="space-y-4">
              {report.evidence.length > 0 && (
                <AnalysisSection icon={<FileText size={13} />} title={tr.evidenceExtracted} color="#2980b9">
                  {report.evidence.map((e, i) => <Tag key={i} label={e} color="#2980b9" />)}
                </AnalysisSection>
              )}
              {report.entities.length > 0 && (
                <AnalysisSection icon={<Users size={13} />} title={tr.entitiesMentioned} color="#8e44ad">
                  {report.entities.map((e, i) => <Tag key={i} label={e} color="#8e44ad" />)}
                </AnalysisSection>
              )}
              {report.dates.length > 0 && (
                <AnalysisSection icon={<Calendar size={13} />} title={tr.importantDates} color="#c8a826">
                  {report.dates.map((d, i) => <Tag key={i} label={d} color="#c8a826" />)}
                </AnalysisSection>
              )}
              {report.amounts.length > 0 && (
                <AnalysisSection icon={<Banknote size={13} />} title={tr.amountsMentioned} color="#c0392b">
                  {report.amounts.map((a, i) => <Tag key={i} label={a} color="#c0392b" />)}
                </AnalysisSection>
              )}
            </div>
          </div>

          {/* Priority Factors */}
          {report.factors.length > 0 && (
            <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid rgba(0,92,46,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} style={{ color: '#005c2e' }} />
                <h3 className="text-sm" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.priorityFactors}</h3>
              </div>
              <div className="space-y-2">
                {report.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-end gap-2 text-sm" style={{ color: '#3d6b47' }}>
                    <span>{f}</span>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e8f0eb' }}>
                      <CheckCircle size={10} style={{ color: '#005c2e' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="rounded-xl p-5 flex items-start gap-3" style={{ background: rec.bg, border: `1px solid ${rec.border}` }}>
            <span style={{ color: rec.color, marginTop: '2px' }}>{rec.icon}</span>
            <div className="text-right flex-1">
              <p className="text-xs mb-0.5" style={{ color: `${rec.color}99` }}>{tr.systemRecommendation}</p>
              <p className="text-sm" style={{ color: rec.color, fontWeight: 700 }}>{report.recommendation}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button className="py-3 rounded-xl text-sm transition-all hover:opacity-90"
              style={{ background: '#e8f0eb', color: '#005c2e', border: '1px solid rgba(0,92,46,0.2)', fontWeight: 600 }}>
              {tr.assignInvestigator}
            </button>
            <button className="py-3 rounded-xl text-sm transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #005c2e, #00894a)', color: '#ffffff', fontWeight: 600 }}>
              {tr.openInvestigation}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisSection({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-end gap-1.5 mb-2">
        <p className="text-xs" style={{ color: `${color}cc`, fontWeight: 600 }}>{title}</p>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">{children}</div>
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: `${color}15`, color: `${color}dd`, border: `1px solid ${color}25` }}>
      {label}
    </span>
  );
}
