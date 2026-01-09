
import React, { useRef, useEffect } from 'react';
import { Message, UserProfile, AIMode } from '../types';
import { MODE_CONFIG } from '../constants';
import { Send, User, Cpu, Shield, Crown, Terminal, BrainCircuit, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  mode: AIMode;
  profile: UserProfile;
  onUpgrade: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages, isLoading, onSend, mode, profile, onUpgrade
}) => {
  const [input, setInput] = React.useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const modeInfo = MODE_CONFIG[mode];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050507] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[30rem] h-[30rem] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-20 glass-morphism border-b border-white/5 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${modeInfo.color} bg-opacity-20 border border-white/10`}>
            {modeInfo.icon}
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight flex items-center gap-2">
              {modeInfo.label} MODE
              {modeInfo.tier === 'premium' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{modeInfo.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Neural Latency</span>
            <span className="text-xs font-bold text-emerald-400">14ms // Optimal</span>
          </div>
          <div className="h-8 w-px bg-white/5 mx-2" />
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
            <Shield className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 relative z-10">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 via-purple-600/20 to-cyan-400/20 rounded-[2.5rem] flex items-center justify-center mb-10 relative">
                <BrainCircuit className="w-12 h-12 text-indigo-400" />
                <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-[2.5rem] animate-ping opacity-20" />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight">System Initialized.</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 px-8">
                Welcome to MUZGPT. My neural networks are synchronized with your session.
                <br /><br />
                <span className="text-indigo-400 font-bold">Pro Tip:</span> If I seem stuck, ensure your <code className="bg-white/10 px-1 rounded text-white">.env.local</code> has a valid API Key.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full px-8">
                <button onClick={() => setInput("How can you help me today?")} className="px-4 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold tracking-wide transition-all shadow-xl">HELP & CAPABILITIES</button>
                <button onClick={() => setInput("Tell me something interesting.")} className="px-4 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 text-xs font-bold tracking-wide transition-all shadow-xl">NEURAL INSIGHTS</button>
              </div>
            </motion.div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'model' && (
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 mt-1">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div className={`p-5 rounded-2xl md:rounded-3xl border ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/10 text-white' : 'bg-[#0f0f13] border-white/5 shadow-2xl overflow-hidden'}`}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-xl !bg-[#050507] !p-4 !margin-0 border border-white/10 shadow-lg"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={`${className} bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono text-[0.85em]`} {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {msg.text || (isLoading && i === messages.length - 1 ? 'Typing...' : '')}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}
                  </div>
                  {msg.text.includes("System ERROR") && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                      <AlertTriangle className="w-4 h-4" />
                      Action Required: Update API Key
                    </div>
                  )}
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-2">
                    {msg.role === 'user' ? 'Direct Input' : 'Neural Output'} // {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center animate-pulse">
              <Cpu className="w-5 h-5 text-slate-500" />
            </div>
            <div className="bg-white/5 border border-white/5 p-5 rounded-3xl w-24">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <footer className="p-6 md:p-10 relative z-20">
        <div className="max-w-4xl mx-auto relative">
          {/* Usage Limit Bar */}
          <div className="flex justify-between items-center mb-3 px-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Session Quota</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {profile.dailyUsage} / {profile.tier === 'premium' ? '∞' : '15'} Neural Links
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass-morphism rounded-[2.5rem] p-2 flex items-center gap-2 border border-white/10 shadow-2xl focus-within:border-indigo-500/30 transition-all group"
          >
            <div className="px-4 py-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer hidden md:block">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inject command or query neural link..."
              className="flex-1 bg-transparent py-4 px-2 text-sm font-semibold placeholder:text-slate-600 text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg ${isLoading || !input.trim() ? 'bg-white/5 text-slate-700' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center mt-6 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            MUZGPT may generate creative neural outputs. Use with human oversight.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ChatInterface;
