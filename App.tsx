
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AuthScreen from './components/AuthScreen';
import PremiumModal from './components/PremiumModal';
import { Message, UserProfile, AIMode, XPEvent, ChatSession } from './types';
import { generateResponseStream } from './geminiService';
import { DAILY_LIMITS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  id: '',
  username: '',
  xp: 0,
  level: 1,
  streak: 1,
  lastActive: Date.now(),
  completedTasks: 0,
  selectedMode: 'general',
  tier: 'free',
  dailyUsage: 0,
  lastUsageReset: new Date().toDateString(),
  isLoggedIn: false
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('muzgpt_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      if (parsed.lastUsageReset !== today) {
        parsed.dailyUsage = 0;
        parsed.lastUsageReset = today;
      }
      return parsed;
    }
    return INITIAL_PROFILE;
  });

  const [savedChats, setSavedChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('muzgpt_saved_chats');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [xpToasts, setXpToasts] = useState<XPEvent[]>([]);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  // Sync profile to localStorage
  useEffect(() => {
    localStorage.setItem('muzgpt_profile', JSON.stringify(profile));
  }, [profile]);

  // Sync saved chats to localStorage
  useEffect(() => {
    localStorage.setItem('muzgpt_saved_chats', JSON.stringify(savedChats));
  }, [savedChats]);

  // Update messages when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      const chat = savedChats.find(c => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
        setProfile(p => ({ ...p, selectedMode: chat.mode }));
      }
    } else {
      setMessages([]);
    }
  }, [currentChatId, savedChats]);

  const handleLogin = (username: string, email: string) => {
    setProfile(prev => ({
      ...prev,
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      isLoggedIn: true
    }));
    addXP(50, "Neural Link Established");
  };

  const handleLogout = () => {
    if (window.confirm("Disconnect from MUZGPT? Session clusters are safe in local storage.")) {
      setProfile(prev => ({ ...prev, isLoggedIn: false }));
      setCurrentChatId(null);
    }
  };

  const addXP = useCallback((amount: number, reason: string) => {
    setProfile(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      const id = Math.random().toString(36).substring(7);
      setXpToasts(current => [...current, { amount, reason, id }]);
      setTimeout(() => setXpToasts(current => current.filter(t => t.id !== id)), 4000);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        completedTasks: prev.completedTasks + (amount >= 20 ? 1 : 0)
      };
    });
  }, []);

  const handleSend = async (text: string) => {
    if (profile.dailyUsage >= DAILY_LIMITS[profile.tier]) {
      setIsPremiumModalOpen(true);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      mode: profile.selectedMode
    };

    setMessages(prev => [...prev, modelMsg]);

    let fullText = '';
    try {
      await generateResponseStream(
        profile.selectedMode,
        text,
        profile.tier === 'free' ? messages.slice(-4) : messages,
        (chunk) => {
          fullText += chunk;
          setMessages(prev => prev.map(m =>
            m.id === modelMsgId ? { ...m, text: fullText } : m
          ));
        }
      );

      setProfile(prev => ({ ...prev, dailyUsage: prev.dailyUsage + 1 }));
      addXP(15, "Neural Sync Success");

      if (profile.isLoggedIn) {
        updateChatSession([...newMessages, { ...modelMsg, text: fullText }]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatSession = (msgs: Message[]) => {
    if (currentChatId) {
      setSavedChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: msgs, updatedAt: Date.now(), mode: profile.selectedMode }
          : chat
      ));
    } else {
      const newChat: ChatSession = {
        id: Date.now().toString(),
        title: msgs[0]?.text.substring(0, 35) + '...' || 'New Link',
        messages: msgs,
        mode: profile.selectedMode,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setSavedChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handlePremiumSuccess = () => {
    setProfile(prev => ({ ...prev, tier: 'premium' }));
    addXP(250, "Premium Status Active");
  };

  if (!profile.isLoggedIn) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#050507] text-white overflow-hidden relative font-['Outfit']">
      <Sidebar
        profile={profile}
        setMode={(m) => setProfile(p => ({ ...p, selectedMode: m }))}
        onReset={() => {
          if (confirm("Initiate total system reset? This clears all neural session data.")) {
            localStorage.clear();
            window.location.reload();
          }
        }}
        onUpgrade={() => setIsPremiumModalOpen(true)}
        onLogout={handleLogout}
        savedChats={savedChats}
        onDeleteChat={(id) => {
          setSavedChats(prev => prev.filter(c => c.id !== id));
          if (currentChatId === id) {
            setCurrentChatId(null);
            setMessages([]);
          }
        }}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
      />

      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        mode={profile.selectedMode}
        profile={profile}
        onUpgrade={() => setIsPremiumModalOpen(true)}
      />

      <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {xpToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="glass-morphism px-6 py-4 rounded-[1.5rem] shadow-2xl border border-white/10 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-sm shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Neural Reward</p>
                <p className="font-bold text-sm">+{toast.amount} XP // {toast.reason}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onSuccess={handlePremiumSuccess}
      />
    </div>
  );
};

export default App;
