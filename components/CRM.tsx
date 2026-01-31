// CRM Component - Improved Side Drawer for Lead Management
import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, Phone, MessageSquare, CheckCircle2, Circle, MoreHorizontal, Instagram, Facebook, Globe, Download, X, Save, SlidersHorizontal, Mail } from 'lucide-react';
import { exportLeadsToCSV } from '../services/exportService';

interface CRMProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => Promise<void>;
    isSaaSAdmin?: boolean;
}

const RESPONSE_OPTIONS = [
    'Interessado - Agendar Reunião',
    'Interessado - Enviar Proposta',
    'Em Negociação',
    'Não tem interesse / Recusou',
    'Sem Orçamento no momento',
    'Não atende / Telefone Errado',
    'Deixei Recado / Retornar depois',
    'Outros (Digitar manualmente)'
];

const CRM: React.FC<CRMProps> = ({ leads, onUpdateLead, isSaaSAdmin }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState<string>('all');
    const [activeSubTab, setActiveSubTab] = useState<'ready' | 'pending'>('ready');
    const [nicheFilters, setNicheFilters] = useState<string[]>(() => {
        const saved = localStorage.getItem('crm_niches');
        return saved ? JSON.parse(saved) : [];
    });
    const [newNiche, setNewNiche] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [editValues, setEditValues] = useState<{
        contactResponse: string;
        observations: string;
        email: string;
        instagram: string;
        facebook: string;
        niche: string;
        website: string;
    }>({ contactResponse: '', observations: '', email: '', instagram: '', facebook: '', niche: '', website: '' });

    const states = Array.from(new Set(leads.map(l => l.uf).filter(Boolean))).sort();

    const filteredLeads = leads
        .filter(lead => {
            const matchesSearch = lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.cnpj.includes(searchTerm) ||
                (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesState = selectedState === 'all' || lead.uf === selectedState;

            const matchesNiche = nicheFilters.length === 0 || nicheFilters.some(n =>
                (lead.atividadePrincipal && lead.atividadePrincipal.toLowerCase().includes(n.toLowerCase())) ||
                (lead.razaoSocial && lead.razaoSocial.toLowerCase().includes(n.toLowerCase())) ||
                (lead.niche && lead.niche.toLowerCase().includes(n.toLowerCase()))
            );

            const matchesTab = activeSubTab === 'ready'
                ? lead.status === 'enriched'
                : (lead.status === 'pending' || lead.status === 'failed');

            return matchesSearch && matchesState && matchesTab && matchesNiche;
        })
        .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

    const addNiche = () => {
        if (!newNiche.trim()) return;
        const final = Array.from(new Set([...nicheFilters, newNiche.trim().toLowerCase()]));
        setNicheFilters(final);
        localStorage.setItem('crm_niches', JSON.stringify(final));
        setNewNiche('');
    };

    const removeNiche = (n: string) => {
        const updated = nicheFilters.filter(item => item !== n);
        setNicheFilters(updated);
        localStorage.setItem('crm_niches', JSON.stringify(updated));
    };

    const handleStartEdit = (lead: Lead) => {
        setEditingId(lead.id);
        setEditValues({
            contactResponse: lead.contactResponse || '',
            observations: lead.observations || '',
            email: lead.email || '',
            instagram: lead.instagram || '',
            facebook: lead.facebook || '',
            niche: lead.niche || '',
            website: lead.website || ''
        });
    };

    const handleSave = async (lead: Lead) => {
        await onUpdateLead({
            ...lead,
            contactResponse: editValues.contactResponse,
            observations: editValues.observations,
            email: editValues.email,
            instagram: editValues.instagram,
            facebook: editValues.facebook,
            niche: editValues.niche,
            website: editValues.website,
            contacted: true
        });
        setEditingId(null);
    };

    const toggleContacted = async (lead: Lead) => {
        await onUpdateLead({
            ...lead,
            contacted: !lead.contacted
        });
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tight">CRM de Leads</h2>
                        <p className="text-[var(--text-muted)] text-xs md:text-sm">Gerencie seus contatos e conversões.</p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`md:hidden p-3 rounded-2xl border transition-all ${showFilters ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg' : 'bg-white border-[var(--border)] text-[var(--text-main)]'}`}
                    >
                        <SlidersHorizontal size={20} />
                    </button>
                </div>

                <div className={`flex flex-col gap-3 transition-all duration-300 origin-top ${showFilters ? 'scale-y-100 opacity-100 h-auto pb-2' : 'scale-y-0 opacity-0 h-0 overflow-hidden md:scale-y-100 md:opacity-100 md:h-auto md:flex-row md:items-center'}`}>
                    <div className="relative w-full md:w-64 h-fit order-first md:order-last">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Empresa ou CNPJ..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm text-[var(--text-main)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Nicho..."
                                className="flex-1 sm:w-32 px-4 py-3 bg-white border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium text-[var(--text-main)]"
                                value={newNiche}
                                onChange={(e) => setNewNiche(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                            />
                            <button
                                onClick={addNiche}
                                className="bg-[var(--primary)] text-white px-5 py-3 rounded-2xl text-xs font-black hover:bg-[var(--primary-hover)] transition-all border-none shadow-sm shadow-[var(--primary)]/20"
                            >
                                OK
                            </button>
                        </div>

                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full sm:w-32 px-4 py-3 bg-white border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-bold text-[var(--text-main)] h-fit cursor-pointer"
                        >
                            <option value="all">Filtro UF</option>
                            {states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>

                        {isSaaSAdmin && (
                            <button
                                onClick={() => exportLeadsToCSV(filteredLeads)}
                                disabled={filteredLeads.length === 0}
                                className="w-full sm:w-auto py-3 px-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                <span className="sm:hidden font-bold">EXPORTAR CRM</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {nicheFilters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {nicheFilters.map(n => (
                        <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100">
                            {n}
                            <button onClick={() => removeNiche(n)} className="hover:text-red-500">×</button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
                <button
                    onClick={() => setActiveSubTab('ready')}
                    className={`px-4 md:px-6 py-4 text-xs md:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeSubTab === 'ready'
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Prontos ({leads.filter(l => l.status === 'enriched').length})
                </button>
                <button
                    onClick={() => setActiveSubTab('pending')}
                    className={`px-4 md:px-6 py-4 text-xs md:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeSubTab === 'pending'
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Pendentes ({leads.filter(l => l.status === 'pending' || l.status === 'failed').length})
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredLeads.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Nenhum lead encontrado nesta aba</h3>
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <div key={lead.id} className={`bg-white rounded-3xl border transition-all duration-200 ${lead.contacted ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200 hover:shadow-md'}`}>
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <button
                                                    onClick={() => toggleContacted(lead)}
                                                    className={`flex-shrink-0 mt-1 transition-colors ${lead.contacted ? 'text-emerald-500' : 'text-slate-200 hover:text-[var(--primary)]'}`}
                                                >
                                                    {lead.contacted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-[var(--text-main)] text-lg md:text-xl truncate tracking-tight">{lead.razaoSocial}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] mt-1">
                                                        <span className="font-semibold text-slate-500">CNPJ: {lead.cnpj}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{lead.municipio}/{lead.uf}</span>
                                                        {lead.situacaoCadastral && (
                                                            <>
                                                                <span className="text-slate-300">•</span>
                                                                <span className={`font-black uppercase tracking-wider ${lead.situacaoCadastral.includes('BAIXADA') ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                    {lead.situacaoCadastral}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${lead.contacted
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {lead.contacted ? 'Finalizado' : 'A Contatar'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-6">
                                            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium whitespace-nowrap overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Phone size={16} />
                                                </div>
                                                {lead.telefone || <span className="text-slate-300 italic font-normal">Sem telefone</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium whitespace-nowrap overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <MessageSquare size={16} />
                                                </div>
                                                {lead.email || <span className="text-slate-300 italic font-normal">Sem email</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-slate-100">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mr-2">Quick Access:</span>

                                            {/* Google Search Button */}
                                            <a
                                                href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group"
                                                title="Buscar no Google"
                                            >
                                                <Globe size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                                GOOGLE SEARCH
                                            </a>

                                            {/* Website Button */}
                                            <a
                                                href={lead.website ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`) : `https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' site oficial')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-[11px] font-black transition-all shadow-sm group ${lead.website
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                                title={lead.website ? 'Visitar Site' : 'Buscar Site Oficial'}
                                            >
                                                <Search size={14} className={lead.website ? 'text-blue-600 group-hover:scale-110 transition-transform' : 'text-slate-300'} />
                                                OFFICIAL SITE
                                            </a>

                                            {/* Instagram Button */}
                                            <a
                                                href={lead.instagram ? (lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`) : `https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' instagram')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-[11px] font-black transition-all shadow-sm group ${lead.instagram
                                                    ? 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
                                                    : 'bg-white border-slate-200 text-pink-600 hover:bg-pink-50'}`}
                                                title={lead.instagram ? 'Ver Instagram' : 'Buscar Instagram'}
                                            >
                                                <Instagram size={14} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                                INSTAGRAM
                                            </a>

                                            {/* Facebook Button */}
                                            <a
                                                href={lead.facebook ? (lead.facebook.startsWith('http') ? lead.facebook : `https://facebook.com/${lead.facebook}`) : `https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' facebook')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-[11px] font-black transition-all shadow-sm group ${lead.facebook
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                                    : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}
                                                title={lead.facebook ? 'Ver Facebook' : 'Buscar Facebook'}
                                            >
                                                <Facebook size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                                FACEBOOK
                                            </a>
                                        </div>
                                    </div>

                                    <div className="lg:w-80 flex flex-col gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => handleStartEdit(lead)}
                                            className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <MoreHorizontal size={16} /> DETALHES / CRM
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Side Drawer for Editing Lead */}
            {editingId && (() => {
                const leadToEdit = leads.find(l => l.id === editingId);
                if (!leadToEdit) return null;

                return (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        {/* Backdrop with fade-in */}
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                            onClick={() => setEditingId(null)}
                        />

                        {/* Drawer Panel with slide-in from right */}
                        <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 md:p-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                            <Save size={18} />
                                        </div>
                                        <h3 className="font-black text-xl text-slate-800 tracking-tight">Gestão de Lead</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium truncate max-w-xs">{leadToEdit.razaoSocial}</p>
                                </div>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 custom-scrollbar">
                                {/* Action Bar / Search Links */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(leadToEdit.razaoSocial)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                                            <Globe size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Google</span>
                                    </a>
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(leadToEdit.razaoSocial + ' instagram')}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-pink-200 hover:bg-pink-50/50 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-pink-500 group-hover:scale-110 transition-transform">
                                            <Instagram size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Insta Search</span>
                                    </a>
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(leadToEdit.razaoSocial + ' facebook')}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                                            <Facebook size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Face Search</span>
                                    </a>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(leadToEdit.cnpj);
                                            alert('CNPJ Copiado!');
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                                            <Search size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Copy CNPJ</span>
                                    </button>
                                </div>

                                {/* Form Sections */}
                                <div className="space-y-6">
                                    <section>
                                        <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-[0.15em]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Status do Atendimento
                                        </label>
                                        <select
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all appearance-none cursor-pointer"
                                            value={editValues.contactResponse}
                                            onChange={e => setEditValues({ ...editValues, contactResponse: e.target.value })}
                                        >
                                            <option value="">Selecione uma resposta...</option>
                                            {RESPONSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </section>

                                    <section>
                                        <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-[0.15em]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                                            E-mail de Contato
                                        </label>
                                        <div className="relative group/input">
                                            <input
                                                type="email"
                                                className="w-full p-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-[var(--primary)]/50 focus:outline-none transition-all"
                                                placeholder="exemplo@empresa.com.br"
                                                value={editValues.email}
                                                onChange={e => setEditValues({ ...editValues, email: e.target.value })}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)] opacity-50 group-hover/input:opacity-100 transition-opacity">
                                                <Mail size={18} />
                                            </div>
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <section>
                                            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-[0.15em]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                                                Instagram Profil
                                            </label>
                                            <div className="relative group/input">
                                                <input
                                                    type="text"
                                                    className="w-full p-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-pink-500/50 focus:outline-none transition-all"
                                                    placeholder="@usuario"
                                                    value={editValues.instagram}
                                                    onChange={e => setEditValues({ ...editValues, instagram: e.target.value })}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-500 opacity-50 group-hover/input:opacity-100 transition-opacity">
                                                    <Instagram size={18} />
                                                </div>
                                            </div>
                                        </section>
                                        <section>
                                            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-[0.15em]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                Facebook ID
                                            </label>
                                            <div className="relative group/input">
                                                <input
                                                    type="text"
                                                    className="w-full p-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500/50 focus:outline-none transition-all"
                                                    placeholder="id_pagina"
                                                    value={editValues.facebook}
                                                    onChange={e => setEditValues({ ...editValues, facebook: e.target.value })}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 opacity-50 group-hover/input:opacity-100 transition-opacity">
                                                    <Facebook size={18} />
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <section>
                                        <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 mb-2 px-1 tracking-[0.15em]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            Observações Internas
                                        </label>
                                        <textarea
                                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl h-48 text-sm font-semibold focus:bg-white focus:border-amber-500/50 focus:outline-none transition-all resize-none shadow-inner"
                                            placeholder="Descreva as interações ou informações importantes deste lead..."
                                            value={editValues.observations}
                                            onChange={e => setEditValues({ ...editValues, observations: e.target.value })}
                                        />
                                    </section>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    onClick={() => handleSave(leadToEdit)}
                                    className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[var(--primary)]/20 hover:bg-[var(--primary-hover)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                    SALVAR E FINALIZAR ATENDIMENTO
                                </button>
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">As alterações são sincronizadas com o banco de dados</p>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default CRM;
