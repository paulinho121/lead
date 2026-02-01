
import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { leadService } from '../services/dbService';
import { Users, Activity, BarChart3, ShieldAlert, Clock, Mail, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
    adminEmail: string;
    adminId?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail, adminId }) => {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, enriched: 0, pending: 0, failed: 0, hasContact: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAdminData = async () => {
            setIsLoading(true);
            try {
                const [leadsData, profilesData, globalStats] = await Promise.all([
                    leadService.getAdminLeads(),
                    leadService.getAllProfiles(),
                    leadService.getStats()
                ]);

                // Track counts for EVERY userId found in the system
                const userCounts: Record<string, { total: number, enriched: number, contacted: number }> = {};
                leadsData.forEach(l => {
                    const uid = l.userId;
                    if (uid) {
                        if (!userCounts[uid]) userCounts[uid] = { total: 0, enriched: 0, contacted: 0 };
                        userCounts[uid].total++;
                        if (l.status === 'enriched') userCounts[uid].enriched++;
                        if (l.contacted) userCounts[uid].contacted++;
                    }
                });

                const existingProfileIds = new Set(profilesData.map(p => p.id));
                const mergedProfiles = [...profilesData];

                // Check for "Ghost" users (ID exists in leads but not in profiles table)
                Object.keys(userCounts).forEach(uid => {
                    if (!existingProfileIds.has(uid)) {
                        mergedProfiles.push({
                            id: uid,
                            email: 'vendedor.novo@mci.br',
                            fullname: `Vendedor (ID: ${uid.substring(0, 8)}...)`,
                            isGhost: true,
                            created_at: new Date().toISOString()
                        });
                    }
                });

                setAllLeads(leadsData);
                setProfiles(mergedProfiles);
                setStats(globalStats);
            } catch (error) {
                console.error("Erro ao carregar dados admin:", error);
            } finally {
                setIsLoading(false);
            }
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
                            <h4 className="text-2xl font-black text-[var(--text-main)]">{stats.total}</h4>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Leads para Distribuição</p>
                            <h4 className="text-2xl font-black text-[var(--text-main)]">
                                {allLeads.filter(l => !l.userId).length}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nova Seção de Distribuição movida para o topo */}
            <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-blue-50/5 dark:bg-blue-500/5">
                    <h3 className="font-bold text-[var(--primary)] flex items-center gap-2">
                        <Users size={20} />
                        Distribuição de Leads para a Equipe
                    </h3>
                    <span className="px-3 py-1 bg-[var(--info-light)] text-[var(--primary)] rounded-full text-[10px] font-black uppercase tracking-wider border border-[var(--primary)]/10">
                        Ação Necessária
                    </span>
                </div>
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2">
                        <h4 className="text-xl font-black text-[var(--text-main)]">Mover Leads para a Fila Master</h4>
                        <p className="text-sm text-[var(--text-muted)] max-w-xl leading-relaxed font-medium">
                            Atualmente, você possui <strong>{getVendedorStats(adminId || '').total} leads</strong> vinculados à sua conta de administrador.
                            Vendedores só podem solicitar leads que estão na <strong>Fila Master (Sem Dono)</strong>.
                        </p>
                        <div className="flex gap-4 text-xs font-bold">
                            <span className="text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 size={14} /> {getVendedorStats(adminId || '').enriched} Enriquecidos
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (!adminId) {
                                alert('Erro: ID do administrador não identificado. Tente atualizar a página.');
                                return;
                            }
                            const stats = getVendedorStats(adminId);
                            if (stats.total === 0) {
                                alert('Você não possui leads na sua conta para liberar.');
                                return;
                            }
                            if (window.confirm(`Deseja liberar todos os seus ${stats.total} leads para que os vendedores possam solicitá-los?`)) {
                                try {
                                    setIsLoading(true);
                                    const count = await leadService.releaseAdminLeads(adminId);
                                    alert(`Sucesso! ${count} leads foram movidos para a Fila Master e agora estão disponíveis para os vendedores.`);
                                    window.location.reload();
                                } catch (error) {
                                    alert('Erro ao liberar leads: ' + (error as any).message);
                                } finally {
                                    setIsLoading(false);
                                }
                            }
                        }}
                        disabled={getVendedorStats(adminId || '').total === 0}
                        className="w-full md:w-auto px-8 py-5 bg-[var(--primary)] text-white rounded-2xl font-black text-sm hover:bg-[var(--primary-hover)] transition-all shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale"
                    >
                        <Users size={24} className="group-hover:scale-110 transition-transform" />
                        LIBERAR LEADS AGORA
                    </button>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-main)]">
                    <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Clock className="text-[var(--primary)]" size={20} />
                        Logs & Performance da Equipe
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-main)] border-b border-[var(--border)]">
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Vendedor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Leads Totais</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Enriquecidos</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Conversões</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Último Acesso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {profiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)] italic">
                                        Nenhum vendedor identificado ainda.
                                    </td>
                                </tr>
                            )}

                            {profiles.map(p => {
                                const statsVendedor = getVendedorStats(p.id);
                                return (
                                    <tr key={p.id} className={`hover:bg-[var(--bg-main)] transition-colors group ${p.isGhost ? 'bg-amber-500/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${p.isGhost ? 'bg-amber-500' : 'bg-[var(--primary)]'} text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-[var(--primary)]/10`}>
                                                    {(p.fullname || p.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                                                        {p.fullname || 'Usuário sem Nome'}
                                                        {p.isGhost && (
                                                            <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md uppercase font-black border border-amber-500/20">Pendente Login</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                        <Mail size={10} /> {p.email || 'Email pendente'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-[var(--bg-main)] text-[var(--text-main)] rounded-full text-xs font-bold border border-[var(--border)] shadow-sm">
                                                {statsVendedor.total}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-500">
                                                <CheckCircle2 size={14} /> {statsVendedor.enriched}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold border border-emerald-500/20">
                                                {statsVendedor.total > 0 ? `${Math.round((statsVendedor.contacted / statsVendedor.total) * 100)}%` : '0%'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-[var(--text-main)]">
                                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Desconhecido'}
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                                                {p.isGhost ? 'Detectado em Leads' : 'Registrado em'}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Unassigned Leads Row */}
                            {allLeads.filter(l => !l.userId).length > 0 && (
                                <tr className="bg-slate-50/80">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-300 text-slate-600 rounded-2xl flex items-center justify-center font-black text-sm">
                                                ?
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-600">Leads em Espera (Distribuição)</div>
                                                <div className="text-xs text-slate-400">Aguardando solicitação da equipe</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 bg-white text-slate-400 rounded-full text-xs font-bold border border-slate-100">
                                            {allLeads.filter(l => !l.userId).length}
                                        </span>
                                    </td>
                                    <td colSpan={3} className="px-6 py-4 text-xs text-slate-400 italic">
                                        Fila central aguardando vendedores.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[32px] border border-red-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-red-100 flex items-center justify-between bg-red-50/30">
                    <h3 className="font-bold text-red-700 flex items-center gap-2">
                        <ShieldAlert size={20} />
                        Zona de Perigo (Ações Destrutivas)
                    </h3>
                </div>
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="font-bold text-slate-900">Zerar Banco de Dados de Leads</h4>
                        <p className="text-sm text-slate-500 max-w-md">
                            Esta ação removerá <strong>todos os leads ({stats.total})</strong> permanentemente.
                            Use isto para recomeçar o processo de captura do zero com os novos padrões.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            if (window.confirm('🚨 TEM CERTEZA? Esta ação não pode ser desfeita e TODOS os leads serão apagados permanentemente.')) {
                                try {
                                    setIsLoading(true);
                                    await leadService.clearAllLeads();
                                    alert('Banco de dados zerado com sucesso! Recarregando...');
                                    window.location.reload();
                                } catch (error) {
                                    alert('Erro ao zerar banco: ' + (error as any).message);
                                } finally {
                                    setIsLoading(false);
                                }
                            }
                        }}
                        className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2"
                    >
                        <ShieldAlert size={20} />
                        ZERAR E RECOMEÇAR TUDO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
