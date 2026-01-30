
import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, Phone, MessageSquare, StickyNote, CheckCircle2, Circle, Save, MoreHorizontal, ExternalLink, Instagram, Facebook } from 'lucide-react';

interface CRMProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => Promise<void>;
}

const CRM: React.FC<CRMProps> = ({ leads, onUpdateLead }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState<string>('all');
    const [activeSubTab, setActiveSubTab] = useState<'ready' | 'pending'>('ready');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{
        contactResponse: string;
        observations: string;
        email: string;
        instagram: string;
    }>({ contactResponse: '', observations: '', email: '', instagram: '' });

    const states = Array.from(new Set(leads.map(l => l.uf).filter(Boolean))).sort();

    const filteredLeads = leads
        .filter(lead => {
            const matchesSearch = lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.cnpj.includes(searchTerm) ||
                (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesState = selectedState === 'all' || lead.uf === selectedState;

            const matchesTab = activeSubTab === 'ready'
                ? lead.status === 'enriched'
                : (lead.status === 'pending' || lead.status === 'failed');

            return matchesSearch && matchesState && matchesTab;
        })
        .sort((a, b) => (a.uf || '').localeCompare(b.uf || ''));

    const handleStartEdit = (lead: Lead) => {
        setEditingId(lead.id);
        setEditValues({
            contactResponse: lead.contactResponse || '',
            observations: lead.observations || '',
            email: lead.email || '',
            instagram: lead.instagram || ''
        });
    };

    const handleSave = async (lead: Lead) => {
        await onUpdateLead({
            ...lead,
            contactResponse: editValues.contactResponse,
            observations: editValues.observations,
            email: editValues.email,
            instagram: editValues.instagram,
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
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Organização de Leads (CRM)</h2>
                    <p className="text-[var(--text-muted)] text-sm">Gerencie contatos, respostas e observações dos seus leads.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-bold text-[var(--text-main)]"
                    >
                        <option value="all">Filtro por UF</option>
                        {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    <div className="relative w-full sm:flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar empresa ou CNPJ..."
                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm text-[var(--text-main)]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
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
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeSubTab === 'pending'
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Aguardando Enriquecimento ({leads.filter(l => l.status === 'pending' || l.status === 'failed').length})
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredLeads.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700">Nenhum lead encontrado</h3>
                        <p className="text-slate-500">Tente ajustar sua busca ou adicione novos leads na aba "Enriquecer PDF".</p>
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <div key={lead.id} className={`bg-white rounded-2xl border transition-all duration-200 ${lead.contacted ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200 hover:shadow-md'}`}>
                            <div className="p-5">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Lead Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-3 w-full">
                                                <button
                                                    onClick={() => toggleContacted(lead)}
                                                    className={`flex-shrink-0 mt-1 transition-colors ${lead.contacted ? 'text-emerald-500' : 'text-slate-300 hover:text-[var(--primary)]'}`}
                                                >
                                                    {lead.contacted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-[var(--text-main)] text-base md:text-lg truncate">{lead.razaoSocial}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
                                                        <span className="font-medium">CNPJ: {lead.cnpj}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{lead.municipio}/{lead.uf}</span>
                                                        {lead.situacaoCadastral && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className={`font-bold ${lead.situacaoCadastral.includes('BAIXADA') ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                    {lead.situacaoCadastral}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${lead.contacted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                                    }`}>
                                                    {lead.contacted ? 'Contactado' : 'Pendente'}
                                                </span>
                                                {lead.situacaoCadastral?.includes('BAIXADA') && (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 animate-pulse">
                                                        Empresa Baixada
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone size={14} className="text-slate-400" />
                                                {lead.telefone || <span className="text-slate-300 italic">Sem telefone</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MessageSquare size={14} className="text-slate-400" />
                                                {lead.email || <span className="text-slate-300 italic">Sem email</span>}
                                            </div>
                                            {lead.instagram && (
                                                <div className="flex items-center gap-2 text-sm text-[var(--primary)]">
                                                    <span className="font-bold">IG:</span>
                                                    <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 transition-colors">
                                                        {lead.instagram}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 text-sm mt-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-1">Buscar Dados Faltantes:</span>
                                                <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' ' + (lead.municipio || '') + ' site oficial')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] hover:bg-blue-100 transition-colors border border-blue-100"
                                                >
                                                    <ExternalLink size={12} />
                                                    SITE / GOOGLE
                                                </a>
                                                <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' ' + (lead.municipio || '') + ' instagram')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg font-bold text-[10px] hover:bg-pink-100 transition-colors border border-pink-100"
                                                >
                                                    <Instagram size={12} />
                                                    INSTAGRAM
                                                </a>
                                                <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' ' + (lead.municipio || '') + ' facebook')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-[10px] hover:bg-indigo-100 transition-colors border border-indigo-100"
                                                >
                                                    <Facebook size={12} />
                                                    FACEBOOK
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CRM Action/Edit Area */}
                                    <div className="lg:w-1/3 flex flex-col gap-3">
                                        {editingId === lead.id ? (
                                            <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-blue-600 mb-1 block">Resposta do Cliente</label>
                                                    <input
                                                        className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        placeholder="Interessado? Recusou? Agendou?"
                                                        value={editValues.contactResponse}
                                                        onChange={(e) => setEditValues({ ...editValues, contactResponse: e.target.value })}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-blue-600 mb-1 block">Observações</label>
                                                    <textarea
                                                        className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                                                        placeholder="Notas adicionais..."
                                                        value={editValues.observations}
                                                        onChange={(e) => setEditValues({ ...editValues, observations: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-blue-600 mb-1 block">E-mail</label>
                                                        <input
                                                            className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            placeholder="email@empresa.com"
                                                            value={editValues.email}
                                                            onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-blue-600 mb-1 block">Instagram</label>
                                                        <input
                                                            className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            placeholder="@usuario ou link"
                                                            value={editValues.instagram}
                                                            onChange={(e) => setEditValues({ ...editValues, instagram: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSave(lead)}
                                                        className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                                                    >
                                                        <Save size={14} /> Salvar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group relative">
                                                    <button
                                                        onClick={() => handleStartEdit(lead)}
                                                        className="absolute top-2 right-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>

                                                    <div className="mb-2">
                                                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Resposta</span>
                                                        <p className="text-sm text-slate-700 min-h-[1.5rem]">
                                                            {lead.contactResponse || <span className="text-slate-300 italic">Nenhuma resposta registrada</span>}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Observações</span>
                                                        <p className="text-sm text-slate-600 text-xs italic">
                                                            {lead.observations || <span className="text-slate-300">Sem observações</span>}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!lead.contacted && (
                                                    <button
                                                        onClick={() => handleStartEdit(lead)}
                                                        className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Phone size={14} /> Registrar Contato
                                                    </button>
                                                )}
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
