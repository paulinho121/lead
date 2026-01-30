
import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, Phone, MessageSquare, StickyNote, CheckCircle2, Circle, Save, MoreHorizontal, ExternalLink, Instagram, Facebook } from 'lucide-react';

interface CRMProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => Promise<void>;
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

const CRM: React.FC<CRMProps> = ({ leads, onUpdateLead }) => {
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
        niche: string;
    }>({ contactResponse: '', observations: '', email: '', instagram: '', niche: '' });

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
        const updated = [...new Array(new Set([...nicheFilters, newNiche.trim().toLowerCase()]))]; // Correct way to unique
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
            niche: lead.niche || ''
        });
    };

    const handleSave = async (lead: Lead) => {
        await onUpdateLead({
            ...lead,
            contactResponse: editValues.contactResponse,
            observations: editValues.observations,
            email: editValues.email,
            instagram: editValues.instagram,
            niche: editValues.niche,
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
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Adicionar Nicho (Filtro)..."
                                className="w-full sm:w-48 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium text-[var(--text-main)]"
                                value={newNiche}
                                onChange={(e) => setNewNiche(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                            />
                            <button
                                onClick={addNiche}
                                className="bg-[var(--primary)] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[var(--primary-hover)] transition-all"
                            >
                                ADD
                            </button>
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
                    </div>

                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-bold text-[var(--text-main)] h-fit"
                    >
                        <option value="all">Filtro por UF</option>
                        {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    <div className="relative w-full sm:flex-1 md:w-80 h-fit">
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
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeSubTab === 'pending'
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Aguardando Enriquecimento ({leads.filter(l => l.status === 'pending' || l.status === 'failed').length})
                    {leads.filter(l => l.status === 'pending').length > 0 && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredLeads.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Nenhum lead encontrado nesta aba</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            {activeSubTab === 'ready'
                                ? 'Os leads que você solicitar aparecerão aqui após serem enriquecidos.'
                                : 'Leads aguardando processamento da IA para buscar dados da empresa.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {activeSubTab === 'pending' && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                        <Save size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Você possui {filteredLeads.length} leads aguardando dados.</p>
                                        <p className="text-xs text-amber-700">Clique no botão "Enriquecer Meus Leads" no menu lateral para buscar emails e telefones.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {filteredLeads.map(lead => (
                            <div key={lead.id} className={`bg-white rounded-2xl border transition-all duration-200 ${lead.contacted ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200 hover:shadow-md'}`}>
                                <div className="p-5">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Lead Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
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
                                                            <span className="truncate">{lead.municipio}/{lead.uf}</span>
                                                            {lead.situacaoCadastral && (
                                                                <>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className={`font-bold whitespace-nowrap ${lead.situacaoCadastral.includes('BAIXADA') ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                        {lead.situacaoCadastral}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {lead.niche && (
                                                                <>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                                                                        {lead.niche}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${lead.contacted
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                        {lead.contacted ? 'Finalizado' : 'A Contatar'}
                                                    </span>
                                                    {lead.situacaoCadastral?.includes('BAIXADA') && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 animate-pulse whitespace-nowrap">
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
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Instagram size={16} className="text-pink-600" />
                                                        <a
                                                            href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-bold text-slate-700 hover:text-pink-600 transition-colors"
                                                        >
                                                            {lead.instagram.includes('instagram.com/')
                                                                ? '@' + lead.instagram.split('instagram.com/')[1].replace('/', '')
                                                                : lead.instagram.startsWith('@') ? lead.instagram : '@' + lead.instagram}
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
                                                        <select
                                                            className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-2"
                                                            value={RESPONSE_OPTIONS.includes(editValues.contactResponse) ? editValues.contactResponse : (editValues.contactResponse ? 'Outros (Digitar manualmente)' : '')}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === 'Outros (Digitar manualmente)') {
                                                                    setEditValues({ ...editValues, contactResponse: '' });
                                                                } else {
                                                                    setEditValues({ ...editValues, contactResponse: val });
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Selecione uma resposta...</option>
                                                            {RESPONSE_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>

                                                        {(!RESPONSE_OPTIONS.includes(editValues.contactResponse) || editValues.contactResponse === '') && (
                                                            <input
                                                                className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 animate-in slide-in-from-top-1"
                                                                placeholder="Digite a resposta personalizada..."
                                                                value={editValues.contactResponse}
                                                                onChange={(e) => setEditValues({ ...editValues, contactResponse: e.target.value })}
                                                                autoFocus
                                                            />
                                                        )}
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
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-blue-600 mb-1 block">Nicho / Segmento</label>
                                                        <input
                                                            className="w-full p-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            placeholder="Ex: Tecnologia, Saúde..."
                                                            value={editValues.niche}
                                                            onChange={(e) => setEditValues({ ...editValues, niche: e.target.value })}
                                                        />
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
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default CRM;
