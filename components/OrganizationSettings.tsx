
import React, { useState, useEffect } from 'react';
import { Building2, Save, Sparkles, MessageSquare, Target, ShieldCheck, Key, Zap, Globe, Cpu } from 'lucide-react';
import { Organization } from '../types';
import { leadService } from '../services/dbService';

interface OrganizationSettingsProps {
    organization: Organization | null;
    onUpdate: (org: Organization) => void;
}

const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({ organization, onUpdate }) => {
    const [formData, setFormData] = useState<Partial<Organization>>({
        name: '',
        niche: '',
        description: '',
        toneOfVoice: 'Profissional',
        brands: '',
        goal: '',
        website: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [apiKeys, setApiKeys] = useState<{ provider: string, api_key: string }[]>([]);
    const [isLoadingKeys, setIsLoadingKeys] = useState(false);

    useEffect(() => {
        if (organization) {
            setFormData(organization);
            loadApiKeys(organization.id);
        }
    }, [organization]);

    const loadApiKeys = async (orgId: string) => {
        setIsLoadingKeys(true);
        try {
            const keys = await leadService.getOrganizationApiKeys(orgId);
            setApiKeys(keys);
        } catch (error) {
            console.error("Erro ao carregar chaves:", error);
        } finally {
            setIsLoadingKeys(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await leadService.updateOrganization(formData);

            // Save API Keys
            for (const key of apiKeys) {
                if (key.api_key && !key.api_key.includes('****')) {
                    await leadService.saveOrganizationApiKey(organization!.id, key.provider, key.api_key);
                }
            }

            onUpdate(formData as Organization);
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleKeyChange = (provider: string, value: string) => {
        setApiKeys(prev => {
            const existing = prev.find(k => k.provider === provider);
            if (existing) {
                return prev.map(k => k.provider === provider ? { ...k, api_key: value } : k);
            }
            return [...prev, { provider, api_key: value }];
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Perfil da Empresa</h2>
                <p className="text-[var(--text-muted)] text-sm mt-1 font-medium opacity-80">
                    Configure como a Inteligência Artificial deve agir e o que ela deve saber sobre o seu negócio.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-[var(--bg-card)] rounded-[32px] p-8 shadow-xl border border-[var(--border)] glass-morphism grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Informações Básicas */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-[var(--primary)] mb-2">
                            <Building2 size={20} />
                            <h3 className="font-black uppercase tracking-widest text-xs">Identidade</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Nome da Empresa</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ex: Soluções Tecnológicas S.A."
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Nicho de Atuação</label>
                                <input
                                    name="niche"
                                    value={formData.niche}
                                    onChange={handleChange}
                                    placeholder="Ex: Energia Solar, Contabilidade B2B"
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Website</label>
                                <input
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://suaempresa.com.br"
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contexto de IA */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-[var(--primary)] mb-2">
                            <Sparkles size={20} />
                            <h3 className="font-black uppercase tracking-widest text-xs">Cérebro da IA</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Tom de Voz</label>
                                <select
                                    name="toneOfVoice"
                                    value={formData.toneOfVoice}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-bold"
                                >
                                    <option value="Profissional">Profissional / Formal</option>
                                    <option value="Amigável">Amigável / Consultivo</option>
                                    <option value="Técnico">Técnico / Especialista</option>
                                    <option value="Agressivo">Agressivo / Vendas</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Marcas / Soluções</label>
                                <textarea
                                    name="brands"
                                    value={formData.brands}
                                    onChange={handleChange}
                                    placeholder="Liste marcas que representa ou serviços principais..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-medium text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gestão de APIs */}
                    <div className="md:col-span-2 space-y-6 pt-8 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[var(--primary)]">
                                <Key size={20} />
                                <h3 className="font-black uppercase tracking-widest text-xs">Conectividade e APIs (BYOK)</h3>
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">
                                <Zap size={12} /> Alta Performance
                            </div>
                        </div>

                        <p className="text-sm text-[var(--text-muted)] font-medium mb-4">
                            Sua organização pode usar chaves próprias. Isso garante que você tenha controle total sobre os custos e limites das IAs.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 'gemini', name: 'Google Gemini', icon: <Sparkles size={16} />, placeholder: 'AIzaSy...' },
                                { id: 'openai', name: 'OpenAI GPT-4', icon: <Cpu size={16} />, placeholder: 'sk-...' },
                                { id: 'deepseek', name: 'DeepSeek AI', icon: <Globe size={16} />, placeholder: 'ds-...' }
                            ].map(provider => {
                                const keyData = apiKeys.find(k => k.provider === provider.id);
                                return (
                                    <div key={provider.id} className="p-5 bg-[var(--bg-main)]/30 rounded-2xl border border-[var(--border)] space-y-3">
                                        <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)]">
                                            {provider.icon}
                                            {provider.name}
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="password"
                                                placeholder={provider.placeholder}
                                                value={keyData?.api_key || ''}
                                                onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Descrição Longa */}
                    <div className="md:col-span-2 space-y-4 pt-8 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 text-[var(--primary)] mb-2">
                            <Target size={20} />
                            <h3 className="font-black uppercase tracking-widest text-xs">Objetivo e Contexto</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">O que a empresa faz? (Detalhado)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Descreva o que sua empresa oferece para que a IA possa argumentar melhor..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Objetivo da Prospecção</label>
                                <textarea
                                    name="goal"
                                    value={formData.goal}
                                    onChange={handleChange}
                                    placeholder="Ex: Agendar reuniões demonstrativas, vender licenças, etc..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-xl focus:border-[var(--primary)] outline-none font-medium text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Seus dados são usados apenas para personalizar o motor de IA da sua organização.
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-[var(--primary)] text-white px-10 py-4 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                    >
                        {isSaving ? <Sparkles size={18} className="animate-spin" /> : <Save size={18} />}
                        SALVAR PERFIL SaaS
                    </button>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-2xl text-center text-sm font-bold animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
};

export default OrganizationSettings;
