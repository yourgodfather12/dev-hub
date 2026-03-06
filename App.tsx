import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ArchiPanel from './components/ArchiPanel';
import AIEngineer from './components/AIEngineer';
import SupabasePanel from './components/SupabasePanel';
import VercelPanel from './components/VercelPanel';
import DockerPanel from './components/DockerPanel';
import StripePanel from './components/StripePanel';
import HuggingFacePanel from './components/HuggingFacePanel';
import ProjectWorkshop from './components/ProjectWorkshop';
import ProjectStudio from './components/ProjectStudio';
import { ViewState } from './types';

const SETTINGS_STORAGE_KEY = 'devhub.preferences';

const viewComponents: Record<ViewState, React.FC> = {
  [ViewState.DASHBOARD]: Dashboard,
  [ViewState.ARCHI]: ArchiPanel,
  [ViewState.APP_IDEAS]: AIEngineer,
  [ViewState.SUPABASE]: SupabasePanel,
  [ViewState.VERCEL]: VercelPanel,
  [ViewState.DOCKER]: DockerPanel,
  [ViewState.STRIPE]: StripePanel,
  [ViewState.HUGGING_FACE]: HuggingFacePanel,
  [ViewState.PROJECT_WORKSHOP]: ProjectWorkshop,
  [ViewState.PROJECT_STUDIO]: ProjectStudio,
};

const resolveInitialView = (): ViewState => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return ViewState.DASHBOARD;
    const parsed = JSON.parse(stored) as { defaultLandingView?: ViewState };
    if (parsed.defaultLandingView && Object.values(ViewState).includes(parsed.defaultLandingView)) {
      return parsed.defaultLandingView;
    }
  } catch (error) {
    console.warn('Unable to load stored Dev Hub preferences', error);
  }
  return ViewState.DASHBOARD;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(() => resolveInitialView());

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ defaultLandingView?: ViewState }>;
      const nextView = customEvent.detail?.defaultLandingView;
      if (nextView && Object.values(ViewState).includes(nextView)) {
        setCurrentView(nextView);
      }
    };

    window.addEventListener('devhub:preferences-updated', handler);
    return () => window.removeEventListener('devhub:preferences-updated', handler);
  }, []);

  const ViewComponent = viewComponents[currentView] ?? Dashboard;

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-200 font-sans overflow-hidden selection:bg-white/20 relative">
      <div className="noise-bg" />
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 relative h-full overflow-hidden bg-black">
        <ViewComponent />
      </main>
    </div>
  );
};

export default App;
