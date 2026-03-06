import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NAV_ITEMS } from '../constants';
import { ViewState } from '../types';
import { Settings, LogOut, Command, X } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

type ThemeKey = 'sky' | 'amber' | 'emerald' | 'zinc' | 'blue' | 'violet' | 'orange' | 'pink' | 'indigo' | 'cyan';
type DensityPreference = 'comfortable' | 'compact';
type PollingIntervalPreference = 10 | 30 | 60;

type SettingsState = {
  density: DensityPreference;
  pollingInterval: PollingIntervalPreference;
  defaultLandingView: ViewState;
};

const SETTINGS_STORAGE_KEY = 'devhub.preferences';

const defaultSettings: SettingsState = {
  density: 'comfortable',
  pollingInterval: 30,
  defaultLandingView: ViewState.DASHBOARD,
};

const themeColors: Record<ThemeKey, string> = {
  sky: 'text-sky-500 group-hover:text-sky-400',
  amber: 'text-amber-500 group-hover:text-amber-400',
  emerald: 'text-emerald-500 group-hover:text-emerald-400',
  zinc: 'text-zinc-200 group-hover:text-white',
  blue: 'text-blue-500 group-hover:text-blue-400',
  violet: 'text-violet-500 group-hover:text-violet-400',
  orange: 'text-orange-500 group-hover:text-orange-400',
  pink: 'text-pink-500 group-hover:text-pink-400',
  indigo: 'text-indigo-500 group-hover:text-indigo-400',
  cyan: 'text-cyan-500 group-hover:text-cyan-400',
};

const bgColors: Record<ThemeKey, string> = {
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/50',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/50',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50',
  zinc: 'bg-white/10 text-white border-white/50',
  blue: 'bg-blue-500/10 text-blue-300 border-blue-500/50',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/50',
  orange: 'bg-orange-500/10 text-orange-300 border-orange-500/50',
  pink: 'bg-pink-500/10 text-pink-300 border-pink-500/50',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/50',
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/50',
};

