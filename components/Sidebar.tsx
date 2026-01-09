
import React from 'react';
import { UserProfile, AIMode, ChatSession } from '../types';
import { MODE_CONFIG } from '../constants';
import {
  Zap,
  Settings,
  LogOut,
  Plus,
  History,
  Crown,
  Flame,
  Trophy,
  Cpu,
  MoreVertical,
  MessageSquare,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  profile: UserProfile;
  setMode: (mode: AIMode) => void;
  onReset: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  savedChats: ChatSession[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  currentChatId: string | null;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  profile, setMode, onReset, onUpgrade, onLogout,
  savedChats, onSelectChat, currentChatId, onNewChat
}) => {
  return (
    <div className="w-80 h-full glass-morphism border-r border-white/5 flex flex-col z-40">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">MUZGPT</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">V2.0.4 Premium</p>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 py-3.5 rounded-2xl font-bold text-sm transition-all group"
        >
          <Plus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          NEW SESSION
        </button>
      </div>

      {/* Modes Selection */}
      <div className="px-4 mb-6">
        <p className="px-4 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Neural Modes</p>
        <div className="space-y-1">
          {(Object.keys(MODE_CONFIG) as AIMode[]).map((modeKey) => {
            const config = MODE_CONFIG[modeKey];
            const isSelected = profile.selectedMode === modeKey;
            const isLocked = config.tier === 'premium' && profile.tier === 'free';

            return (
              <button
                key={modeKey}
                onClick={() => !isLocked && setMode(modeKey)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${isSelected ? 'bg-indigo-600/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5'}`}>
                  {config.icon}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">{config.label}</div>
                  <div className="text-[10px] opacity-50 font-medium">{config.description}</div>
                </div>
                {isLocked && (
                  <Crown className="w-3 h-3 text-yellow-500 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Saved Clusters</p>
        <div className="space-y-1">
          {savedChats.map(chat => (
            <div key={chat.id} className="group relative">
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs transition-all ${currentChatId === chat.id ? 'bg-white/10 text-white border border-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              >
                <MessageSquare className={`w-4 h-4 ${currentChatId === chat.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                <span className="truncate flex-1 font-medium">{chat.title}</span>
                <div onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Erase this link?")) onDeleteChat(chat.id);
                }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all">
                  <X className="w-3 h-3 text-red-400" />
                </div>
              </button>
            </div>
          ))}
          {savedChats.length === 0 && (
            <div className="px-4 py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <History className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No Recent Link</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile & Stats */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="glass-morphism rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-sm border-2 border-white/10 shadow-lg">
              {profile.username[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-black truncate">{profile.username}</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${profile.tier === 'premium' ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{profile.tier === 'premium' ? 'Neural Pro' : 'Free Tier'}</span>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <div className="flex gap-2 items-center"><Trophy className="w-3 h-3 text-yellow-500" /> Level {profile.level}</div>
              <div className="text-slate-500">{profile.xp % 100} / 100 XP</div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${profile.xp % 100}%` }}
              />
            </div>
          </div>
        </div>

        {profile.tier === 'free' && (
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl shadow-yellow-500/20 mb-4 scale-100 hover:scale-[1.02] active:scale-95"
          >
            <Crown className="w-4 h-4 fill-black" />
            UNLOCK PREMIUM LINK
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => alert("System Settings: \n- Audio: ON\n- Haptics: ON\n- Notifications: ENABLED\n(Advanced configuration coming in v2.1)")}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Settings className="w-3 h-3" /> System
          </button>
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
