import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Terminal, User, Loader2, Sparkles, Zap, Lightbulb, Plus, Search, FileText, MessageSquare, Rocket, DollarSign, Layers, Target, MoveRight, CheckCircle2, ArrowRight, Maximize2, Download, Share2, Code } from 'lucide-react';
import { ChatMessage, AppIdea } from '../types';
import { askAIEngineer } from '../services/huggingFaceService';
import ReactMarkdown from 'react-markdown';
import { fetchAppIdeas, createAppIdea } from '../services/apiClient';

const AppIdeas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'chat'>('chat');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<AppIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [showMermaidCode, setShowMermaidCode] = useState(false);
  
  // Chat State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Yo! I'm your Vibe Coder. I turn 'what if' into 'let's ship'. \n\nGot a million-dollar napkin sketch? Spill it.",
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab, loading]);

  // Fetch existing ideas from backend
  useEffect(() => {
    const loadIdeas = async () => {
      setIdeasLoading(true);
      setIdeasError(null);
      try {
        const data = await fetchAppIdeas();
        setIdeas(data);
      } catch (err) {
        console.error('Failed to load ideas', err);
        setIdeasError(err instanceof Error ? err.message : 'Failed to load ideas');
      } finally {
        setIdeasLoading(false);
      }
    };
    loadIdeas();
  }, []);

  // Switch context when idea changes
  useEffect(() => {
    if (selectedIdeaId) {
      const idea = ideas.find(i => i.id === selectedIdeaId);
      if (idea) {
        setActiveTab('canvas');
      }
    }
  }, [selectedIdeaId, ideas]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = messages.slice(-8).map(m => `${m.role}: ${m.text}`).join('\n');
      
      let promptContext = context;
      if (selectedIdeaId) {
          const idea = ideas.find(i => i.id === selectedIdeaId);
          promptContext = `Current App Idea Context:\nTitle: ${idea?.title}\nDescription: ${idea?.description}\n\nConversation History:\n${context}`;
      }

      const response = await askAIEngineer(userMsg.text, promptContext);
      const aiText = response.text?.trim() || "I processed that, but didn't have a text response.";

      if (response.idea) {
          const generatedIdea: AppIdea = {
            ...response.idea,
            id: response.idea.id || `idea-${Date.now()}`,
            createdAt: response.idea.createdAt || new Date().toISOString(),
            updatedAt: response.idea.updatedAt || new Date().toISOString(),
          };

          try {
            const persisted = await createAppIdea(generatedIdea);
            setIdeas(prev => [persisted, ...prev]);
            setSelectedIdeaId(persisted.id);
          } catch (error) {
            console.error('Failed to save idea', error);
            setIdeas(prev => [generatedIdea, ...prev]);
            setSelectedIdeaId(generatedIdea.id);
          }
          setActiveTab('canvas');

          const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: `Boom. Blueprint created for **${generatedIdea.title}**. Check the Canvas tab for the visual breakdown.`,
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMsg]);
      } else {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: aiText,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMsg]);
      }

    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "My bad, something glitched on the backend. Try again?",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const selectedIdea = ideas.find(i => i.id === selectedIdeaId);

  const getMermaidUrl = (code: string) => {
     const cleanCode = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
     const encoded = btoa(cleanCode);
     return `https://mermaid.ink/img/${encoded}?bgColor=000000`;
  }

  return (
    <div className="flex h-full bg-black text-zinc-200 overflow-hidden">
      
      {/* LEFT SIDEBAR: IDEAS LIBRARY */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-[#09090b] relative z-10">
         <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between mb-5">
               <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mr-3">
                     <Bot className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-white font-bold tracking-tight text-sm">Vibe Coder</h2>
               </div>
               <button 
                 onClick={() => {
                     setSelectedIdeaId(null);
                     setActiveTab('chat');
                 }}
                 className="p-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                 title="New Chat"
               >
                 <Plus className="w-4 h-4" />
               </button>
            </div>
            <div className="relative group">
               <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search blueprints..." 
                 className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
               />
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <div className="px-2 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Saved Blueprints</div>
            {ideas.map(idea => (
              <div 
                key={idea.id}
                onClick={() => setSelectedIdeaId(idea.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all group border relative overflow-hidden ${
                   selectedIdeaId === idea.id 
                   ? 'bg-zinc-900 border-indigo-500/30 shadow-lg shadow-black/20' 
                   : 'bg-transparent border-transparent hover:bg-white/5'
                }`}
              >
                 {selectedIdeaId === idea.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                 
                 <div className="flex justify-between items-start mb-1.5">
                    <h3 className={`text-sm font-bold ${selectedIdeaId === idea.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                      {idea.title}
                    </h3>
                    {selectedIdeaId === idea.id && <ArrowRight className="w-3 h-3 text-indigo-500" />}
                 </div>
                 <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
                   {idea.description}
                 </p>
                 <div className="flex flex-wrap gap-1.5">
                    {idea.tags.slice(0, 2).map(tag => (
                       <span key={tag} className="text-[9px] font-medium bg-white/5 px-2 py-0.5 rounded text-zinc-400 border border-white/5 group-hover:border-white/10">{tag}</span>
                    ))}
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* RIGHT PANEL: WORKBENCH */}
      <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
         {/* HEADER */}
         <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center">
               {selectedIdea ? (
                  <div className="flex items-center animate-in fade-in slide-in-from-left-2">
                    <div className="mr-4 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight">{selectedIdea.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono">V.1.0</span>
                            <span className="text-[10px] text-zinc-600">•</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Last edited today</span>
                        </div>
                    </div>
                  </div>
               ) : (
                  <div className="flex items-center">
                       <Sparkles className="w-4 h-4 text-indigo-400 mr-2" />
                       <span className="text-sm font-bold text-zinc-300">New Session</span>
                  </div>
               )}
            </div>
            
            {/* TABS */}
            <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setActiveTab('canvas')}
                  disabled={!selectedIdea}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${
                     activeTab === 'canvas' 
                     ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' 
                     : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  <Target className="w-3 h-3 mr-2" />
                  Blueprint
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center ${
                     activeTab === 'chat' 
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                     : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 mr-2" />
                  Vibe Chat
                </button>
            </div>
         </div>

         {/* CONTENT AREA */}
         <div className="flex-1 overflow-hidden relative bg-[#050505]">
            
            {/* CANVAS VIEW */}
            {activeTab === 'canvas' && selectedIdea && (
                <div className="h-full overflow-y-auto custom-scrollbar bg-[#050505]">
                   <div className="max-w-6xl mx-auto p-8 pb-24 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                      
                      {/* Hero Section */}
                      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/30 p-8 md:p-10">
                          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                          <div className="relative z-10">
                              <div className="flex items-center justify-between mb-6">
                                  <div className="flex gap-2">
                                      {selectedIdea.tags.map(tag => (
                                          <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">{tag}</span>
                                      ))}
                                  </div>
                                  <div className="flex gap-2">
                                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Share"><Share2 className="w-4 h-4" /></button>
                                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Export"><Download className="w-4 h-4" /></button>
                                  </div>
                              </div>
                              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">{selectedIdea.title}</h1>
                              <p className="text-xl text-zinc-400 leading-relaxed max-w-3xl font-light">{selectedIdea.description}</p>
                          </div>
                      </div>

                      {/* Problem & Solution Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-red-500/30 transition-colors">
                              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Target className="w-24 h-24 text-red-500" />
                              </div>
                              <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                                  The Headache
                              </h3>
                              <p className="text-base text-zinc-300 leading-relaxed flex-1">
                                  {selectedIdea.problemStatement}
                              </p>
                          </div>

                          <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Sparkles className="w-24 h-24 text-emerald-500" />
                              </div>
                              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                                  The Fix
                              </h3>
                              <p className="text-base text-zinc-300 leading-relaxed flex-1">
                                  {selectedIdea.description}
                              </p>
                          </div>
                      </div>

                      {/* Flowchart Section */}
                      {selectedIdea.mermaidDiagram && (
                         <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden relative group">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                               <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                                  <MoveRight className="w-4 h-4 mr-2 text-indigo-500" /> User Flow
                               </h3>
                               <div className="flex items-center gap-2">
                                   <button 
                                      onClick={() => setShowMermaidCode(!showMermaidCode)}
                                      className="p-1.5 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                                      title="Toggle Code"
                                   >
                                      <Code className="w-4 h-4" />
                                   </button>
                                   <button className="p-1.5 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                                      <Maximize2 className="w-4 h-4" />
                                   </button>
                               </div>
                            </div>
                            
                            <div className="p-8 bg-black/50 flex justify-center min-h-[300px]">
                               {showMermaidCode ? (
                                   <pre className="text-xs font-mono text-zinc-500 w-full overflow-auto">
                                       {selectedIdea.mermaidDiagram}
                                   </pre>
                               ) : (
                                   <img 
                                     src={getMermaidUrl(selectedIdea.mermaidDiagram)} 
                                     alt="Flowchart" 
                                     className="max-w-full opacity-90 hover:opacity-100 transition-opacity select-none"
                                   />
                               )}
                            </div>
                         </div>
                      )}

                      {/* Strategy Triple Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Tech Stack */}
                         <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                               <Layers className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2">The Build</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                               {selectedIdea.techStackSuggestion}
                            </p>
                         </div>

                         {/* Revenue */}
                         <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 hover:border-amber-500/30 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                               <DollarSign className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2">The Bag</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                               {selectedIdea.revenueModel}
                            </p>
                         </div>

                         {/* Marketing */}
                         <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 transition-colors group">
                             <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                               <Rocket className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2">The Hype</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                               {selectedIdea.marketingStrategy}
                            </p>
                         </div>
                      </div>
                      
                      {/* Features List */}
                      <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8">
                         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Killer Features</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedIdea.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center p-4 rounded-2xl bg-zinc-900/30 border border-white/5">
                                   <div className="mr-4 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                   </div>
                                   <span className="text-sm text-zinc-300 font-medium">{feature}</span>
                                </div>
                            ))}
                         </div>
                      </div>

                   </div>
                </div>
            )}

            {/* CHAT VIEW */}
            {activeTab === 'chat' && (
               <div className="flex flex-col h-full">
                  {/* Empty State */}
                  {messages.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6 animate-in fade-in zoom-in duration-500">
                              <Bot className="w-10 h-10 text-white" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">Vibe Coder</h2>
                          <p className="text-zinc-500 max-w-md mb-8">Your AI Co-Founder. I build detailed blueprints, roast your stack, and help you secure the bag.</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                              {["Generate a SaaS idea for real estate", "Roast my current project stack", "How do I monetize a habit tracker?", "Create a blueprint for an Uber clone"].map((prompt, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => handleSend(prompt)}
                                    className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all text-sm text-zinc-400 hover:text-white text-left"
                                  >
                                      {prompt}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                     {messages.map((msg) => (
                       <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                         <div className={`flex max-w-[85%] lg:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                           
                           {/* Avatar */}
                           <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 shadow-lg ${
                             msg.role === 'user' 
                             ? 'bg-white ml-3' 
                             : 'bg-gradient-to-br from-indigo-500 to-purple-600 mr-3'
                           }`}>
                             {msg.role === 'user' ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-white" />}
                           </div>
                           
                           {/* Bubble */}
                           <div className={`rounded-2xl text-sm leading-relaxed shadow-md border relative group ${
                             msg.role === 'user' 
                               ? 'bg-zinc-800 text-zinc-100 border-white/5 p-3 px-4' 
                               : 'bg-[#0a0a0a] border-white/10 text-zinc-300 p-5'
                           }`}>
                              {msg.role === 'model' && (
                                 <div className="text-[10px] font-bold text-indigo-400 mb-3 uppercase tracking-wider flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                    Vibe Coder
                                 </div>
                              )}
                              
                              {msg.role === 'model' ? (
                                 <div className="markdown-body space-y-3">
                                   <ReactMarkdown 
                                    components={{
                                       h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
                                       h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                                       h3: ({node, ...props}) => <h3 className="text-base font-bold text-indigo-300 mt-4 mb-2" {...props} />,
                                       ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 space-y-1 text-zinc-400" {...props} />,
                                       ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 space-y-1 text-zinc-400" {...props} />,
                                       li: ({node, ...props}) => <li className="" {...props} />,
                                       p: ({node, ...props}) => <p className="text-zinc-300 leading-7" {...props} />,
                                       strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                                       blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-indigo-500 pl-4 my-2 text-zinc-500 italic" {...props} />,
                                       code(props) {
                                          const {children, className, node, ...rest} = props
                                          const match = /language-(\w+)/.exec(className || '')
                                          return match ? (
                                             <div className="rounded-lg overflow-hidden my-4 border border-white/10 bg-zinc-950 shadow-xl">
                                                <div className="bg-zinc-900 px-4 py-1.5 text-[10px] font-mono text-zinc-500 border-b border-white/5 flex justify-between items-center">
                                                   <div className="flex items-center">
                                                      <Terminal className="w-3 h-3 mr-2" />
                                                      {match[1]}
                                                   </div>
                                                </div>
                                                <div className="p-4 overflow-x-auto">
                                                   <code {...rest} className="font-mono text-xs text-zinc-300">
                                                      {children}
                                                   </code>
                                                </div>
                                             </div>
                                          ) : (
                                             <code {...rest} className="bg-white/10 text-zinc-200 rounded px-1.5 py-0.5 text-[11px] font-mono border border-white/5">
                                                {children}
                                             </code>
                                          )
                                       }
                                    }}
                                   >
                                    {msg.text}
                                   </ReactMarkdown>
                                 </div>
                              ) : (
                                 msg.text
                              )}
                           </div>
                         </div>
                       </div>
                     ))}
                     
                     {loading && (
                        <div className="flex items-center gap-3 text-zinc-500 text-xs ml-14 animate-pulse">
                           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                           Cooking up something...
                        </div>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  {/* INPUT AREA */}
                  <div className="p-6 bg-gradient-to-t from-black via-black to-transparent">
                     <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all group">
                        <textarea
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSend();
                              }
                           }}
                           placeholder={selectedIdea ? `Refine the ${selectedIdea.title} blueprint...` : "Start brainstorming or say 'Generate an app idea'..."}
                           className="w-full bg-transparent text-sm text-white placeholder-zinc-600 p-4 min-h-[50px] max-h-[200px] focus:outline-none resize-none font-medium custom-scrollbar"
                           rows={1}
                        />
                        <div className="flex items-center justify-between px-3 pb-3 bg-[#0a0a0a]">
                           <div className="flex space-x-2">
                              <div className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] text-indigo-400 font-bold border border-indigo-500/20 flex items-center select-none">
                                 <Bot className="w-3 h-3 mr-1" />
                                 Gemini 2.5
                              </div>
                              <div className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-500 font-bold border border-white/5 flex items-center select-none">
                                 <Zap className="w-3 h-3 mr-1" />
                                 Vibe Mode
                              </div>
                           </div>
                           <button 
                              onClick={() => handleSend()}
                              disabled={loading || !input.trim()}
                              className="p-2 rounded-xl bg-white text-black hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                           >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                     <div className="text-[10px] text-center text-zinc-700 mt-3 font-medium">
                        AI generates vibes. Validate stacks before shipping.
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AppIdeas;