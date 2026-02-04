import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, User, ShieldCheck, Sparkles, Building2, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface RegisterProps {
    onRegister: () => void;
    onBackToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBackToLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [inviteData, setInviteData] = useState<{ orgId: string, orgName: string } | null>(null);

    useEffect(() => {
        const checkInvite = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('invite');
            if (!token || !supabase) return;

            const { data, error } = await supabase
                .from('organization_invites')
                .select(`
                    organization_id,
                    organizations (name)
                `)
                .eq('token', token)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .single();

            if (data && !error) {
                setInviteData({
                    orgId: data.organization_id,
                    orgName: (data as any).organizations?.name || 'sua organização'
                });
            }
        };
        checkInvite();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        if (formData.password !== formData.confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        setIsLoading(true);

        const { data: signUpData, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    fullname: formData.name
                }
            }
        });

        if (signUpData.user && inviteData) {
            // Update profile with orgId if invited
            await supabase
                .from('profiles')
                .update({ organization_id: inviteData.orgId })
                .eq('id', signUpData.user.id);

            // Mark invite as used
            const params = new URLSearchParams(window.location.search);
            const token = params.get('invite');
            await supabase
                .from('organization_invites')
                .update({ status: 'accepted' })
                .eq('token', token);
        }

        if (error) {
            alert(`Erro ao criar conta: ${error.message}`);
            setIsLoading(false);
        } else {
            setIsLoading(false);
            alert('Conta criada com sucesso! Verifique seu e-mail se necessário.');
            onRegister();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-500">
            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--primary)] opacity-[0.05] rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)] opacity-[0.08] rounded-full blur-[120px]"></div>

            <div className="w-full max-w-[480px] px-6 py-12 relative z-10">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-20 h-20 bg-white dark:bg-[#1a1d23] rounded-[24px] shadow-xl shadow-[var(--primary)]/10 flex items-center justify-center p-2 mb-4 border border-[var(--border)] overflow-hidden">
                        <img src="/logo.png" alt="MCI Logo" className="w-full h-full object-contain scale-110" />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Criação de Conta</h2>
                    <p className="text-[var(--text-muted)] text-sm mt-1 font-medium">
                        {inviteData
                            ? `Você foi convidado para a equipe ${inviteData.orgName}.`
                            : 'Junte-se à equipe de vendas MCI LeadPro.'}
                    </p>
                    {inviteData && (
                        <div className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-emerald-100">
                            <CheckCircle2 size={14} /> CONVITE ATIVO: {inviteData.orgName}
                        </div>
                    )}
                </div>

                {/* Register Card */}
                <div className="bg-[var(--bg-card)] rounded-[32px] p-8 shadow-2xl shadow-black/5 border border-[var(--border)] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Nome Completo</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: João Silva"
                                    className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="vendas@mci.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">Confirmar</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[var(--primary)]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    CRIAR MINHA CONTA
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-xs font-medium text-[var(--text-muted)]">
                        Já possui acesso?{' '}
                        <button
                            onClick={onBackToLogin}
                            className="text-[var(--primary)] font-bold hover:underline transition-all"
                        >
                            Fazer Login
                        </button>
                    </p>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                        <Building2 size={14} /> EQUIPE INTERNA
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                        <Phone size={14} /> SUPORTE MCI
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