const sidebarSections = ['Overview', 'Build', 'Integrations', 'Operations'] as const;

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<SettingsState>(defaultSettings);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalTitleId = useMemo(() => `settings-title-${Math.random().toString(36).slice(2, 8)}`, []);
  const modalDescId = useMemo(() => `settings-description-${Math.random().toString(36).slice(2, 8)}`, []);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<SettingsState>;
      const nextSettings: SettingsState = {
        density: parsed.density === 'compact' ? 'compact' : 'comfortable',
        pollingInterval: parsed.pollingInterval === 10 || parsed.pollingInterval === 60 ? parsed.pollingInterval : 30,
        defaultLandingView: Object.values(ViewState).includes(parsed.defaultLandingView as ViewState)
          ? (parsed.defaultLandingView as ViewState)
          : ViewState.DASHBOARD,
      };
      setSettings(nextSettings);
      setDraftSettings(nextSettings);
    } catch (error) {
      console.warn('Failed to parse stored Dev Hub preferences', error);
    }
  }, []);

  useEffect(() => {
    if (!showSettingsModal) return;

    lastFocusedRef.current = document.activeElement as HTMLElement;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || []);
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowSettingsModal(false);
        return;
      }

      if (event.key !== 'Tab' || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [showSettingsModal]);

  useEffect(() => {
    if (!showSaveToast) return;
    const timer = setTimeout(() => setShowSaveToast(false), 2500);
    return () => clearTimeout(timer);
  }, [showSaveToast]);

  const openSettings = () => {
    setDraftSettings(settings);
    setShowSettingsModal(true);
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(draftSettings));
    setSettings(draftSettings);
    setShowSettingsModal(false);
    setShowSaveToast(true);
    window.dispatchEvent(new CustomEvent('devhub:preferences-updated', { detail: draftSettings }));
  };

  const groupItems = sidebarSections.map((section) => ({
    section,
    items: NAV_ITEMS.filter((item) => item.section === section),
  }));

  const navItemPaddingClass = settings.density === 'compact' ? 'py-2' : 'py-2.5';

  return (
    <aside className="w-[290px] bg-zinc-950/80 border-r border-white/5 flex flex-col h-full backdrop-blur-xl z-50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

      <div className="h-20 flex items-center px-6 shrink-0 relative z-10">
        <div className="w-8 h-8 bg-gradient-to-br from-zinc-100 to-zinc-400 rounded-lg flex items-center justify-center mr-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20">
          <Command className="text-black w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-white tracking-tight leading-none mb-1">Dev Hub</h1>
          <span className="text-[10px] text-zinc-400 font-medium tracking-wider">COMMAND CENTER</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-4 overflow-y-auto custom-scrollbar relative z-10" aria-label="Primary navigation">
        {groupItems.map(({ section, items }) => (
          <div key={section}>
            <div className="px-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{section}</div>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const theme: ThemeKey = item.theme || 'zinc';
                const activeClass = bgColors[theme];
                const iconColor = isActive ? 'text-current' : (themeColors[theme] || 'text-zinc-500');

                return (
                  <button
                    key={item.id}
                    onClick={() => onChangeView(item.id)}
                    aria-pressed={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.hint}
                    className={`w-full flex items-start px-3 ${navItemPaddingClass} rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden text-left
                      ${isActive
                        ? `${activeClass} border-l-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100 border-l-2 border-transparent'
                      }`}
                  >
                    {isActive && <div className="absolute inset-0 opacity-10 bg-current pointer-events-none" />}
                    <Icon className={`w-4 h-4 mr-3 mt-0.5 transition-colors ${iconColor}`} />
                    <div>
                      <div className="leading-tight">{item.label}</div>
                      <div className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'text-current/80' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                        {item.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black to-zinc-900/50 relative z-10">
        <button
          onClick={openSettings}
          className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors mb-1"
        >
          <Settings className="w-4 h-4 mr-3 text-zinc-500" />
          Settings
        </button>
        <button
          onClick={() => {
            alert('Sign out is not connected yet. Add auth provider integration to enable this action.');
          }}
          className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3 text-zinc-500" />
          Sign Out
        </button>

        <div className="mt-6 px-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-zinc-300 font-medium tracking-wide uppercase">System Online</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">v2.6.0</span>
        </div>
      </div>

      {showSaveToast && (
        <div className="absolute bottom-24 left-4 right-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-3 py-2 text-xs font-semibold z-[60]">
          Preferences saved successfully.
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescId}
            className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id={modalTitleId} className="text-lg font-bold text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-zinc-300" />
                Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p id={modalDescId} className="text-xs text-zinc-400 mb-4">Customize your workspace defaults and performance behavior.</p>

            <div className="space-y-4">
              <div className="p-4 bg-black/30 border border-white/10 rounded-lg">
                <label className="text-sm font-medium text-white mb-2 block" htmlFor="density-select">Display Density</label>
                <select
                  id="density-select"
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-100"
                  value={draftSettings.density}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, density: e.target.value as DensityPreference }))}
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>

              <div className="p-4 bg-black/30 border border-white/10 rounded-lg">
                <label className="text-sm font-medium text-white mb-2 block" htmlFor="polling-select">System polling interval</label>
                <select
                  id="polling-select"
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-100"
                  value={draftSettings.pollingInterval}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, pollingInterval: Number(e.target.value) as PollingIntervalPreference }))}
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              <div className="p-4 bg-black/30 border border-white/10 rounded-lg">
                <label className="text-sm font-medium text-white mb-2 block" htmlFor="landing-view-select">Default landing view</label>
                <select
                  id="landing-view-select"
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-100"
                  value={draftSettings.defaultLandingView}
                  onChange={(e) => setDraftSettings((prev) => ({ ...prev, defaultLandingView: e.target.value as ViewState }))}
                >
                  {NAV_ITEMS.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-zinc-900/30 border border-white/10 rounded-lg opacity-70 cursor-not-allowed">
                <h4 className="text-sm font-medium text-white mb-1">API key manager</h4>
                <p className="text-xs text-zinc-400">Coming soon. This feature will be enabled after secure vault integration.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
