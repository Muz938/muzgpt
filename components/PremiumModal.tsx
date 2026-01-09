
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Rocket, Star, ShieldCheck, Sparkle, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const perks = [
        { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: "Unlimited Messages", desc: "Break through the daily neural limits." },
        { icon: <Rocket className="w-5 h-5 text-indigo-400" />, title: "Startup Mode", desc: "Expert business and strategic planning." },
        { icon: <Sparkle className="w-5 h-5 text-purple-400" />, title: "Game Mode", desc: "Turn your tasks into XP-gaining quests." },
        { icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />, title: "Private Compute", desc: "Enhanced security and priority processing." }
    ];

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4242/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const session = await response.json();

            if (session.url) {
                window.location.href = session.url;
            } else {
                console.error('Failed to create checkout session');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-2xl glass-morphism rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)]"
            >
                <div className="grid md:grid-cols-2">
                    {/* Left Side: Perks */}
                    <div className="p-8 md:p-12 bg-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Star className="text-white w-5 h-5 fill-white" />
                            </div>
                            <h2 className="text-2xl font-black">MUZGPT <span className="text-indigo-400">PLUS</span></h2>
                        </div>

                        <div className="space-y-8">
                            {perks.map((perk, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1">{perk.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white mb-1">{perk.title}</h4>
                                        <p className="text-slate-400 text-xs font-medium leading-relaxed">{perk.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Checkout Form */}
                    <div className="p-8 md:p-12 flex flex-col justify-center border-l border-white/5">
                        <div className="mb-10 text-center">
                            <div className="text-4xl font-black mb-2">$10<span className="text-lg text-slate-500 font-bold">/mo</span></div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Next generation intelligence</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                                <div className="bg-white/10 p-2 rounded-xl">
                                    <CreditCard className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Payment via Stripe</div>
                                    <div className="text-sm font-bold">Secure Card Checkout</div>
                                </div>
                                <Check className="text-emerald-500 w-5 h-5" />
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className={`w-full py-5 rounded-[1.5rem] font-black tracking-wide text-sm transition-all shadow-2xl relative overflow-hidden group ${loading ? 'bg-slate-800' : 'bg-white text-black hover:scale-[1.02]'}`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? 'SYNCHRONIZING...' : 'UPGRADE NOW'}
                                {!loading && <Zap className="w-4 h-4 fill-current" />}
                            </span>
                            {!loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                            )}
                        </button>

                        <button onClick={onClose} className="mt-6 text-slate-500 text-[10px] font-bold uppercase hover:text-white transition-colors tracking-widest">
                            Continue with limited access
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PremiumModal;
