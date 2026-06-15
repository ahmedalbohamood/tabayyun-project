import { useState } from 'react';
import { Shield, LayoutDashboard, Users, Languages } from 'lucide-react';
import { CitizenPortal } from './components/citizen-portal';
import { InvestigatorDashboard } from './components/investigator-dashboard';
import { translations, type Lang } from './translations';

type View = 'citizen' | 'investigator';

export default function App() {
  const [view, setView] = useState<View>('citizen');
  const [lang, setLang] = useState<Lang>('ar');
  const tr = translations[lang];

  return (
    <div dir={tr.dir} style={{ fontFamily: "'Cairo', sans-serif", minHeight: '100vh' }}>
      {/* Top navigation bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2"
        style={{ background: '#020c05', borderBottom: '1px solid rgba(0,180,60,0.12)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#005c2e,#00894a)' }}>
            <Shield size={14} className="text-white" />
          </div>
          <span style={{ color: '#e8f0eb', fontWeight: 800, fontSize: 15 }}>{tr.platformName}</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,180,60,0.1)', color: '#00b450', fontWeight: 500, fontSize: 10 }}>
            {tr.nationalSystem}
          </span>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => setView('citizen')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: view === 'citizen' ? 'linear-gradient(135deg,#005c2e,#007a3d)' : 'transparent',
              color: view === 'citizen' ? '#ffffff' : '#5a8a65',
              fontWeight: view === 'citizen' ? 700 : 500,
            }}>
            <Users size={13} />
            <span>{tr.citizenPortalTab}</span>
          </button>
          <button
            onClick={() => setView('investigator')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: view === 'investigator' ? 'linear-gradient(135deg,#005c2e,#007a3d)' : 'transparent',
              color: view === 'investigator' ? '#ffffff' : '#5a8a65',
              fontWeight: view === 'investigator' ? 700 : 500,
            }}>
            <LayoutDashboard size={13} />
            <span>{tr.investigatorTab}</span>
          </button>
        </div>

        {/* Right side: lang toggle + version */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(0,180,60,0.1)', color: '#00b450', border: '1px solid rgba(0,180,60,0.2)', fontWeight: 600 }}>
            <Languages size={12} />
            <span>{tr.switchLang}</span>
          </button>
          <div className="text-xs" style={{ color: '#3d6b47' }}>{tr.version}</div>
        </div>
      </div>

      {/* Content offset for nav */}
      <div style={{ paddingTop: '44px' }}>
        {view === 'citizen' ? <CitizenPortal lang={lang} /> : <InvestigatorDashboard lang={lang} />}
      </div>
    </div>
  );
}
