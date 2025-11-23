
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIEngineer from './components/AIEngineer';
import APIExplorer from './components/APIExplorer';
import SupabasePanel from './components/SupabasePanel';
import VercelPanel from './components/VercelPanel';
import IntegrationPlaceholder from './components/IntegrationPlaceholder';
import { ViewState } from './types';
import { INTEGRATIONS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.APP_IDEAS:
        return <AIEngineer />;
      case ViewState.API_EXPLORER:
        return <APIExplorer />;
      case ViewState.SUPABASE:
        return <SupabasePanel />;
      case ViewState.VERCEL:
        return <VercelPanel />;
      case ViewState.DOCKER:
      case ViewState.STRIPE:
      case ViewState.HUGGING_FACE: {
        const config = INTEGRATIONS[currentView];
        return config ? <IntegrationPlaceholder {...config} /> : <Dashboard />;
      }
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-200 font-sans overflow-hidden selection:bg-white/20">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 relative h-full overflow-hidden bg-black">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
