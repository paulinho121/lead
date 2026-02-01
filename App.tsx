
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { AppTab, Lead } from './types';
import { NAVIGATION, COLORS } from './constants';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Enricher from './components/Enricher';
import Strategy from './components/Strategy';
import CRM from './components/CRM';
import { exportLeadsToCSV } from './services/exportService';
import { Download, RefreshCw, Sparkles, Loader2, Users, Globe, Palette, Sun, Moon, Menu, X } from 'lucide-react';
import { leadService } from './services/dbService';
import { backgroundEnricher } from './services/backgroundEnricher';
import { Analytics } from "@vercel/analytics/react"
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import { isLeadFullyManaged } from './hooks/useLeadManagement';
import Mural from './components/Mural.tsx';
import TeamChat from './components/TeamChat';
import ThemeSelector, { THEMES } from './components/ThemeSelector';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRequestUF, setSelectedRequestUF] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [rankingLeads, setRankingLeads] = useState<any[]>([]);
  const [userTheme, setUserTheme] = useState(() => {
    return localStorage.getItem('user-manto-theme') || 'default';
  });
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  useEffect(() => {
    const activeTheme = (THEMES as any)[userTheme] || THEMES.default;
    document.documentElement.style.setProperty('--primary', activeTheme.primary);
    document.documentElement.style.setProperty('--primary-hover', activeTheme.hover);
    document.documentElement.style.setProperty('--accent', activeTheme.primary);
    localStorage.setItem('user-manto-theme', userTheme);
  }, [userTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      if (session) {
        leadService.syncProfile(session.user.id, session.user.email!, session.user.user_metadata?.fullname);
        loadLeads(session.user);
        loadStats();
        loadAvailableStates();
        loadProfiles(session.user);
        loadRanking();
      }
    });

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      if (session) {
        leadService.syncProfile(session.user.id, session.user.email!, session.user.user_metadata?.fullname);
        loadLeads(session.user);
        loadStats();
        loadAvailableStates();
        loadProfiles(session.user);
        loadRanking();
      }
      else {
        setLeads([]);
        setProfiles([]);
        setRankingLeads([]);
      }
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  // Heartbeat for online status
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        leadService.updateHeartbeat(user.id);
      }, 30000); // Pulse every 30s

      // Cleanup on visibility change or tab close
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          leadService.setOffline(user.id);
        } else {
          leadService.updateHeartbeat(user.id);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        leadService.setOffline(user.id);
      };
    }
  }, [user]);

  // Real-time profiles update
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('profiles_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          loadProfiles();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadProfiles = async (currentUser?: any) => {
    try {
      const data = await leadService.getAllProfiles();
      setProfiles(data);
      const activeUser = currentUser || user;
      if (activeUser) {
        const myProfile = data.find(p => p.id === activeUser.id);
        if (myProfile?.theme) setUserTheme(myProfile.theme);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAvailableStates = async () => {
    try {
      const states = await leadService.getAvailableStates();
      setAvailableStates(states);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await leadService.getStats();
      setTotalLeadCount(stats.total);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  const loadRanking = async () => {
    try {
      const data = await leadService.getGlobalRanking();
      setRankingLeads(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadLeads = async (currentUser?: any) => {
    setIsLoading(true);
    try {
      const activeUser = currentUser || user;
      const isAdmin = activeUser?.email === 'paulofernandoautomacao@gmail.com';
      const data = await leadService.getAllLeads(isAdmin ? undefined : activeUser?.id);
      setLeads(data);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processQueue = async () => {
    const pendingLeads = leads.filter(l =>
      l.status === 'pending' ||
      l.status === 'failed' ||
      (l.status === 'enriched' && !l.email)
    );
    if (pendingLeads.length === 0) {
      alert("Nenhum lead pendente, com falha ou sem email na fila.");
      return;
    }

    if (!confirm(`Deseja iniciar o enriquecimento de ${pendingLeads.length} leads? (Isso incluirá leads que estão sem email).`)) {
      return;
    }

    setIsEnriching(true);
    setStatusMessage('Iniciando...');
    try {
      await backgroundEnricher.processLeads(
        pendingLeads,
        (updated) => updateLead(updated),
        (type, msg) => {
          console.log(`[Enricher] ${type}: ${msg}`);
          if (type === 'info' || type === 'success') {
            setStatusMessage(msg);
          }
        }
      );
      setStatusMessage('Fila concluída!');
    } catch (error) {
      console.error("Erro no processamento da fila:", error);
      setStatusMessage('Erro no processo');
    } finally {
      setTimeout(() => {
        setIsEnriching(false);
        setStatusMessage('');
      }, 2000);
      loadLeads();
      loadStats();
    }
  };

  const addLeads = async (newLeads: Lead[]) => {
    if (!user) return;
    try {
      const isAdmin = user.email === 'paulofernandoautomacao@gmail.com';
      const leadsWithUser = newLeads.map(l => ({ ...l, userId: isAdmin ? null : user.id }));
      await leadService.upsertLeads(leadsWithUser);
      await loadLeads();
      await loadStats();
    } catch (error) {
      alert("Erro ao salvar novos leads no banco de dados.");
    }
  };

  const updateLead = async (updatedLead: Lead) => {
    if (!user) return;
    try {
      // 1. Optimistic UI update
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));

      // 2. Database update
      const leadWithUser = { ...updatedLead, userId: user.id };
      await leadService.upsertLeads([leadWithUser]);

      // 3. Stats update (silent)
      loadStats();
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
      // Reload leads from server if update fails
      loadLeads();
      alert("Houve um erro ao sincronizar o lead com o servidor. A página foi atualizada.");
    }
  };

  const handleLogout = async () => {
    if (user) await leadService.setOffline(user.id);
    await supabase?.auth.signOut();
  };

  const handleRequestLeads = async (uf?: string) => {
    if (!user) return;
    const unmanagedLeads = leads.filter(l => l.status === 'enriched' && !isLeadFullyManaged(l));

    if (unmanagedLeads.length > 0) {
      alert(`⚠️ Bloqueio de Segurança: Você possui ${unmanagedLeads.length} leads no seu CRM que ainda não foram totalmente geridos. 

Para solicitar um novo lote, você precisa para CADA lead:
1. Adicionar o Instagram
2. Adicionar o Facebook
3. Adicionar o E-mail (ou marcar 'E-mail não encontrado')
4. Marcar como Contatado/Finalizado`);
      return;
    }

    setIsLoading(true);
    try {
      const beforeCount = leads.length;
      await leadService.requestNewLeads(user.id, uf);
      const data = await leadService.getAllLeads(user.id);
      setLeads(data);
      await loadStats();
      await loadAvailableStates();

      if (data.length > beforeCount) {
        alert(`Sucesso! ${data.length - beforeCount} novos leads${uf ? ` de ${uf}` : ''} foram atribuídos a você.`);
      } else {
        alert(`Não há leads disponíveis ${uf ? `para o estado ${uf} ` : ''}na fila central que já foram enriquecidos. Aguarde o administrador processar a fila master.`);
      }
    } catch (error) {
      alert(`Erro ao solicitar leads: ${error?.message || error?.details || (error instanceof Error ? error.message : 'Serviço indisponível')}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLeads = async () => {
    if (window.confirm("Deseja realmente limpar toda a base de leads no banco de dados?")) {
      try {
        await leadService.clearAllLeads();
        setLeads([]);
        setTotalLeadCount(0);
      } catch (error) {
        alert("Erro ao limpar base de dados.");
      }
    }
  };

  if (!isAuthenticated) {
    return authView === 'login'
      ? <Login onLogin={() => setIsAuthenticated(true)} onGoToRegister={() => setAuthView('register')} />
      : <Register onRegister={() => {
        setIsAuthenticated(true);
        setAuthView('login');
      }} onBackToLogin={() => setAuthView('login')} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-main)] transition-colors duration-300">
      {/* Mobile Header (Only visible on small screens) */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-sidebar)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-12 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="MCI Logo" className="w-full h-full object-contain scale-125" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">LeadPro <span className="text-[var(--primary)]">B2B</span></h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`p-2 rounded-xl transition-all ${isMobileMenuOpen
            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
            }`}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar / Drawer */}
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
          <div className="flex items-center gap-2 mb-1">
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
            <h1 className="font-bold text-xl tracking-tight text-[var(--text-main)]">LeadPro <span className="text-[var(--primary)]">B2B</span></h1>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{(THEMES as any)[userTheme]?.name || 'Inteligência de Vendas'}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsThemeSelectorOpen(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-muted)] transition-colors"
                title="Personalizar Tema"
              >
                <Palette size={14} />
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-muted)] transition-colors"
                title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAVIGATION.filter(item => {
            const isAdmin = user?.email === 'paulofernandoautomacao@gmail.com';
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
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 ${activeTab === item.id
                ? 'bg-[var(--primary)] text-white font-bold shadow-lg shadow-[var(--primary)]/20'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                }`}
            >
              <span className={activeTab === item.id ? 'text-white scale-110' : 'text-[var(--text-muted)]'}>{item.icon}</span>
              <span className={`text-sm ${activeTab === item.id ? 'text-white' : 'font-medium'}`}>{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-main)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <div className="text-[10px] uppercase font-black text-[var(--primary)] tracking-widest">Ações do Sistema</div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-black text-emerald-600 uppercase">Online</span>
              </div>
            </div>

            {/* Admin Specific Actions */}
            {user?.email === 'paulofernandoautomacao@gmail.com' && (
              <>
                <button
                  onClick={() => exportLeadsToCSV(leads)}
                  disabled={leads.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-50"
                >
                  <Download size={14} /> EXPORTAR CSV
                </button>
                <button
                  onClick={processQueue}
                  disabled={isEnriching || leads.filter(l => l.status === 'pending' || l.status === 'failed' || (l.status === 'enriched' && !l.email)).length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  ENRIQUECER FILA MASTER
                </button>
              </>
            )}

            {/* Salesperson Specific Actions */}
            {user?.email !== 'paulofernandoautomacao@gmail.com' && (
              <div className="space-y-4 pt-2">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-[var(--border)] shadow-sm space-y-3">
                  <label htmlFor="uf-store-filter" className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1 cursor-pointer">
                    <Globe size={12} className="text-[var(--primary)]" />
                    Filtrar por UF
                  </label>

                  <select
                    id="uf-store-filter"
                    value={selectedRequestUF}
                    onChange={(e) => setSelectedRequestUF(e.target.value)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-xs font-bold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all cursor-pointer"
                  >
                    <option value="">Brasil (Tudo)</option>
                    {availableStates.map(uf => (
                      <option key={uf} value={uf}>{uf.toUpperCase()}</option>
                    ))}
                  </select>
                  {availableStates.length === 0 && (
                    <p className="text-[9px] text-amber-600 font-bold px-1">
                      Nota: Filtros de UF aparecem somente para leads que já foram enriquecidos pela TI.
                    </p>
                  )}

                  <button
                    onClick={() => { handleRequestLeads(selectedRequestUF); setIsMobileMenuOpen(false); }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-3.5 px-4 rounded-xl text-xs font-black hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                    SOLICITAR +20 LEADS
                  </button>
                </div>

                <button
                  onClick={processQueue}
                  disabled={isEnriching || leads.filter(l => (l.status === 'pending' || (l.status === 'enriched' && !l.email))).length === 0}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${leads.some(l => l.status === 'pending' || (l.status === 'enriched' && !l.email))
                    ? 'bg-amber-600 text-white hover:bg-amber-700 animate-pulse ring-4 ring-amber-500/10'
                    : 'bg-slate-800 text-white hover:bg-black'
                    }`}
                >
                  {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  ENRIQUECER MEUS LEADS
                </button>
              </div>
            )}

            {statusMessage && (
              <div className="text-[10px] font-bold text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 animate-pulse">
                {statusMessage}
              </div>
            )}

            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="w-full mt-2 text-[10px] font-black text-[var(--text-main)] opacity-60 hover:opacity-100 hover:text-red-500 uppercase tracking-widest transition-all py-2"
            >
              Sair da Conta (Logout)
            </button>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col items-center gap-1 opacity-40">
              <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-[2px]">Versão de Fábrica</span>
              <span className="text-[8px] font-bold text-[var(--text-muted)]">v1.0.0-FABRICA</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[var(--bg-main)]">
        <div className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto">
          {activeTab === AppTab.DASHBOARD && (
            <Dashboard
              leads={leads}
              rankingLeads={rankingLeads}
              totalLeadCount={totalLeadCount}
              profiles={profiles}
              userEmail={user?.email}
            />
          )}
          {activeTab === AppTab.LEADS && <LeadList leads={leads} />}
          {activeTab === AppTab.ENRICH && <Enricher onProcessed={addLeads} leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.CRM && <CRM leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.MURAL && <Mural profiles={profiles} />}
          {activeTab === AppTab.STRATEGY && <Strategy leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.ADMIN && user?.email === 'paulofernandoautomacao@gmail.com' && (
            <AdminDashboard adminEmail={user.email} adminId={user.id} />
          )}
        </div>
      </main>
      <TeamChat currentUser={user} profiles={profiles} />
      {isThemeSelectorOpen && user && (
        <ThemeSelector
          userId={user.id}
          currentTheme={userTheme}
          onClose={() => setIsThemeSelectorOpen(false)}
          onThemeSelect={(id) => setUserTheme(id)}
        />
      )}
      <Analytics />
    </div>
  );
};

export default App;
