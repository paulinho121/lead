

import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, Filter, Download, Mail, Phone, MapPin, Instagram, Globe, Facebook } from 'lucide-react';
import { exportLeadsToCSV } from '../services/exportService';
import Skeleton from './Skeleton';


interface LeadListProps {
  leads: Lead[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  availableStates?: string[];
}

const LeadList: React.FC<LeadListProps> = ({ leads, loading, onLoadMore, hasMore, availableStates = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton width={300} height={32} />
            <Skeleton width={400} height={16} />
          </div>
          <Skeleton width={180} height={48} />
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30">
            <Skeleton height={40} />
          </div>
          <div className="p-6 space-y-4">
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </div>
        </div>
      </div>
    );
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.cnpj.includes(searchTerm) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.niche && l.niche.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.website && l.website.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.atividadePrincipal && l.atividadePrincipal.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesState = !selectedState || l.uf === selectedState;

    return matchesSearch && matchesState;
  });

  const exportCSV = () => {
    exportLeadsToCSV(leads);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Base de Leads</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1 font-medium italic opacity-80">Gerencie e exporte os dados enriquecidos para suas campanhas.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={leads.length === 0}
          className="bg-[var(--primary)] text-[var(--text-on-primary)] px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20"
        >
          <Download size={14} />
          Exportar CSV (B2B)
        </button>
      </header>

      <div className="bg-[var(--bg-card)] rounded-[32px] shadow-xl border border-[var(--border)] overflow-hidden glass-morphism">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-main)]/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por Razão Social ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all text-sm font-medium shadow-inner"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" size={14} />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl text-[var(--text-main)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 text-xs font-black uppercase appearance-none shadow-sm cursor-pointer"
              >
                <option value="">TODOS ESTADOS</option>
                {availableStates.length > 0 ? (
                  availableStates.map(uf => (
                    <option key={uf} value={uf}>{uf.toUpperCase()}</option>
                  ))
                ) : (
                  // Fallback se não vier via prop, tenta calcular dos leads atuais
                  Array.from(new Set(leads.map(l => l.uf).filter(Boolean))).sort().map(uf => (
                    <option key={uf} value={uf}>{uf.toUpperCase()}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-main)]/50 backdrop-blur-md sticky top-0 z-10 border-b border-[var(--border)]">
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Empresa / CNPJ</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">E-mail</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Telefone</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Localização</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Situação</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-[var(--primary)]/[0.02] transition-colors group border-b border-[var(--border)]/50 last:border-0">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-[var(--text-main)] text-sm uppercase tracking-tight line-clamp-1">{lead.razaoSocial}</span>
                      <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1 tracking-widest leading-none bg-[var(--bg-main)] px-2 py-1 rounded w-fit">{lead.cnpj}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-semibold text-[var(--text-main)] opacity-70">{lead.email || '---'}</td>
                  <td className="px-8 py-6 text-xs font-semibold text-[var(--text-main)] opacity-70">{lead.telefone || '---'}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] uppercase">
                      <MapPin size={12} className="opacity-50" />
                      {lead.municipio}/{lead.uf}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${lead.situacaoCadastral?.includes('BAIXADA') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {lead.situacaoCadastral || 'ATIVA'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${lead.status === 'enriched' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-slate-500/10 text-slate-500 border border-slate-500/10'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`}
                        target="_blank"
                        className="p-2.5 bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:scale-110 transition-all shadow-sm border border-[var(--border)]"
                        title="Pesquisar no Google"
                      >
                        <Search size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">Nenhum lead encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4">
              {filteredLeads.map(lead => (
                <div key={lead.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 hover-scale active:bg-slate-50 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${lead.status === 'enriched' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <h3 className="font-black text-slate-800 text-base truncate leading-tight uppercase tracking-tight">{lead.razaoSocial}</h3>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-4">{lead.cnpj}</p>
                    </div>
                    <span className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${lead.status === 'enriched' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                        <Mail size={14} className="text-blue-500" />
                      </div>
                      <span className="font-bold truncate">{lead.email || '---'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                          <Phone size={14} className="text-emerald-500" />
                        </div>
                        <span className="font-bold">{lead.telefone || '---'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                          <MapPin size={14} className="text-slate-400" />
                        </div>
                        <span className="font-bold">{lead.uf || '--'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Situação Tributária</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${lead.situacaoCadastral?.includes('BAIXADA') ? 'text-red-500' : 'text-emerald-600'}`}>
                        {lead.situacaoCadastral || 'ATIVA'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`}
                        target="_blank"
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 active:bg-blue-600 active:text-white transition-all shadow-sm"
                      >
                        <Search size={18} />
                      </a>
                      {lead.website && (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20"
                        >
                          <Globe size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasMore && (
          <div className="p-8 border-t border-slate-100 flex justify-center">
            <button
              onClick={onLoadMore}
              className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover-scale border border-slate-200"
            >
              Carregar mais leads
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadList;
