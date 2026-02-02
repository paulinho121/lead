
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
import { Download, RefreshCw, Sparkles, Loader2, Users, Globe, Palette, Sun, Moon, Menu, X, Shield, Video } from 'lucide-react';
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
import MeetingRoom from './components/MeetingRoom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { useAuth } from './hooks/useAuth';


const App: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
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
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 100;
  const [dashboardData, setDashboardData] = useState<{ stateStats: any[], salespersonStats: any[] }>({ stateStats: [], salespersonStats: [] });

  useEffect(() => {
    const activeTheme = (THEMES as any)[userTheme] || THEMES.default;
    document.documentElement.style.setProperty('--primary', activeTheme.primary);
    document.documentElement.style.setProperty('--primary-hover', activeTheme.hover);
    document.documentElement.style.setProperty('--accent', activeTheme.primary);

    const textOnPrimary = activeTheme.id === 'brasil' ? '#0f172a' : '#ffffff';
    document.documentElement.style.setProperty('--text-on-primary', textOnPrimary);

    localStorage.setItem('user-manto-theme', userTheme);
  }, [userTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [totalLeadCount, setTotalLeadCount] = useState(0);
  const [leadStats, setLeadStats] = useState<{ enriched: number, pending: number, failed: number, hasContact: number } | undefined>(undefined);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      leadService.syncProfile(user.id, user.email!, user.user_metadata?.fullname);
      loadLeads(user);
      loadStats();
      loadAvailableStates();
      loadProfiles(user);
      loadRanking();
      loadDashboardData();
    } else if (!isAuthenticated) {
      setLeads([]);
      setProfiles([]);
      setRankingLeads([]);
    }
  }, [isAuthenticated, user]);

  // Heartbeat for online status
  useEffect(() => {
    if (user) {
      leadService.updateHeartbeat(user.id);
      const interval = setInterval(() => {
        leadService.updateHeartbeat(user.id);
      }, 30000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
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
      setLeadStats(stats);
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

  const loadDashboardData = async () => {
    try {
      const data = await leadService.getDashboardData();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadLeads = async (currentUser?: any, page: number = 0) => {
    if (page === 0) setIsLoading(true);
    try {
      const activeUser = currentUser || user;
      const data = await leadService.getAllLeads(isAdmin ? undefined : activeUser?.id, page, PAGE_SIZE);

      if (page === 0) {
        setLeads(data);
      } else {
        setLeads(prev => [...prev, ...data]);
      }

      setCurrentPage(page);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreLeads = () => {
    if (!isLoading && hasMore) {
      loadLeads(user, currentPage + 1);
    }
  };

  const processQueue = async () => {
    setStatusMessage('Buscando leads...');
    setIsEnriching(true);

    try {
      // 1. Busca leads que precisam de atenção diretamente no banco
      const { data: remoteLeads, error } = await supabase
        .from('leads')
        .select('*')
        .or('status.eq.pending,status.eq.processing,status.eq.failed,and(status.eq.enriched,email.is.null)')
        .neq('email_not_found', true) // Pega quem é null ou false (não tentado ou sucesso anterior)
        .limit(100);

      if (error) throw error;

      const pendingLeads = (remoteLeads || []).map(leadService.mapFromDb);

      if (pendingLeads.length === 0) {
        alert("Nenhum lead disponível para enriquecimento no momento.");
        setIsEnriching(false);
        return;
      }

      if (!confirm(`Deseja iniciar o enriquecimento de ${pendingLeads.length} leads localizados na base de dados?`)) {
        setIsEnriching(false);
        return;
      }

      await backgroundEnricher.processLeads(
        pendingLeads,
        (updated) => {
          updateLead(updated);
          loadStats(); // Re-fetch stats to update counters in real-time
        },
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
      // Atualiza localmente
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));

      // Sincroniza com banco - Preserva o userId original se existir (para não desatribuir leads de outros ou do admin)
      const leadToSave = {
        ...updatedLead,
        userId: updatedLead.userId === undefined ? (isAdmin ? null : user.id) : updatedLead.userId
      };

      await leadService.upsertLeads([leadToSave]);
      loadStats();
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
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
      alert(`⚠️ Bloqueio de Segurança: Você possui ${unmanagedLeads.length} leads no seu CRM que ainda não foram totalmente geridos.`);
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
        alert(`Não há leads disponíveis ${uf ? `para o estado ${uf} ` : ''}na fila central.`);
      }
    } catch (error) {
      alert(`Erro ao solicitar leads: ${error?.message || 'Serviço indisponível'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return authView === 'login'
      ? <Login onLogin={() => { }} onGoToRegister={() => setAuthView('register')} />
      : <Register onRegister={() => setAuthView('login')} onBackToLogin={() => setAuthView('login')} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--bg-main)] transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        userTheme={userTheme}
        availableStates={availableStates}
        selectedRequestUF={selectedRequestUF}
        setSelectedRequestUF={setSelectedRequestUF}
        handleRequestLeads={handleRequestLeads}
        processQueue={processQueue}
        isEnriching={isEnriching}
        leads={leads}
        isLoading={isLoading}
        statusMessage={statusMessage}
        handleLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-main)]">
        <TopBar
          activeTab={activeTab}
          user={user}
          leads={leads}
          isEnriching={isEnriching}
          processQueue={processQueue}
          theme={theme}
          toggleTheme={toggleTheme}
          setIsThemeSelectorOpen={setIsThemeSelectorOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className="flex-1 overflow-auto p-responsive md:p-10 lg:p-12">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === AppTab.DASHBOARD && (
              <Dashboard
                leads={leads}
                rankingLeads={rankingLeads}
                totalLeadCount={totalLeadCount}
                profiles={profiles}
                userEmail={user?.email}
                loading={isLoading}
                externalStateData={dashboardData.stateStats}
                externalSalespersonData={dashboardData.salespersonStats}
                isAdmin={isAdmin}
                globalStats={leadStats}
              />
            )}
            {activeTab === AppTab.LEADS && (
              <LeadList
                leads={leads}
                loading={isLoading}
                hasMore={hasMore}
                onLoadMore={loadMoreLeads}
              />
            )}
            {activeTab === AppTab.ENRICH && <Enricher onProcessed={addLeads} leads={leads} onUpdateLead={updateLead} />}
            {activeTab === AppTab.CRM && <CRM leads={leads} onUpdateLead={updateLead} />}
            {activeTab === AppTab.MURAL && <Mural profiles={profiles} />}
            {activeTab === AppTab.STRATEGY && <Strategy leads={leads} onUpdateLead={updateLead} />}
            {activeTab === AppTab.ADMIN && isAdmin && (
              <AdminDashboard adminEmail={user.email} adminId={user.id} />
            )}
            {activeTab === AppTab.REUNIAO && (
              <MeetingRoom userEmail={user?.email || ''} userName={user?.user_metadata?.fullname || 'Vendedor'} />
            )}
          </div>
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
