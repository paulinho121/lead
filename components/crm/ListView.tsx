
import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { Search, Phone, Instagram, Facebook, Globe, CheckCircle2, Circle, MoreHorizontal, Mail, MapPin } from 'lucide-react';
import { getLeadProgress, getLeadAging } from '../../hooks/useLeadManagement';

interface ListViewProps {
    leads: Lead[];
    onEditLead: (lead: Lead) => void;
    onToggleContacted: (lead: Lead) => void;
}

// Componente individual memoizado para evitar re-renderizações desnecessárias
const LeadItem = React.memo(({ lead, onEditLead, onToggleContacted }: { lead: Lead, onEditLead: any, onToggleContacted: any }) => {
    const progress = getLeadProgress(lead);
    const aging = getLeadAging(lead.capturedAt);
    const agingColors = {
        low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        medium: 'bg-amber-50 text-amber-600 border-amber-100',
        high: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <div className={`group bg-white rounded-3xl border-2 transition-all duration-300 ${lead.contacted ? 'border-emerald-100' : 'border-slate-100 hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-slate-200/50'}`}>
            <div className="p-6">
                <div className="flex flex-col xl:flex-row gap-6 items-center">
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start gap-4">
                            <button onClick={() => onToggleContacted(lead)} className={`mt-1 transition-transform hover:scale-110 ${lead.contacted ? 'text-emerald-500' : 'text-slate-200 hover:text-[var(--primary)]'}`}>
                                {lead.contacted ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h3 className="font-black text-slate-800 text-lg md:text-xl truncate">{lead.razaoSocial}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${agingColors[aging.level]}`}>{aging.text}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400 font-bold">
                                    <span>CNPJ: {lead.cnpj}</span>
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {lead.municipio}/{lead.uf}</span>
                                </div>
                            </div>
                            <div className="hidden sm:flex flex-col items-end gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Score: {progress}%</span>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`} style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-blue-400 transition-all shadow-sm">
                                <Globe size={12} className="text-blue-500" /> GOOGLE
                            </a>
                            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[10px] font-black ${lead.instagram ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                <Instagram size={12} /> INSTA
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[10px] font-black ${lead.facebook ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                <Facebook size={12} /> FACE
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[10px] font-black ${lead.email || lead.emailNotFound ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                <Mail size={12} /> EMAIL
                            </div>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto flex flex-col sm:flex-row xl:flex-col gap-2 shrink-0">
                        <button
                            onClick={() => onEditLead(lead)}
                            className="flex-1 xl:w-48 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                        >
                            <MoreHorizontal size={16} /> GESTÃO / CRM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

LeadItem.displayName = 'LeadItem';

const ITEMS_PER_PAGE = 30;

const ListView: React.FC<ListViewProps> = ({ leads, onEditLead, onToggleContacted }) => {
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const visibleLeads = useMemo(() => leads.slice(0, visibleCount), [leads, visibleCount]);

    if (leads.length === 0) {
        return (
            <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="text-slate-300" size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-700">Nenhum lead encontrado</h3>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {visibleLeads.map(lead => (
                    <LeadItem
                        key={lead.id}
                        lead={lead}
                        onEditLead={onEditLead}
                        onToggleContacted={onToggleContacted}
                    />
                ))}
            </div>

            {visibleCount < leads.length && (
                <div className="flex justify-center pt-8 pb-12">
                    <button
                        onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                        className="px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm"
                    >
                        Ver mais {Math.min(ITEMS_PER_PAGE, leads.length - visibleCount)} de {leads.length - visibleCount} leads restantes
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(ListView);
