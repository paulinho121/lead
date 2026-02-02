
import React, { useEffect, useState, useMemo } from 'react';
import { Lead } from '../types';
import { leadService } from '../services/dbService';
import { Search, MapPin, Phone, Mail, Building2, User, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '../services/supabase';

interface MuralProps {
    profiles: any[];
}

const Mural: React.FC<MuralProps> = ({ profiles }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();

        // Real-time updates
        const channel = supabase
            .channel('mural_realtime_leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await leadService.getContactedLeads();
            setLeads(data);
        } catch (error) {
            console.error('Error loading mural data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const searchLower = searchTerm.toLowerCase();
            const seller = profiles.find(p => p.id === lead.userId);
            const sellerName = seller?.fullname || seller?.email?.split('@')[0] || '';

            return (
                lead.razaoSocial.toLowerCase().includes(searchLower) ||
                (lead.municipio && lead.municipio.toLowerCase().includes(searchLower)) ||
                (lead.uf && lead.uf.toLowerCase().includes(searchLower)) ||
                sellerName.toLowerCase().includes(searchLower)
            );
        });
    }, [leads, searchTerm, profiles]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Mural de Atendimentos</h2>
                    <p className="text-slate-500 text-sm mt-1">Veja quais leads já foram contactados por toda a equipe.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por empresa, cidade ou vendedor..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-medium shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-bold text-slate-400">Carregando mural...</p>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Nenhum atendimento encontrado</h3>
                    <p className="text-slate-500 text-sm mt-1">Experimente mudar o termo da busca.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads.map((lead) => {
                        const seller = profiles.find(p => p.id === lead.userId);
                        const sellerName = seller?.fullname || seller?.email?.split('@')[0] || 'Desconhecido';

                        return (
                            <div key={lead.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-[var(--primary)]/20 transition-all group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                                        Atendido
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(lead.capturedAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <h4 className="text-base font-black text-slate-800 leading-tight mb-2 line-clamp-2 min-h-[3rem]">
                                    {lead.razaoSocial}
                                </h4>

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span className="font-medium truncate">{lead.municipio} - {lead.uf}</span>
                                    </div>

                                    {(lead.email || lead.telefone) && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {lead.email && <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500"><Mail size={12} /> Email</div>}
                                            {lead.telefone && <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500"><Phone size={12} /> Tel</div>}
                                        </div>
                                    )}

                                    {lead.observations && (
                                        <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50 mt-2">
                                            <p className="text-[11px] text-amber-800 italic line-clamp-2">
                                                "{lead.observations}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                            <User size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendedor</span>
                                            <span className="text-xs font-bold text-slate-700">{sellerName}</span>
                                        </div>
                                    </div>

                                    {lead.website && (
                                        <a
                                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-400 hover:text-[var(--primary)] transition-colors"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Mural;
