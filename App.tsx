import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIEngineer from './components/AIEngineer';
import APIExplorer from './components/APIExplorer';
import SupabasePanel from './components/SupabasePanel';
import VercelPanel from './components/VercelPanel';
import DockerPanel from './components/DockerPanel';
import StripePanel from './components/StripePanel';
import HuggingFacePanel from './components/HuggingFacePanel';
import { ViewState } from './types';

const viewComponents: Record<ViewState, React.FC> = {
  [ViewState.DASHBOARD]: Dashboard,
  [ViewState.APP_IDEAS]: AIEngineer,
  [ViewState.API_EXPLORER]: APIExplorer,
  [ViewState.SUPABASE]: SupabasePanel,
  [ViewState.VERCEL]: VercelPanel,
  [ViewState.DOCKER]: DockerPanel,
  [ViewState.STRIPE]: StripePanel,
  [ViewState.HUGGING_FACE]: HuggingFacePanel,
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  const ViewComponent = viewComponents[currentView];

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-200 font-sans overflow-hidden selection:bg-white/20">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 relative h-full overflow-hidden bg-black">
        <ViewComponent />
      </main>
    </div>
  );
};

export default App;
