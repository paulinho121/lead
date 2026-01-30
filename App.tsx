
import React, { useState, useEffect } from 'react';
import { AppTab, Lead } from './types';
import { NAVIGATION, COLORS } from './constants';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import Enricher from './components/Enricher';
import Strategy from './components/Strategy';
import CRM from './components/CRM';
import { exportLeadsToCSV } from './services/exportService';
import { Download, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { leadService } from './services/dbService';
import { backgroundEnricher } from './services/backgroundEnricher';
import { Sun, Moon } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
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
    loadLeads();
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
    try {
      await leadService.upsertLeads(newLeads);
      await loadLeads();
    } catch (error) {
      alert("Erro ao salvar novos leads no banco de dados.");
    }
  };

  const updateLead = async (updatedLead: Lead) => {
    try {
      await leadService.upsertLeads([updatedLead]);
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 md:h-screen transition-colors">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm px-1">MCI</div>
            <h1 className="font-bold text-xl tracking-tight">LeadPro <span className="text-blue-600">B2B</span></h1>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enriquecimento</p>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAVIGATION.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AppTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm shadow-blue-100/50'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <span className={activeTab === item.id ? 'text-blue-600' : ''}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">Status da Base</div>
            <div className="text-sm font-medium text-slate-700">{leads.length} Leads Registrados</div>
            <button
              onClick={() => exportLeadsToCSV(leads)}
              disabled={leads.length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-slate-300"
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              onClick={processQueue}
              disabled={isEnriching || leads.filter(l => l.status === 'pending' || l.status === 'failed' || (l.status === 'enriched' && !l.email)).length === 0}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isEnriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Enriquecer Fila ({leads.filter(l => l.status === 'pending' || l.status === 'failed' || (l.status === 'enriched' && !l.email)).length})
            </button>
            {statusMessage && (
              <div className="mt-2 text-[10px] font-bold text-center text-emerald-600 bg-emerald-50 py-1 rounded-lg border border-emerald-100 animate-pulse">
                {statusMessage}
              </div>
            )}
            <button
              onClick={loadLeads}
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2 px-4 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Sincronizar
            </button>
            <button
              onClick={clearLeads}
              className="text-xs text-red-500 hover:text-red-700 font-medium mt-4 text-center"
            >
              Limpar Dados
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === AppTab.DASHBOARD && <Dashboard leads={leads} />}
          {activeTab === AppTab.LEADS && <LeadList leads={leads} />}
          {activeTab === AppTab.ENRICH && <Enricher onProcessed={addLeads} leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.CRM && <CRM leads={leads} onUpdateLead={updateLead} />}
          {activeTab === AppTab.STRATEGY && <Strategy leads={leads} />}
        </div>
      </main>
      <Analytics />
    </div>
  );
};

export default App;
