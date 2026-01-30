
import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, Filter, Download, Mail, Phone, MapPin, ExternalLink, Instagram } from 'lucide-react';
import { exportLeadsToCSV } from '../services/exportService';

interface LeadListProps {
  leads: Lead[];
}

const LeadList: React.FC<LeadListProps> = ({ leads }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(l =>
    l.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cnpj.includes(searchTerm) ||
    (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.niche && l.niche.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

        <div className="overflow-x-auto">
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
            <tbody className="divide-y divide-slate-50">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-400 font-medium">Nenhum lead encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 line-clamp-1">{lead.razaoSocial}</span>
                        <span className="text-xs text-slate-400 font-mono mt-1">{lead.cnpj}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.email ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail size={12} className="text-blue-500" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Sem e-mail</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.telefone ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone size={12} className="text-emerald-500" />
                          <span>{lead.telefone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Sem telefone</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{lead.municipio || '---'}, {lead.uf || '--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.situacaoCadastral ? (
                        <span className={`text-xs font-bold ${lead.situacaoCadastral.includes('BAIXADA') ? 'text-red-500' : 'text-slate-600'}`}>
                          {lead.situacaoCadastral}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${lead.status === 'enriched' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : lead.status === 'failed' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}
                        `}>
                          {lead.status === 'enriched' ? 'Enriquecido' : lead.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </span>
                        {lead.contacted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                            Contactado
                          </span>
                        )}
                        {lead.situacaoCadastral?.includes('BAIXADA') && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                            Baixada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.instagram && (
                          <a
                            href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Ver Instagram"
                          >
                            <Instagram size={16} />
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver no Google"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadList;
