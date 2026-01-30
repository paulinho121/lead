
import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, Phone, MessageSquare, CheckCircle2, Circle, MoreHorizontal, Instagram, Facebook, Globe, Download, X, Save } from 'lucide-react';
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
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Organização de Leads (CRM)</h2>
                    <p className="text-[var(--text-muted)] text-sm">Gerencie contatos, respostas e observações dos seus leads.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Adicionar Nicho (Filtro)..."
                            className="w-full sm:w-40 px-4 py-2 bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium text-[var(--text-main)]"
                            value={newNiche}
                            onChange={(e) => setNewNiche(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                        />
                        <button
                            onClick={addNiche}
                            className="bg-[var(--primary)] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[var(--primary-hover)] transition-all border-none"
                        >
                            ADD
                        </button>
                    </div>

                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full sm:w-40 px-4 py-2 bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-bold text-[var(--text-main)] h-fit"
                    >
                        <option value="all">Filtro por UF</option>
                        {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    <div className="relative w-full sm:w-64 h-fit">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar empresa ou CNPJ..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm text-[var(--text-main)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {isSaaSAdmin && (
                        <button
                            onClick={() => exportLeadsToCSV(filteredLeads)}
                            disabled={filteredLeads.length === 0}
                            className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                            title="Exportar CRM"
                        >
                            <Download size={18} />
                        </button>
                    )}
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

            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveSubTab('ready')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeSubTab === 'ready'
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Prontos para Contato ({leads.filter(l => l.status === 'enriched').length})
                </button>
                <button
                    onClick={() => setActiveSubTab('pending')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeSubTab === 'pending'
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Aguardando Enriquecimento ({leads.filter(l => l.status === 'pending' || l.status === 'failed').length})
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

                                        {editingId === lead.id && (
                                            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                                                <div className="bg-white rounded-[40px] p-10 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                                                    <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                                                        <div>
                                                            <h3 className="font-black text-2xl text-slate-800 tracking-tight">Atualizar Lead</h3>
                                                            <p className="text-sm text-slate-400 font-medium mt-1">{lead.razaoSocial}</p>
                                                        </div>
                                                        <button onClick={() => setEditingId(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-blue-600 mb-2 block tracking-widest">Resposta do Cliente</label>
                                                            <select
                                                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                                                value={editValues.contactResponse}
                                                                onChange={e => setEditValues({ ...editValues, contactResponse: e.target.value })}
                                                            >
                                                                <option value="">Selecione uma resposta...</option>
                                                                {RESPONSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-pink-600 mb-2 block tracking-widest">Instagram</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-pink-500 focus:outline-none transition-all"
                                                                    placeholder="@usuario"
                                                                    value={editValues.instagram}
                                                                    onChange={e => setEditValues({ ...editValues, instagram: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-indigo-600 mb-2 block tracking-widest">Facebook</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                                                                    placeholder="id_pagina"
                                                                    value={editValues.facebook}
                                                                    onChange={e => setEditValues({ ...editValues, facebook: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-blue-600 mb-2 block tracking-widest">Observações Internas</label>
                                                            <textarea
                                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-3xl h-40 text-sm font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                                                placeholder="Descreva as interações ou informações importantes deste lead..."
                                                                value={editValues.observations}
                                                                onChange={e => setEditValues({ ...editValues, observations: e.target.value })}
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={() => handleSave(lead)}
                                                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                        >
                                                            SALVAR ALTERAÇÕES NO CRM
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CRM;
