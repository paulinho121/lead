
import React from 'react';
import { Lead } from '../../types';
import { Instagram, Facebook, Mail, Globe, Clock, MoreHorizontal, ExternalLink, MessageSquare } from 'lucide-react';
import { getLeadProgress, getLeadAging } from '../../hooks/useLeadManagement';

interface KanbanCardProps {
    lead: Lead;
    onEdit: (lead: Lead) => void;
    innerRef?: any;
    draggableProps?: any;
    dragHandleProps?: any;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ lead, onEdit, innerRef, draggableProps, dragHandleProps }) => {
    const progress = getLeadProgress(lead);
    const aging = getLeadAging(lead.capturedAt);

    const agingColors = {
        low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        high: 'bg-red-100 text-red-700 border-red-200'
    };

    return (
        <div
            ref={innerRef}
            {...draggableProps}
            {...dragHandleProps}
            onClick={() => onEdit(lead)}
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-[var(--primary)] hover:shadow-2xl hover:shadow-[var(--primary)]/10 transition-all cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
            {/* Header: Name and Aging */}
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-black text-sm text-slate-800 line-clamp-2 pr-2 group-hover:text-[var(--primary)] transition-colors leading-tight">
                    {lead.razaoSocial}
                </h4>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border tracking-tighter shrink-0 ${agingColors[aging.level]}`}>
                    <Clock size={10} />
                    {aging.text}
                </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mb-4">
                <Globe size={11} className="text-slate-300" />
                <span className="truncate">{lead.municipio}/{lead.uf}</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-5">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Gestão do Lead</span>
                    <span className={progress === 100 ? 'text-emerald-500' : 'text-[var(--primary)]'}>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-700 ease-out rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${lead.instagram ? 'bg-pink-50 text-pink-500 scale-110 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                        <Instagram size={14} />
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${lead.facebook ? 'bg-indigo-50 text-indigo-500 scale-110 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                        <Facebook size={14} />
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${lead.email || lead.emailNotFound ? 'bg-emerald-50 text-emerald-500 scale-110 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                        <Mail size={14} />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-xl bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm">
                        <MessageSquare size={14} />
                    </button>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-md transition-all">
                        <MoreHorizontal size={14} />
                    </div>
                </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute top-0 left-0 w-1 h-0 bg-[var(--primary)] group-hover:h-full transition-all duration-300"></div>
        </div>
    );
};

export default React.memo(KanbanCard);
