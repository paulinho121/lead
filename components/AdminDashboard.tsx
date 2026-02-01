
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, Profile } from '../types';
import { leadService } from '../services/dbService';
import {
    Users, Activity, BarChart3, ShieldAlert, Clock,
    Mail, CheckCircle2, RefreshCw, Trophy, Target,
    TrendingUp, AlertTriangle, Search, MessageSquare,
    Zap, Ban
} from 'lucide-react';

interface AdminDashboardProps {
    adminEmail: string;
    adminId?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail, adminId }) => {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [stats, setStats] = useState({ total: 0, enriched: 0, pending: 0, failed: 0, hasContact: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState<'overview' | 'audit'>('overview');
    const [auditSearch, setAuditSearch] = useState('');

    useEffect(() => {
        const loadAdminData = async () => {
            setIsLoading(true);
            try {
                const [leadsData, profilesData, globalStats] = await Promise.all([
                    leadService.getAdminLeads(),
                    leadService.getAllProfiles(),
                    leadService.getStats()
                ]);

                // Ghost user detection
                const userCounts = new Set<string>();
                leadsData.forEach(l => { if (l.userId) userCounts.add(l.userId); });
                const existingProfileIds = new Set(profilesData.map(p => p.id));
                const mergedProfiles = [...profilesData];
                userCounts.forEach(uid => {
                    if (!existingProfileIds.has(uid)) {
                        mergedProfiles.push({
                            id: uid,
                            email: 'vendedor.novo@mci.br',
                            fullname: `Vendedor (ID: ${uid.substring(0, 8)}...)`,
                            role: 'vendedor',
                            online_status: false
                        });
                    }
                });

                setAllLeads(leadsData);
                setProfiles(mergedProfiles);
                setStats(globalStats);
                setIsLoading(false);
            } catch (error) {
                console.error("Erro ao carregar dados admin:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAdminData();

        const interval = setInterval(loadAdminData, 30000);
        return () => clearInterval(interval);
    }, []);

    const sellerMetrics = useMemo(() => {
        return profiles.map(profile => {
            const userLeads = allLeads.filter(l => l.userId === profile.id);
            const total = userLeads.length;
            const contacted = userLeads.filter(l => l.contacted).length;
            const won = userLeads.filter(l => l.stage === 'closed_won').length;
            const lost = userLeads.filter(l => l.stage === 'closed_lost').length;
            const conversionRate = total > 0 ? (won / total) * 100 : 0;
            const activityRate = total > 0 ? (contacted / total) * 100 : 0;

            return {
                ...profile,
                total,
                contacted,
                won,
                lost,
                conversionRate,
                activityRate
            };
        }).sort((a, b) => b.won - a.won);
    }, [profiles, allLeads]);

    const lostStats = useMemo(() => {
        const reasons: Record<string, number> = {};
        allLeads.filter(l => l.stage === 'closed_lost' && l.lostReason).forEach(l => {
            reasons[l.lostReason!] = (reasons[l.lostReason!] || 0) + 1;
        });
        return Object.entries(reasons).sort((a, b) => b[1] - a[1]);
    }, [allLeads]);

    if (isLoading && allLeads.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                            <ShieldAlert size={20} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Painel Executivo</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-slate-500 text-sm font-medium">Equipe: <span className="text-slate-800 font-bold">{profiles.length} vendedores</span></p>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                {profiles.filter(p => p.online_status).length} ONLINE
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeView === 'overview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        VISÃO GERAL
                    </button>
                    <button
                        onClick={() => setActiveView('audit')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeView === 'audit' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        AUDITORIA
                    </button>
                </div>
            </header>

            {activeView === 'overview' ? (
                <>
                    {/* KPIs Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total de Leads', value: stats.total, icon: <Activity />, color: 'blue' },
                            { label: 'Conversão Global', value: `${Math.round((allLeads.filter(l => l.stage === 'closed_won').length / Math.max(1, allLeads.filter(l => l.userId).length)) * 100)}%`, icon: <TrendingUp />, color: 'emerald' },
                            { label: 'Aguardando Distribuição', value: allLeads.filter(l => !l.userId).length, icon: <Clock />, color: 'amber' },
                            { label: 'Leads em Negociação', value: allLeads.filter(l => l.stage === 'negotiation').length, icon: <Target />, color: 'purple' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    {kpi.icon}
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <h4 className="text-2xl font-black text-slate-800">{kpi.value}</h4>
                            </div>
                        ))}
                    </div>

                    {/* Ranking & AI Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Trophy className="text-amber-500" />
                                    Top Performance da Equipe
                                </h3>
                                <Zap className="text-amber-400 animate-pulse" size={24} />
                            </div>
                            <div className="p-4 flex-1">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">Rank</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">Vendedor</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Fechados</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Taxa</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Meta</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {sellerMetrics.slice(0, 5).map((seller, idx) => (
                                            <tr key={seller.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-4 py-5 font-black text-slate-300">#{idx + 1}</td>
                                                <td className="px-4 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-[var(--primary)] text-white font-black rounded-xl flex items-center justify-center relative">
                                                            {seller.fullname.charAt(0)}
                                                            {seller.online_status && <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>}
                                                        </div>
                                                        <div className="font-bold text-slate-800 text-sm">{seller.fullname}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center font-black text-emerald-600">{seller.won}</td>
                                                <td className="px-4 py-5 text-center font-black text-slate-700">{Math.round(seller.conversionRate)}%</td>
                                                <td className="px-4 py-5">
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-[var(--primary)] h-full" style={{ width: `${Math.min(100, (seller.won / 10) * 100)}%` }}></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-8 text-white shadow-xl">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <ShieldAlert className="text-red-400" /> Auditoria de Perdas
                            </h3>
                            <div className="space-y-6">
                                {lostStats.map(([reason, count]) => (
                                    <div key={reason} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-400">{reason}</span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-red-500 h-full" style={{ width: `${(count / Math.max(1, allLeads.filter(l => l.stage === 'closed_lost').length)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Talent Management Cards */}
                    <div className="bg-white rounded-[40px] border border-slate-100 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800">Gestão de Talentos</h3>
                            <input
                                type="text"
                                placeholder="Filtrar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold w-64 focus:ring-2 focus:ring-[var(--primary)]/20"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sellerMetrics.filter(s => s.fullname.toLowerCase().includes(searchTerm.toLowerCase())).map(seller => (
                                <div key={seller.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-[var(--primary)]/30 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[var(--primary)] shadow-sm">
                                                {seller.fullname.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{seller.fullname}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{seller.online_status ? 'Ativo' : 'Offline'}</p>
                                            </div>
                                        </div>
                                        <button className="text-slate-300 hover:text-[var(--primary)]"><MessageSquare size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white p-3 rounded-2xl text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">WON</p>
                                            <p className="text-lg font-black text-slate-800">{seller.won}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Taxa</p>
                                            <p className="text-lg font-black text-slate-800">{Math.round(seller.conversionRate)}%</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full" style={{ width: `${seller.activityRate}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Zona de Perigo & Configurações de Fila */}
                    <div className="bg-white rounded-[40px] border border-red-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-red-50 bg-red-50/20">
                            <h3 className="text-xl font-black text-red-700 flex items-center gap-2">
                                <ShieldAlert size={24} />
                                Controle Mestre & Segurança
                            </h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800">Reciclagem de Oportunidades</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Limpe automaticamente a fila de vendedores que não contatam os leads enriquecidos em até 72h.
                                </p>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('Reciclar leads parados agora?')) {
                                            const count = await leadService.recycleLeads(3);
                                            alert(`${count} leads reciclados!`);
                                            window.location.reload();
                                        }
                                    }}
                                    className="px-6 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                >
                                    <RefreshCw size={16} /> RECICLAR AGORA
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800">Reset Total da Operação</h4>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Remove permanentemente todos os leads de todos os vendedores e do administrador.
                                </p>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('EXCLUIR TUDO?')) {
                                            await leadService.clearAllLeads();
                                            window.location.reload();
                                        }
                                    }}
                                    className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Ban size={16} /> ZERAR BANCO MASTER
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800">Auditoria de Leads e Ações</h3>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Empresa ou vendedor..."
                                value={auditSearch}
                                onChange={(e) => setAuditSearch(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold w-80 focus:ring-2 focus:ring-[var(--primary)]/20"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {allLeads
                                    .filter(l => l.userId && (l.razaoSocial.toLowerCase().includes(auditSearch.toLowerCase()) || profiles.find(p => p.id === l.userId)?.fullname?.toLowerCase().includes(auditSearch.toLowerCase())))
                                    .slice(0, 50).map(lead => (
                                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-slate-800 text-sm">{lead.razaoSocial}</div>
                                                <div className="text-[10px] text-slate-400">{lead.municipio}</div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                                {profiles.find(p => p.id === lead.userId)?.fullname || 'Desconhecido'}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${lead.stage === 'closed_lost' ? 'bg-red-100 text-red-600' : lead.stage === 'closed_won' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {lead.stage === 'closed_lost' ? lead.lostReason || 'PERDIDO' : lead.stage || 'ATIVO'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Reciclar este lead? Ele voltará para a fila master.')) {
                                                            await leadService.upsertLeads([{ ...lead, userId: null, stage: 'lead', contacted: false, lostReason: null }]);
                                                            window.location.reload();
                                                        }
                                                    }}
                                                    className="text-[10px] font-black text-[var(--primary)] uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Reciclar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
