
import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { leadService } from '../services/dbService';
import { Users, Activity, BarChart3, ShieldAlert, Clock, Mail, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
    adminEmail: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail }) => {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAdminData = async () => {
            setIsLoading(true);
            const [leadsData, profilesData] = await Promise.all([
                leadService.getAdminLeads(),
                leadService.getAllProfiles()
            ]);
            setAllLeads(leadsData);
            setProfiles(profilesData);
            setIsLoading(false);
        };
        loadAdminData();
    }, []);

    const getVendedorStats = (userId: string) => {
        const userLeads = allLeads.filter(l => l.userId === userId);
        const enriched = userLeads.filter(l => l.status === 'enriched').length;
        const contacted = userLeads.filter(l => l.contacted).length;
        return { total: userLeads.length, enriched, contacted };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-3">
                        <ShieldAlert className="text-red-500" />
                        Painel de Controle Administrativo
                    </h2>
                    <p className="text-[var(--text-muted)] mt-1">Bem-vindo, {adminEmail}. Monitorando {profiles.length} vendedores.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Vendedores</p>
                            <h4 className="text-2xl font-black text-[var(--text-main)]">{profiles.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Leads Totais (MCI)</p>
                            <h4 className="text-2xl font-black text-[var(--text-main)]">{allLeads.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Média por Vendedor</p>
                            <h4 className="text-2xl font-black text-[var(--text-main)]">
                                {profiles.length > 0 ? (allLeads.length / profiles.length).toFixed(1) : 0}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-main)]/50">
                    <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Clock className="text-[var(--primary)]" size={20} />
                        Logs & Performance da Equipe
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-main)]/30 border-b border-[var(--border)]">
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Vendedor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Leads Totais</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Enriquecidos</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Conversões</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Último Acesso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {profiles.map(p => {
                                const stats = getVendedorStats(p.id);
                                return (
                                    <tr key={p.id} className="hover:bg-[var(--bg-main)]/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-[var(--primary)]/20">
                                                    {p.fullname?.charAt(0) || p.email.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[var(--text-main)]">{p.fullname}</div>
                                                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                        <Mail size={10} /> {p.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-[var(--text-main)] border border-[var(--border)]">
                                                {stats.total}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-500">
                                                <CheckCircle2 size={14} /> {stats.enriched}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">
                                                {stats.total > 0 ? `${Math.round((stats.contacted / stats.total) * 100)}%` : '0%'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-[var(--text-main)]">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Registrado em</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
