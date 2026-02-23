
import React from 'react';
import { Menu, X, Download, Sparkles, Loader2, Palette, Sun, Moon, Globe, Users, TrendingUp } from 'lucide-react';
import { AppTab, Lead } from '../../types';
import { NAVIGATION } from '../../constants';
import { exportLeadsToCSV } from '../../services/exportService';
import { isLeadFullyManaged } from '../../hooks/useLeadManagement';

interface TopBarProps {
    activeTab: AppTab;
    user: any;
    leads: Lead[];
    isEnriching: boolean;
    processQueue: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    setIsThemeSelectorOpen: (open: boolean) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    // Novos campos
    availableStates: string[];
    selectedRequestUF: string;
    setSelectedRequestUF: (uf: string) => void;
    handleRequestLeads: (uf?: string) => void;
    isLoading: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
    activeTab,
    user,
    leads,
    isEnriching,
    processQueue,
    theme,
    toggleTheme,
    setIsThemeSelectorOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    availableStates,
    selectedRequestUF,
    setSelectedRequestUF,
    handleRequestLeads,
    isLoading
}) => {
    const isAdmin = user?.email === 'paulofernandoautomacao@gmail.com' || user?.role === 'admin';
    const activeLeadsCount = leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l)).length;

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-sidebar)] border-b border-[var(--border)] sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-12 h-10 flex items-center justify-center">
                        <img src="/logo.png" alt="MCI Logo" className="w-full h-full object-contain scale-125" />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight leading-tight">
                        <span className="block text-[8px] text-[var(--primary)] font-black uppercase tracking-widest opacity-70">
                            {user?.fullname || 'Vendedor Pro'} {user?.display_id ? `#${user.display_id}` : ''}
                        </span>
                        LP <span className="text-[var(--primary)] text-sm">B2B</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {!isAdmin && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20">
                            <TrendingUp size={12} className="text-[var(--primary)]" />
                            <span className="text-[10px] font-black text-[var(--primary)]">{activeLeadsCount}/10</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-xl transition-all ${isMobileMenuOpen
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                            }`}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Desktop Top Bar */}
            <header className="hidden md:flex h-20 items-center justify-between px-10 bg-[var(--bg-sidebar)]/50 backdrop-blur-xl border-b border-[var(--border)] z-30">
                <div className="flex items-center gap-6">
                    <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] min-w-[150px]">
                        {(NAVIGATION.find(n => n.id === activeTab)?.name || (activeTab === AppTab.ADMIN ? 'Painel Diretor' : 'Arena de Conferência')).toUpperCase()}
                    </h2>

                    {/* Salesperson Widgets in TopBar */}
                    {!isAdmin && (
                        <div className="flex items-center gap-6 px-6 border-l border-[var(--border)]">
                            {/* Capacity Chart */}
                            <div className="flex flex-col gap-1.5 min-w-[180px]">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    <span>Capacidade de Gestão</span>
                                    <span className={activeLeadsCount >= 10 ? 'text-red-500' : 'text-[var(--primary)]'}>{activeLeadsCount}/10</span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-[var(--border)]">
                                    <div
                                        className={`h-full transition-all duration-1000 ${activeLeadsCount >= 8 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-[var(--primary)] shadow-[0_0_10px_rgba(255,215,0,0.5)]'}`}
                                        style={{ width: `${Math.min((activeLeadsCount / 10) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Lead Request Logic */}
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                                    <select
                                        value={selectedRequestUF}
                                        onChange={(e) => setSelectedRequestUF(e.target.value)}
                                        className="bg-white/50 dark:bg-slate-800/50 border border-[var(--border)] rounded-xl py-2.5 pl-9 pr-6 text-[10px] font-black text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                                    >
                                        <option value="">Brasil (Tudo)</option>
                                        {availableStates.map(uf => (
                                            <option key={uf} value={uf}>{uf.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => handleRequestLeads(selectedRequestUF)}
                                    disabled={isLoading || activeLeadsCount >= 10}
                                    className="flex items-center gap-2 bg-[var(--primary)] text-[var(--text-on-primary)] px-6 py-2.5 rounded-xl text-[10px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                                    SOLICITAR LEADS
                                </button>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="flex items-center gap-3 px-6 border-l border-[var(--border)]">
                            <div className="flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/10">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistema Online</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* System Quick Actions for Admin in Top Bar */}
                    {isAdmin && (
                        <div className="flex items-center gap-2 mr-4">
                            <button
                                onClick={() => exportLeadsToCSV(leads)}
                                disabled={leads.length === 0}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-[var(--border)] px-4 py-2.5 rounded-xl text-[10px] font-black text-[var(--text-main)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                            >
                                <Download size={14} /> EXPORTAR CSV
                            </button>
                            <button
                                onClick={processQueue}
                                disabled={isEnriching}
                                className="flex items-center gap-2 bg-[var(--primary)] text-[var(--text-on-primary)] px-4 py-2.5 rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                            >
                                {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                FILA MASTER
                            </button>
                        </div>
                    )}

                    <div className="h-8 w-px bg-[var(--border)] mx-2"></div>

                    <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl border border-[var(--border)]">
                        <button
                            onClick={() => setIsThemeSelectorOpen(true)}
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[var(--text-main)] transition-all shadow-sm"
                            title="Personalizar Tema"
                        >
                            <Palette size={18} />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[var(--text-main)] transition-all shadow-sm"
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
};

export default TopBar;
