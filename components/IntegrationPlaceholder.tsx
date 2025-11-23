import React from 'react';
import { ArrowRight } from 'lucide-react';

interface IntegrationPlaceholderProps {
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
  gradient: string;
}

const IntegrationPlaceholder: React.FC<IntegrationPlaceholderProps> = ({ title, icon: Icon, description, color, gradient }) => (
  <div className="flex items-center justify-center h-full bg-black relative overflow-hidden">
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${gradient} opacity-10 blur-[120px] rounded-full pointer-events-none`}></div>

    <div className="relative z-10 flex flex-col items-center max-w-lg text-center p-8">
      <div className={`w-32 h-32 rounded-3xl ${color} bg-opacity-5 border border-white/5 flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative group`}>
        <div className={`absolute inset-0 ${color} opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500`}></div>
        <Icon className="w-12 h-12 text-white relative z-10" />
      </div>
      
      <h2 className="text-5xl font-bold text-white tracking-tighter mb-6">{title}</h2>
      <p className="text-zinc-400 text-lg leading-relaxed mb-10 font-light">{description}</p>
      
      <button className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-sm transition-all hover:scale-105 overflow-hidden">
        <span className="relative z-10 flex items-center">
          Connect Integration <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
      </button>

      <div className="mt-12 grid grid-cols-3 gap-4 w-full">
        {[1,2,3].map(i => (
          <div key={i} className="h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div className={`h-full w-full ${gradient} opacity-20 animate-pulse`} style={{animationDelay: `${i * 200}ms`}}></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default IntegrationPlaceholder;
