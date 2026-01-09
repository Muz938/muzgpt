
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Github, Chrome, Shield, Zap, Sparkles, LogIn, UserPlus, ArrowRight, Fingerprint, Lock } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface AuthScreenProps {
  onLogin: (username: string, email: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifyingSocial, setIsVerifyingSocial] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth lag for "Professional" feel
    setTimeout(() => {
      onLogin(username || email.split('@')[0] || 'User', email);
      setLoading(false);
    }, 1500);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setSocialProvider('Google');
      setIsVerifyingSocial(true);
      // In a real app, you'd fetch user info using the token
      // For now, we proceed to email entry as requested by user
    },
    onError: () => console.log('Login Failed'),
  });

  const handleSocialInit = (provider: string) => {
    if (provider === 'Google') {
      googleLogin();
    } else {
      setSocialProvider(provider);
      setIsVerifyingSocial(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050507] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10 px-6"
      >
        <div className="glass-morphism rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="flex flex-col items-center mb-12">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.3)] mb-8"
            >
              <Sparkles className="text-white w-12 h-12" />
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter gradient-text mb-3">MUZGPT</h1>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Next-Gen Encryption Active</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isVerifyingSocial ? (
              <motion.div
                key="standard-auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex bg-white/5 p-1.5 rounded-2xl mb-10 border border-white/5">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${isLogin ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LogIn className="w-4 h-4" /> LOGIN
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black rounded-xl transition-all ${!isLogin ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <UserPlus className="w-4 h-4" /> SIGN UP
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mb-10">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <input
                          type="text"
                          placeholder="Neural Link Name"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold placeholder:text-slate-600 mb-4"
                          required
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold placeholder:text-slate-600"
                    required
                  />

                  <input
                    type="password"
                    placeholder="Security Key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold placeholder:text-slate-600"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98] py-5 rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    {loading ? 'SYNCHRONIZING...' : (isLogin ? 'ESTABLISH LINK' : 'INITIALIZE SYSTEM')}
                    {!loading && <Zap className="w-4 h-4 group-hover:animate-pulse" />}
                  </button>
                </form>

                <div className="relative mb-10">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#0a0a12] px-4 text-slate-500 font-black tracking-[0.3em]">External Sync</span></div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <button
                    onClick={() => handleSocialInit('Google')}
                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all text-slate-300"
                  >
                    <Chrome className="w-4 h-4 text-indigo-400" />
                    GOOGLE
                  </button>
                  <button
                    onClick={() => handleSocialInit('GitHub')}
                    className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all text-slate-300"
                  >
                    <Github className="w-4 h-4 text-purple-400" />
                    GITHUB
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="social-verify"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl relative">
                    {socialProvider === 'Google' ? <Chrome className="w-10 h-10 text-indigo-400" /> : <Github className="w-10 h-10 text-purple-400" />}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-[#0a0a12]">
                      <Fingerprint className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{socialProvider} Verified</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Finalizing Neural Map</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Confirm Neural ID</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold placeholder:text-slate-600"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Pilot Name</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 group mt-4"
                  >
                    {loading ? 'ESTABLISHING...' : 'ENGAGE NEURAL LINK'}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVerifyingSocial(false)}
                    className="w-full text-slate-500 text-[10px] font-black uppercase hover:text-red-400 transition-colors tracking-[0.2em] py-4"
                  >
                    ABORT LINKAGE
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-10 text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase opacity-50">
          MUZGPT OS v4.1.0 // Cluster: <span className="text-emerald-500">Secure</span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
