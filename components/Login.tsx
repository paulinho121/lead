import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginProps {
    onLogin: (password: string) => void;
    onGoToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(`Erro ao entrar: ${error.message}`);
            setIsLoading(false);
        } else {
            onLogin(password);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-500">
            {/* Abstract Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)] opacity-[0.05] rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--primary)] opacity-[0.08] rounded-full blur-[120px]"></div>

            <div className="w-full max-w-[440px] px-6 py-12 relative z-10">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-20 h-20 bg-white dark:bg-[#1a1d23] rounded-[24px] shadow-2xl shadow-[var(--primary)]/20 flex items-center justify-center p-4 mb-6 border border-[var(--border)] overflow-hidden">
                        {/* Placeholder for MCI Logo - User can swap this <img> easily */}
                        <div className="text-[var(--primary)] font-black text-2xl tracking-tighter">MCI</div>
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">LeadPro <span className="text-[var(--primary)]">B2B</span></h2>
                    <p className="text-[var(--text-muted)] text-sm mt-2 font-medium">Acesse sua central de inteligência e vendas.</p>
                </div>

                {/* Login Card */}
                <div className="bg-[var(--bg-card)] rounded-[32px] p-8 md:p-10 shadow-2xl shadow-black/5 border border-[var(--border)] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500 delay-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block">E-mail de Acesso</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Senha de Segurança</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] transition-all" />
                                <span className="text-[11px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Lembrar acesso</span>
                            </label>
                            <button type="button" className="text-[11px] font-bold text-[var(--primary)] hover:opacity-80 transition-opacity">Esqueceu a senha?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[var(--primary)]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    ENTRAR NO SISTEMA
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-xs font-medium text-[var(--text-muted)]">
                        Ainda não tem conta?{' '}
                        <button
                            onClick={onGoToRegister}
                            className="text-[var(--primary)] font-bold hover:underline transition-all"
                        >
                            Solicitar Acesso
                        </button>
                    </p>

                    <div className="mt-8 pt-8 border-t border-[var(--border)]">
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
                                <ShieldCheck size={14} className="text-[var(--primary)]" />
                                CONEXÃO SEGURA
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]"></div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
                                <Sparkles size={14} className="text-[var(--primary)]" />
                                IA ATIVA
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <p className="text-center mt-10 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] opacity-40">
                    &copy; 2026 MCI LEADPRO PROPRIETARY SYSTEM
                </p>
            </div>
        </div>
    );
};

export default Login;
