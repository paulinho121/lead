
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
import { Download, RefreshCw, Sparkles, Loader2, Users } from 'lucide-react';
import { leadService } from './services/dbService';
import { backgroundEnricher } from './services/backgroundEnricher';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';

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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    // Check current session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      if (session) loadLeads();
    });

    // Listen to changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      if (session) loadLeads();
      else setLeads([]);
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getAllLeads();
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
    }
  };

  const addLeads = async (newLeads: Lead[]) => {
    if (!user) return;
    try {
      const leadsWithUser = newLeads.map(l => ({ ...l, userId: user.id }));
      await leadService.upsertLeads(leadsWithUser);
      await loadLeads();
    } catch (error) {
      alert("Erro ao salvar novos leads no banco de dados.");
    }
  };

  const updateLead = async (updatedLead: Lead) => {
    if (!user) return;
    try {
      const leadWithUser = { ...updatedLead, userId: user.id };
      await leadService.upsertLeads([leadWithUser]);
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? leadWithUser : l));
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
    }
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  const handleRequestLeads = async () => {
    if (!user) return;
    const remaining = leads.filter(l => !l.contacted).length;
    if (remaining > 0) {
      alert(`Você ainda tem ${remaining} leads pendentes. Conclua-os antes de pedir mais!`);
      return;
    }

    setIsLoading(true);
    try {
      await leadService.requestNewLeads(user.id);
      await loadLeads();
      alert("Sucesso! 20 novos leads foram atribuídos a você.");
    } catch (error) {
      alert("Não há mais leads disponíveis na fila central no momento.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearLeads = async () => {
    if (window.confirm("Deseja realmente limpar toda a base de leads no banco de dados?")) {
      try {
        await leadService.clearAllLeads();
        setLeads([]);
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
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-bold text-xs">MCI</div>
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
            <div className="w-10 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-bold text-sm px-1 shadow-lg shadow-[var(--primary)]/20">MCI</div>
            <h1 className="font-bold text-xl tracking-tight text-[var(--text-main)]">LeadPro <span className="text-[var(--primary)]">B2B</span></h1>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Inteligência de Vendas</p>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-muted)] transition-colors"
              title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAVIGATION.filter(item => {
            const isAdmin = user?.email === 'paulofernandoautomacao@gmail.com';
            // Salespeople only see Dashboard and CRM
            if (!isAdmin) {
              return item.id === 'dashboard' || item.id === 'crm';
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
            <div className="text-[10px] uppercase font-black text-[var(--primary)] tracking-widest px-2">Ações do Sistema</div>

            {/* Admin Specific Actions */}
            {user?.email === 'paulofernandoautomacao@gmail.com' && (
              <>
                <button
                  onClick={() => exportLeadsToCSV(leads)}
                  disabled={leads.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-[var(--text-main)] py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
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
              <>
                <button
                  onClick={() => { handleRequestLeads(); setIsMobileMenuOpen(false); }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-3 px-4 rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                  SOLICITAR +20 LEADS
                </button>
                <button
                  onClick={processQueue}
                  disabled={isEnriching || leads.filter(l => (l.status === 'pending' || (l.status === 'enriched' && !l.email))).length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  ENRIQUECER MEUS LEADS
                </button>
              </>
            )}

            {statusMessage && (
              <div className="text-[10px] font-bold text-center text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100 animate-pulse">
                {statusMessage}
              </div>
            )}

            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="w-full mt-2 text-[10px] font-black text-[var(--text-main)] opacity-60 hover:opacity-100 hover:text-red-500 uppercase tracking-widest transition-all py-2"
            >
              Sair da Conta (Logout)
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[var(--bg-main)]">
        <div className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto">
          {activeTab === AppTab.DASHBOARD && <Dashboard leads={leads} />}
          {activeTab === AppTab.LEADS && <LeadList leads={leads} />}
          {activeTab === AppTab.ENRICH && <Enricher onProcessed={addLeads} leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.CRM && <CRM leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.STRATEGY && <Strategy leads={leads} />}
          {activeTab === AppTab.ADMIN && user?.email === 'paulofernandoautomacao@gmail.com' && (
            <AdminDashboard adminEmail={user.email} />
          )}
        </div>
      </main>
      <Analytics />
    </div>
  );
};

export default App;
