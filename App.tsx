
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { AppTab, Lead, Organization } from './types';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Enricher from './components/Enricher';
import Strategy from './components/Strategy';
import CRM from './components/CRM';
import { leadService } from './services/dbService';
import { backgroundEnricher } from './services/backgroundEnricher';
import { Analytics } from "@vercel/analytics/react"
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import { isLeadFullyManaged } from './hooks/useLeadManagement';
import Mural from './components/Mural';
import TeamChat from './components/TeamChat';
import ThemeSelector, { THEMES } from './components/ThemeSelector';
import MeetingRoom from './components/MeetingRoom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import AssociationScraper from './components/AssociationScraper';
import OrganizationSettings from './components/OrganizationSettings';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
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
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('user-manto-theme') || 'default';
      } catch (e) {
        console.warn("localStorage access denied", e);
        return 'default';
      }
    }
    return 'default';
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
    const initApp = async () => {
      if (isAuthenticated && user) {
        // 1. Sync and get LATEST profile from DB (crucial for organization_id)
        await leadService.syncProfile(user.id, user.email!, user.user_metadata?.fullname);

        // Fetch profiles to find the exact one for current user
        const allProfiles = await leadService.getAllProfiles();
        setProfiles(allProfiles); // <-- THIS WAS MISSING

        const myProfile = allProfiles.find(p => p.id === user.id);
        const orgId = myProfile?.organization_id;

        if (orgId) {
          loadLeads({ ...user, organization_id: orgId });
          loadStats(orgId);
          loadAvailableStates(orgId);
          loadRanking(orgId);
          loadDashboardData(orgId);
          loadOrganization(orgId);
          if (myProfile?.theme) setUserTheme(myProfile.theme);
        } else if (isAdmin) {
          // Se for admin mas não tiver org_id ainda (caso de migração)
          loadLeads(user);
        }
      } else if (!isAuthenticated) {
        setLeads([]);
        setProfiles([]);
        setRankingLeads([]);
      }
    };

    initApp();
  }, [isAuthenticated, user]);

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

  useEffect(() => {
    if (user && supabase) {
      const profileChannel = supabase
        .channel('profiles_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          loadProfiles();
        })
        .subscribe();

      const leadChannel = supabase
        .channel('leads_realtime_dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
          if (user.organization_id) {
            const orgId = user.organization_id;
            loadRanking(orgId);
            loadStats(orgId);
            loadDashboardData(orgId);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(leadChannel);
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

  const loadAvailableStates = async (orgId: string) => {
    try {
      const states = await leadService.getAvailableStates(orgId);
      setAvailableStates(states);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async (orgId: string) => {
    try {
      const stats = await leadService.getStats(orgId);
      setTotalLeadCount(stats.total);
      setLeadStats(stats);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  const loadRanking = async (orgId: string) => {
    try {
      const data = await leadService.getGlobalRanking(orgId);
      setRankingLeads(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDashboardData = async (orgId: string) => {
    try {
      const data = await leadService.getDashboardData(orgId);
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrganization = async (orgId: string) => {
    try {
      const data = await leadService.getOrganization(orgId);
      setOrganization(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadLeads = async (currentUser?: any, page: number = 0) => {
    if (page === 0) setIsLoading(true);
    try {
      const activeUser = currentUser || user;
      if (!activeUser?.organization_id && !isAdmin) {
        setIsLoading(false);
        return;
      }
      const orgId = activeUser.organization_id || "";
      const data = await leadService.getAllLeads(orgId, isAdmin ? undefined : activeUser?.id, page, PAGE_SIZE);

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
      if (!supabase || !user?.organization_id) {
        alert("Erro: Conexão ou perfil organizacional não detectado.");
        setIsEnriching(false);
        return;
      }

      const { data: remoteLeads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', user.organization_id)
        .or('status.eq.pending,status.eq.processing,status.eq.failed,and(status.eq.enriched,email.is.null)')
        .limit(100);

      if (error) throw error;

      const pendingLeads = (remoteLeads || []).map(leadService.mapFromDb);

      if (pendingLeads.length === 0) {
        alert("Nenhum lead disponível para enriquecimento.");
        setIsEnriching(false);
        return;
      }

      if (!confirm(`Deseja iniciar o enriquecimento de ${pendingLeads.length} leads?`)) {
        setIsEnriching(false);
        return;
      }

      await backgroundEnricher.processLeads(
        pendingLeads,
        (updated) => {
          updateLead(updated);
        },
        (type, msg) => {
          setStatusMessage(msg);
        },
        organization || undefined
      );

      setStatusMessage('Fila concluída!');
    } catch (error) {
      console.error("Erro na fila:", error);
      setStatusMessage('Erro no processo');
    } finally {
      setTimeout(() => {
        setIsEnriching(false);
        setStatusMessage('');
      }, 2000);
      if (user?.organization_id) {
        loadLeads(user);
        loadStats(user.organization_id);
      }
    }
  };

  const addLeads = async (newLeads: Lead[]) => {
    if (!user) return;
    try {
      const leadsWithUser = newLeads.map(l => ({
        ...l,
        userId: isAdmin ? null : user.id,
        organizationId: user.organization_id
      }));
      await leadService.upsertLeads(leadsWithUser);
      loadLeads(user);
      if (user.organization_id) loadStats(user.organization_id);
    } catch (error) {
      alert("Erro ao salvar novos leads.");
    }
  };

  const updateLead = async (updatedLead: Lead) => {
    if (!user) return;
    try {
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      const leadToSave = {
        ...updatedLead,
        userId: updatedLead.userId || user.id,
        organizationId: updatedLead.organizationId || user.organization_id
      };
      await leadService.upsertLeads([leadToSave]);
      if (user.organization_id) {
        loadStats(user.organization_id);
        loadRanking(user.organization_id);
      }
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!user) return;
    if (!confirm('Excluir este lead permanentemente?')) return;
    try {
      await leadService.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (user.organization_id) loadStats(user.organization_id);
    } catch (error) {
      alert("Erro ao excluir lead.");
    }
  };

  const handleLogout = async () => {
    if (user) await leadService.setOffline(user.id);
    if (supabase) await supabase.auth.signOut();
  };

  const handleRequestLeads = async (uf?: string) => {
    if (!user || !user.organization_id) return;
    setIsLoading(true);
    try {
      await leadService.requestNewLeads(user.id, uf);
      loadLeads(user);
      loadStats(user.organization_id);
    } catch (error) {
      alert(`Erro ao solicitar leads: ${error?.message}`);
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
                availableStates={availableStates}
                onDeleteLead={deleteLead}
              />
            )}
            {activeTab === AppTab.ENRICH && <Enricher onProcessed={addLeads} leads={leads} onUpdateLead={updateLead} />}
            {activeTab === AppTab.CRM && <CRM leads={leads} onUpdateLead={updateLead} onDeleteLead={deleteLead} />}
            {activeTab === AppTab.MURAL && <Mural profiles={profiles} />}
            {activeTab === AppTab.STRATEGY && <Strategy leads={leads} onUpdateLead={updateLead} profiles={profiles} />}
            {activeTab === AppTab.CAPTURE && (
              <AssociationScraper onLeadsFound={(found) => {
                addLeads(found as Lead[]);
                setActiveTab(AppTab.ENRICH);
              }} />
            )}
            {activeTab === AppTab.ADMIN && isAdmin && (
              <AdminDashboard adminEmail={user.email} adminId={user.id} />
            )}
            {activeTab === AppTab.REUNIAO && (
              <MeetingRoom userEmail={user?.email || ''} userName={user?.user_metadata?.fullname || 'Vendedor'} />
            )}
            {activeTab === AppTab.SETTINGS && (
              <OrganizationSettings
                organization={organization}
                onUpdate={(updated) => setOrganization(updated)}
              />
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
