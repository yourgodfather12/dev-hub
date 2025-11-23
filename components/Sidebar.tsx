
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { ViewState } from '../types';
import { Settings, LogOut, Command } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

type ThemeKey = 'sky' | 'amber' | 'emerald' | 'zinc' | 'blue' | 'violet' | 'orange' | 'pink' | 'indigo';

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
};

const bgColors: Record<ThemeKey, string> = {
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/50',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/50',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50',
  zinc: 'bg-white/10 text-white border-white/50',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/50',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/50',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/50',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50',
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  return (
    <aside className="w-[260px] bg-zinc-950/80 border-r border-white/5 flex flex-col h-full backdrop-blur-xl z-50 relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

      <div className="h-20 flex items-center px-6 shrink-0 relative z-10">
        <div className="w-8 h-8 bg-gradient-to-br from-zinc-100 to-zinc-400 rounded-lg flex items-center justify-center mr-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20">
          <Command className="text-black w-4 h-4" />
        </div>
        <div className="flex flex-col">
            <h1 className="text-base font-bold text-white tracking-tight leading-none mb-1">
            Dev Hub
            </h1>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wider">COMMAND CENTER</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="px-3 mb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          Workspace
        </div>
        {NAV_ITEMS.map((item) => {
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
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden
                ${isActive 
                  ? `${activeClass} border-l-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]` 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border-l-2 border-transparent'
                }`}
            >
               {isActive && <div className={`absolute inset-0 opacity-10 bg-current pointer-events-none`} />}
              <Icon className={`w-4 h-4 mr-3 transition-colors ${iconColor}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black to-zinc-900/50 relative z-10">
        <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-colors mb-1">
          <Settings className="w-4 h-4 mr-3 text-zinc-600 group-hover:text-zinc-400" />
          Settings
        </button>
        <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4 mr-3 text-zinc-600 group-hover:text-red-400" />
          Sign Out
        </button>
        
        <div className="mt-6 px-3 flex items-center justify-between">
           <div className="flex items-center">
             <span className="relative flex h-2 w-2 mr-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">System Online</span>
           </div>
           <span className="text-[10px] text-zinc-600 font-mono">v2.5.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
