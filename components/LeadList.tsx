

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
}

const LeadList: React.FC<LeadListProps> = ({ leads, loading, onLoadMore, hasMore }) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredLeads = leads.filter(l =>
    l.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cnpj.includes(searchTerm) ||
    (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.niche && l.niche.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.website && l.website.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.atividadePrincipal && l.atividadePrincipal.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportCSV = () => {
    exportLeadsToCSV(leads);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Base de Leads</h2>
          <p className="text-slate-500 mt-1">Gerencie e exporte os dados enriquecidos para suas campanhas.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={leads.length === 0}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
        >
          <Download size={18} />
          Exportar CSV (B2B)
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por Razão Social ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white flex items-center gap-2 text-sm">
              <Filter size={16} />
              Filtrar
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa / CNPJ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Localização</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Situação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 line-clamp-1">{lead.razaoSocial}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">{lead.cnpj}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{lead.email || '---'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{lead.telefone || '---'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{lead.municipio}/{lead.uf}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black ${lead.situacaoCadastral?.includes('BAIXADA') ? 'text-red-500' : 'text-emerald-500'}`}>
                      {lead.situacaoCadastral || 'ATIVA'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${lead.status === 'enriched' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right transform group-hover:scale-105 transition-transform">
                    <div className="flex justify-end gap-1">
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-600"><Search size={16} /></a>
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
