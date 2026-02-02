
import React from 'react';
import { Menu, X, Shield, Video, Download, Sparkles, Loader2, Users, Globe, Palette, LayoutDashboard } from 'lucide-react';
import { AppTab, Lead } from '../../types';
import { NAVIGATION } from '../../constants';
import { THEMES } from '../ThemeSelector';
import { exportLeadsToCSV } from '../../services/exportService';
import { isLeadFullyManaged } from '../../hooks/useLeadManagement';

interface SidebarProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    user: any;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    userTheme: string;
    availableStates: string[];
    selectedRequestUF: string;
    setSelectedRequestUF: (uf: string) => void;
    handleRequestLeads: (uf?: string) => void;
    processQueue: () => void;
    isEnriching: boolean;
    leads: Lead[];
    isLoading: boolean;
    statusMessage: string;
    handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    user,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    userTheme,
    availableStates,
    selectedRequestUF,
    setSelectedRequestUF,
    handleRequestLeads,
    processQueue,
    isEnriching,
    leads,
    isLoading,
    statusMessage,
    handleLogout
}) => {
    const isAdmin = user?.email === 'paulofernandoautomacao@gmail.com';

    return (
        <aside className={`
      fixed inset-0 z-40 md:relative md:z-auto transition-transform duration-300 ease-in-out
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      w-full md:w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col h-screen
    `}>
            {/* Overlay for mobile when menu is open */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden absolute inset-0 bg-black/50 backdrop-blur-sm -z-10"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="p-6 border-b border-[var(--border)] hidden md:block">
                <div className="flex items-center gap-2">
                    <div key={userTheme} className="w-14 h-14 flex items-center justify-center relative bg-white/10 rounded-2xl overflow-hidden border border-white/10">
                        {(THEMES as any)[userTheme]?.shield ? (
                            <>
                                <img
                                    src={(THEMES as any)[userTheme].shield}
                                    alt="Team Shield"
                                    className="w-12 h-12 object-contain animate-in zoom-in-50 duration-500 z-10"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.opacity = '0';
                                        const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                    }}
                                />
                                <div
                                    className="absolute inset-0 hidden items-center justify-center font-black text-2xl text-[var(--primary)]"
                                    style={{ display: 'none' }}
                                >
                                    {(THEMES as any)[userTheme].name.charAt(0)}
                                </div>
                            </>
                        ) : (
                            <img src="/logo.png" alt="MCI Logo" className="w-full h-full object-contain scale-110" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest opacity-80 leading-none mb-1">
                            {user?.user_metadata?.fullname || 'Vendedor Pro'}
                        </span>
                        <h1 className="font-black text-xl tracking-tighter text-[var(--text-main)]">
                            LeadPro <span className="text-[var(--primary)]">B2B</span>
                        </h1>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 pb-20 space-y-1 overflow-y-auto custom-scrollbar">
                {NAVIGATION.filter(item => {
                    // Vendedores veem Dashboard, CRM, Mural e Estratégia
                    if (!isAdmin) {
                        return item.id === 'dashboard' || item.id === 'crm' || item.id === 'mural' || item.id === 'strategy';
                    }
                    // Admin sees everything
                    return true;
                }).map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id as AppTab);
                            setIsMobileMenuOpen(false); // Close on click for mobile
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.id
                            ? 'bg-[var(--primary)] text-[var(--text-on-primary)] font-black shadow-xl shadow-[var(--primary)]/20 scale-[1.02]'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)] hover:pl-5'
                            }`}
                    >
                        <span className={activeTab === item.id ? 'text-[var(--text-on-primary)] scale-110' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'}>{item.icon}</span>
                        <span className={`text-sm ${activeTab === item.id ? 'text-[var(--text-on-primary)]' : 'font-bold opacity-70 group-hover:opacity-100'}`}>{item.name.toUpperCase()}</span>
                    </button>
                ))}
                {isAdmin && (
                    <button
                        onClick={() => { setActiveTab(AppTab.ADMIN); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === AppTab.ADMIN
                            ? 'bg-[var(--primary)] text-[var(--text-on-primary)] font-black shadow-xl shadow-[var(--primary)]/20'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)] hover:pl-5'
                            }`}
                    >
                        <span className={activeTab === AppTab.ADMIN ? 'text-[var(--text-on-primary)] scale-110' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'}><Shield size={20} /></span>
                        <span className={`text-sm ${activeTab === AppTab.ADMIN ? 'text-[var(--text-on-primary)]' : 'font-bold opacity-70 group-hover:opacity-100'}`}>PAINEL DIRETOR</span>
                    </button>
                )}

                <button
                    onClick={() => { setActiveTab(AppTab.REUNIAO); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === AppTab.REUNIAO
                        ? 'bg-[var(--primary)] text-[var(--text-on-primary)] font-black shadow-xl shadow-[var(--primary)]/20'
                        : 'text-[var(--text-main)] hover:bg-[var(--bg-main)] hover:pl-5'
                        }`}
                >
                    <span className={activeTab === AppTab.REUNIAO ? 'text-[var(--text-on-primary)] scale-110' : 'text-[var(--text-muted)] group-hover:text-[var(--primary)]'}><Video size={20} /></span>
                    <span className={`text-sm ${activeTab === AppTab.REUNIAO ? 'text-[var(--text-on-primary)]' : 'font-bold opacity-70 group-hover:opacity-100'}`}>ARENA DE CONFERÊNCIA</span>
                </button>
            </nav>
            <div className="pt-6 pb-6 px-4 border-t border-[var(--border)] bg-[var(--bg-main)]">
                <div className="flex flex-col gap-2">
                    {/* Status & Actions - Visible only on Mobile Drawer */}
                    <div className="md:hidden">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <div className="text-[10px] uppercase font-black text-[var(--primary)] tracking-widest opacity-80">Ações do Sistema</div>
                            <div className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-[8px] font-black text-emerald-600 uppercase">Online</span>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="space-y-2 mb-4">
                                <button
                                    onClick={() => exportLeadsToCSV(leads)}
                                    disabled={leads.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 py-2.5 px-4 rounded-xl text-xs font-bold"
                                >
                                    <Download size={14} /> EXPORTAR CSV
                                </button>
                                <button
                                    onClick={processQueue}
                                    disabled={isEnriching || leads.filter(l => l.status === 'pending' || l.status === 'failed' || (l.status === 'enriched' && !l.email)).length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold"
                                >
                                    {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    FILA MASTER
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Salesperson Specific Actions */}
                    {!isAdmin && (
                        <div className="space-y-3 pt-1">
                            {/* Indicador de Capacidade */}
                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-[var(--border)]">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacidade de Gestão</span>
                                    <span className={`text-[10px] font-black ${leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length >= 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length}/10
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length >= 8 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min((leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length / 10) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold mt-1.5 leading-tight italic">
                                    {leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length >= 10
                                        ? "⚠️ No limite! Exclua ou desqualifique leads para liberar espaço."
                                        : "Você pode solicitar novos leads enquanto tiver espaço aqui."}
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-800/40 p-3 rounded-xl border border-[var(--border)] shadow-sm space-y-2">
                                <label htmlFor="uf-store-filter" className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 cursor-pointer">
                                    <Globe size={12} className="text-[var(--primary)]" />
                                    Filtrar por UF
                                </label>

                                <select
                                    id="uf-store-filter"
                                    value={selectedRequestUF}
                                    onChange={(e) => setSelectedRequestUF(e.target.value)}
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-lg py-2 px-2.5 text-[11px] font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all cursor-pointer"
                                >
                                    <option value="">Brasil (Tudo)</option>
                                    {availableStates.map(uf => (
                                        <option key={uf} value={uf}>{uf.toUpperCase()}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => { handleRequestLeads(selectedRequestUF); setIsMobileMenuOpen(false); }}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--text-on-primary)] py-3 px-4 rounded-lg text-[10px] font-black hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                                    SOLICITAR LEADS
                                </button>
                            </div>

                            <button
                                onClick={processQueue}
                                disabled={isEnriching || leads.filter(l => (l.status === 'pending' || (l.status === 'enriched' && !l.email))).length === 0}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-[10px] font-black transition-all disabled:opacity-50 ${leads.some(l => l.status === 'pending' || (l.status === 'enriched' && !l.email))
                                    ? 'bg-amber-600 text-white hover:bg-amber-700 animate-pulse ring-4 ring-amber-500/10'
                                    : 'bg-slate-800 text-white hover:bg-black'
                                    }`}
                            >
                                {isEnriching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                ENRIQUECER LEADS
                            </button>
                        </div>
                    )}

                    {statusMessage && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex justify-between items-end px-1">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
                                    {statusMessage.includes('em') ? 'Carregando' : 'Status'}
                                </span>
                                <span className="text-[9px] font-black text-emerald-500/60 uppercase leading-none">
                                    {statusMessage.match(/em (\d+)s/)?.[1] ? `${statusMessage.match(/em (\d+)s/)?.[1]}s` : 'OP'}
                                </span>
                            </div>

                            <div className="relative group">
                                {/* Battery Body */}
                                <div className="h-6 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg border-2 border-slate-200 dark:border-slate-700/50 p-0.5 flex items-center relative overflow-hidden shadow-inner">
                                    {/* Fill Level */}
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-[3px] transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.3)] relative"
                                        style={{
                                            width: statusMessage.match(/em (\d+)s/)
                                                ? `${((4 - parseInt(statusMessage.match(/em (\d+)s/)![1])) / 3) * 100}%`
                                                : statusMessage.includes('concluída') || statusMessage.includes('Sucesso') ? '100%' : '20%'
                                        }}
                                    >
                                        {/* Energy Effect */}
                                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite] -skew-x-12"></div>
                                    </div>

                                    {/* Battery Text overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[8px] font-black text-emerald-900/40 dark:text-emerald-100/40 uppercase tracking-tighter">
                                            {statusMessage}
                                        </span>
                                    </div>
                                </div>

                                {/* Battery Peak */}
                                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-slate-200 dark:bg-slate-700 rounded-r-sm"></div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="w-full mt-2 text-[10px] font-black text-[var(--text-main)] opacity-60 hover:opacity-100 hover:text-red-500 uppercase tracking-widest transition-all py-2"
                    >
                        Sair da Conta (Logout)
                    </button>

                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col items-center gap-1.5 opacity-40 group hover:opacity-100 transition-opacity duration-500">
                        <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-[2px]">Software Original</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Feito com amor por</span>
                            <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-tighter">Paulinho Fernando</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Dashboard Floating Quick Access Button for Mobile */}
            {!isMobileMenuOpen && activeTab !== AppTab.DASHBOARD && (
                <button
                    onClick={() => setActiveTab(AppTab.DASHBOARD)}
                    className="md:hidden fixed bottom-6 left-6 z-50 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce-subtle border-4 border-white dark:border-slate-800"
                    title="Voltar ao Dashboard"
                >
                    <LayoutDashboard size={24} />
                </button>
            )}
        </aside>
    );
};

export default Sidebar;
