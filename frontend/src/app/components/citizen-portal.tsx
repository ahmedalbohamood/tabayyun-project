import { useState, useRef } from 'react';
import {
  Shield, Upload, FileText, Image, Film, File, X, CheckCircle2,
  AlertCircle, Lock, Eye, EyeOff, ChevronDown, Building2, MapPin, Calendar,
  User, Phone, Mail, IdCard, ClipboardList,
} from 'lucide-react';
import { translations, type Lang } from '../translations';

interface ReportFormData {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  isAnonymous: boolean;
  reportTitle: string;
  suspicionType: string;
  description: string;
  entity: string;
  city: string;
  incidentDate: string;
}

const cities = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'القطيف', 'الطائف', 'أبها', 'تبوك', 'نجران', 'حائل', 'جازان', 'بريدة', 'القصيم', 'الجوف'];
const entities = [
  'وزارة التعليم', 'وزارة الصحة', 'وزارة الداخلية', 'وزارة المالية', 'وزارة التجارة',
  'وزارة الإسكان', 'وزارة العمل', 'وزارة النقل', 'أمانة منطقة الرياض', 'أمانة منطقة جدة',
  'أمانة المنطقة الشرقية', 'هيئة الزكاة والضريبة والجمارك', 'هيئة السوق المالية',
  'شركة أرامكو السعودية', 'الهيئة العامة للاستثمار', 'أخرى',
];

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export function CitizenPortal({ lang }: { lang: Lang }) {
  const tr = translations[lang];

  const [form, setForm] = useState<ReportFormData>({
    fullName: '',
    idNumber: '',
    email: '',
    phone: '',
    isAnonymous: false,
    reportTitle: '',
    suspicionType: '',
    description: '',
    entity: '',
    city: '',
    incidentDate: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateForm = (field: keyof ReportFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.isAnonymous) {
      if (!form.fullName.trim()) e.fullName = tr.errors.fullName;
      if (!form.idNumber.trim()) e.idNumber = tr.errors.idNumber;
      if (!form.email.trim()) e.email = tr.errors.email;
      if (!form.phone.trim()) e.phone = tr.errors.phone;
    }

    if (!form.reportTitle.trim()) e.reportTitle = tr.errors.reportTitle;
    if (!form.suspicionType) e.suspicionType = tr.errors.suspicionType;
    if (!form.description.trim() || form.description.length < 50) e.description = tr.errors.description;
    if (!form.entity) e.entity = tr.errors.entity;
    if (!form.city) e.city = tr.errors.city;
    if (!form.incidentDate) e.incidentDate = tr.errors.incidentDate;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = new window.FormData();

      payload.append('full_name', form.isAnonymous ? '' : form.fullName);
      payload.append('national_id', form.isAnonymous ? '' : form.idNumber);
      payload.append('email', form.isAnonymous ? '' : form.email);
      payload.append('phone', form.isAnonymous ? '' : form.phone);
      payload.append('is_anonymous', String(form.isAnonymous));

      payload.append('title', form.reportTitle);
      payload.append('description', form.description);
      payload.append('user_selected_category', form.suspicionType);

      payload.append('government_entity', form.entity);
      payload.append('city', form.city);
      payload.append('incident_date', form.incidentDate);

      if (files.length > 0) {
        payload.append('attachment', files[0].file);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/api/reports`, {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const data = await response.json();
      setReferenceNumber(data.report_number);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setSubmitError('حدث خطأ أثناء إرسال البلاغ. تأكدي أن الباك إند يعمل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const addFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const resetForm = () => {
    setSubmitted(false);
    setReferenceNumber('');
    setSubmitError('');
    setForm({
      fullName: '',
      idNumber: '',
      email: '',
      phone: '',
      isAnonymous: false,
      reportTitle: '',
      suspicionType: '',
      description: '',
      entity: '',
      city: '',
      incidentDate: '',
    });
    setFiles([]);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type === 'application/pdf') return <FileText size={16} className="text-red-500" />;
    if (type.startsWith('video/')) return <Film size={16} className="text-purple-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const formatSize = (b: number) =>
    b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16"
        style={{ background: 'linear-gradient(135deg, #f0f4f1 0%, #e8f0eb 100%)' }}>
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center"
          style={{ border: '1px solid rgba(0,92,46,0.12)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #005c2e, #00894a)' }}>
            <CheckCircle2 size={40} className="text-white" />
          </div>

          <h2 className="text-2xl mb-2" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.successTitle}</h2>
          <p className="text-sm mb-8" style={{ color: '#5a7a62' }}>{tr.successDesc}</p>

          <div className="rounded-xl p-6 mb-6 text-right" style={{ background: '#f0f4f1', border: '1px solid rgba(0,92,46,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#e8f0eb', color: '#005c2e', fontWeight: 600 }}>
                {tr.received}
              </span>
              <span className="text-xs" style={{ color: '#5a7a62' }}>{tr.reportStatus}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg" style={{ color: '#005c2e', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {referenceNumber}
              </span>
              <span className="text-xs" style={{ color: '#5a7a62' }}>{tr.referenceNumber}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl p-4 text-right" style={{ background: '#fff8e8', border: '1px solid rgba(200,168,38,0.25)' }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#c8a826' }} />
            <p className="text-xs" style={{ color: '#7a6010' }}>{tr.keepRef}</p>
          </div>

          <button
            onClick={resetForm}
            className="mt-6 w-full py-3 rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #005c2e, #00894a)', fontWeight: 600 }}>
            {tr.submitAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0f4f1 0%, #e8f0eb 60%, #f5f8f6 100%)' }}>
      <header className="sticky top-0 z-20 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(0,92,46,0.12)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #005c2e, #00894a)' }}>
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <div className="text-lg" style={{ color: '#005c2e', fontWeight: 800, lineHeight: 1.1 }}>{tr.platformName}</div>
              <div className="text-xs" style={{ color: '#5a7a62' }}>{tr.authoritySubtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: '#e8f0eb', color: '#005c2e' }}>
            <Lock size={12} />
            <span>{tr.secureConnection}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-10 pb-8 text-right">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(0,92,46,0.2))' }} />
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,92,46,0.08)', color: '#005c2e', fontWeight: 600 }}>
            {tr.officialPlatform}
          </span>
        </div>
        <h1 className="text-3xl mb-3" style={{ color: '#1a2e20', fontWeight: 800 }}>
          {tr.heroTitle}
        </h1>
        <p className="text-base max-w-2xl" style={{ color: '#5a7a62', lineHeight: 1.8 }}>
          {tr.heroDesc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <section className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f0eb' }}>
                <User size={16} style={{ color: '#005c2e' }} />
              </div>
              <h2 className="text-lg" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.personalInfo}</h2>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span className="text-sm" style={{ color: form.isAnonymous ? '#005c2e' : '#5a7a62', fontWeight: 600 }}>{tr.anonymous}</span>
              <div
                onClick={() => updateForm('isAnonymous', !form.isAnonymous)}
                className="relative w-12 h-6 rounded-full transition-all"
                style={{ background: form.isAnonymous ? '#005c2e' : '#dce8e0', cursor: 'pointer' }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ right: form.isAnonymous ? '26px' : '4px' }} />
              </div>
              {form.isAnonymous ? <EyeOff size={14} style={{ color: '#005c2e' }} /> : <Eye size={14} style={{ color: '#9ca3af' }} />}
            </label>
          </div>

          {form.isAnonymous ? (
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: '#f0f4f1', border: '1px solid rgba(0,92,46,0.15)' }}>
              <Lock size={16} className="mt-0.5 shrink-0" style={{ color: '#005c2e' }} />
              <p className="text-sm" style={{ color: '#3d6b47' }}>{tr.anonymousNote}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label={tr.fullName} icon={<User size={14} />} error={errors.fullName}>
                <input type="text" placeholder={tr.fullNamePlaceholder} value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right" style={{ background: '#f5f8f6', border: `1px solid ${errors.fullName ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: '#1a2e20' }} />
              </Field>

              <Field label={tr.idNumber} icon={<IdCard size={14} />} error={errors.idNumber}>
                <input type="text" placeholder={tr.idPlaceholder} value={form.idNumber} onChange={e => updateForm('idNumber', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right" style={{ background: '#f5f8f6', border: `1px solid ${errors.idNumber ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: '#1a2e20' }} />
              </Field>

              <Field label={tr.email} icon={<Mail size={14} />} error={errors.email}>
                <input type="email" placeholder="example@domain.com" dir="ltr" value={form.email} onChange={e => updateForm('email', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-left" style={{ background: '#f5f8f6', border: `1px solid ${errors.email ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: '#1a2e20' }} />
              </Field>

              <Field label={tr.phone} icon={<Phone size={14} />} error={errors.phone}>
                <input type="tel" placeholder="05XXXXXXXX" dir="ltr" value={form.phone} onChange={e => updateForm('phone', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-left" style={{ background: '#f5f8f6', border: `1px solid ${errors.phone ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: '#1a2e20' }} />
              </Field>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f0eb' }}>
              <ClipboardList size={16} style={{ color: '#005c2e' }} />
            </div>
            <h2 className="text-lg" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.reportDetails}</h2>
          </div>

          <div className="space-y-5">
            <Field label={tr.reportTitle} error={errors.reportTitle}>
              <input type="text" placeholder={tr.reportTitlePlaceholder} value={form.reportTitle} onChange={e => updateForm('reportTitle', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right" style={{ background: '#f5f8f6', border: `1px solid ${errors.reportTitle ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: '#1a2e20' }} />
            </Field>

            <Field label={tr.suspicionType} error={errors.suspicionType}>
              <div className="relative">
                <select value={form.suspicionType} onChange={e => updateForm('suspicionType', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right appearance-none cursor-pointer" style={{ background: '#f5f8f6', border: `1px solid ${errors.suspicionType ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: form.suspicionType ? '#1a2e20' : '#9ca3af' }}>
                  <option value="" disabled>{tr.suspicionTypePlaceholder}</option>
                  {tr.suspicionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5a7a62' }} />
              </div>
            </Field>

            <Field label={tr.description} error={errors.description}>
              <textarea rows={6} placeholder={tr.descriptionPlaceholder} value={form.description} onChange={e => updateForm('description', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right resize-none" style={{ background: '#f5f8f6', border: `1px solid ${errors.description ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: '#1a2e20', lineHeight: 1.8 }} />
              <div className="flex justify-between mt-1">
                {errors.description && <span className="text-xs" style={{ color: '#c0392b' }}>{errors.description}</span>}
                <span className="text-xs mr-auto" style={{ color: form.description.length >= 50 ? '#005c2e' : '#9ca3af' }}>
                  {tr.descCounter(form.description.length)}
                </span>
              </div>
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f0eb' }}>
              <Upload size={16} style={{ color: '#005c2e' }} />
            </div>
            <div>
              <h2 className="text-lg" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.uploadTitle}</h2>
              <p className="text-xs" style={{ color: '#5a7a62' }}>{tr.uploadSubtitle}</p>
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer transition-all"
            style={{
              border: `2px dashed ${isDragging ? '#005c2e' : 'rgba(0,92,46,0.25)'}`,
              background: isDragging ? 'rgba(0,92,46,0.04)' : '#fafcfb',
            }}>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={e => e.target.files && addFiles(Array.from(e.target.files))} />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: isDragging ? '#e8f0eb' : '#f0f4f1' }}>
              <Upload size={24} style={{ color: '#005c2e' }} />
            </div>
            <p className="text-sm mb-1" style={{ color: '#1a2e20', fontWeight: 600 }}>{tr.uploadDropText}</p>
            <p className="text-xs" style={{ color: '#5a7a62' }}>{tr.uploadFormats}</p>

            <div className="flex items-center justify-center gap-6 mt-5">
              {[
                { icon: <Image size={16} />, label: tr.images, color: '#2980b9' },
                { icon: <FileText size={16} />, label: tr.pdf, color: '#c0392b' },
                { icon: <File size={16} />, label: tr.docs, color: '#27ae60' },
                { icon: <Film size={16} />, label: tr.video, color: '#8e44ad' },
              ].map(({ icon, label, color }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#5a7a62' }}>
                  <span style={{ color }}>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(f => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#f5f8f6', border: '1px solid rgba(0,92,46,0.1)' }}>
                  <button type="button" onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                    <X size={14} style={{ color: '#c0392b' }} />
                  </button>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="text-sm" style={{ color: '#1a2e20', fontWeight: 500 }}>{f.name}</p>
                      <p className="text-xs" style={{ color: '#5a7a62' }}>{formatSize(f.size)}</p>
                    </div>
                    {getFileIcon(f.type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(0,92,46,0.1)', boxShadow: '0 2px 20px rgba(0,92,46,0.05)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e8f0eb' }}>
              <MapPin size={16} style={{ color: '#005c2e' }} />
            </div>
            <h2 className="text-lg" style={{ color: '#1a2e20', fontWeight: 700 }}>{tr.entityInfo}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label={tr.govEntity} icon={<Building2 size={14} />} error={errors.entity}>
              <div className="relative">
                <select value={form.entity} onChange={e => updateForm('entity', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right appearance-none cursor-pointer" style={{ background: '#f5f8f6', border: `1px solid ${errors.entity ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: form.entity ? '#1a2e20' : '#9ca3af' }}>
                  <option value="" disabled>{tr.entityPlaceholder}</option>
                  {entities.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5a7a62' }} />
              </div>
            </Field>

            <Field label={tr.city} icon={<MapPin size={14} />} error={errors.city}>
              <div className="relative">
                <select value={form.city} onChange={e => updateForm('city', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all text-right appearance-none cursor-pointer" style={{ background: '#f5f8f6', border: `1px solid ${errors.city ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: form.city ? '#1a2e20' : '#9ca3af' }}>
                  <option value="" disabled>{tr.cityPlaceholder}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5a7a62' }} />
              </div>
            </Field>

            <Field label={tr.incidentDate} icon={<Calendar size={14} />} error={errors.incidentDate}>
              <input type="date" value={form.incidentDate} onChange={e => updateForm('incidentDate', e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none transition-all" style={{ background: '#f5f8f6', border: `1px solid ${errors.incidentDate ? '#c0392b' : 'rgba(0,92,46,0.15)'}`, color: form.incidentDate ? '#1a2e20' : '#9ca3af', direction: 'ltr' }} />
            </Field>
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: 'rgba(0,92,46,0.04)', border: '1px solid rgba(0,92,46,0.12)' }}>
          <Shield size={16} className="mt-0.5 shrink-0" style={{ color: '#005c2e' }} />
          <p className="text-xs" style={{ color: '#3d6b47', lineHeight: 1.8 }}>{tr.privacyNote}</p>
        </div>

        {submitError && (
          <div className="rounded-xl p-4 text-right" style={{ background: '#fff0f0', border: '1px solid rgba(192,57,43,0.25)', color: '#c0392b' }}>
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl text-white text-lg transition-all hover:opacity-95 hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #005c2e 0%, #00894a 100%)', fontWeight: 700, boxShadow: '0 6px 30px rgba(0,92,46,0.35)' }}>
          {isSubmitting ? 'جاري إرسال البلاغ وتحليله...' : tr.submit}
        </button>
      </form>
    </div>
  );
}

function Field({ label, icon, error, children }: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <label className="flex items-center justify-end gap-1.5 mb-2 text-sm" style={{ color: '#1a2e20', fontWeight: 600 }}>
        {label}
        {icon && <span style={{ color: '#5a7a62' }}>{icon}</span>}
      </label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#c0392b' }}>{error}</p>}
    </div>
  );
}
