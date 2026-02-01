
import React, { useMemo } from 'react';
import { Lead } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, XCircle, Clock, TrendingUp, Download, UserCheck, Users } from 'lucide-react';
import { exportLeadsToCSV } from '../services/exportService';

interface DashboardProps {
  leads: Lead[];
  totalLeadCount?: number;
  profiles?: any[];
  userEmail?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ leads, totalLeadCount, profiles = [], userEmail }) => {
  const isCearaFan = userEmail === 'paulofernandoautomacao@gmail.com';
  const stats = useMemo(() => {
    const total = totalLeadCount || leads.length;
    const enriched = leads.filter(l => l.status === 'enriched').length;
    const pending = leads.filter(l => l.status === 'pending' || l.status === 'processing').length;
    const failed = leads.filter(l => l.status === 'failed').length;
    const hasContact = leads.filter(l => l.email || l.telefone).length;

    const statusData = [
      { name: 'Enriquecidos', value: enriched, color: '#00A38E' },
      { name: 'Falhas', value: failed, color: '#ef4444' },
      { name: 'Pendentes', value: pending, color: '#f59e0b' },
    ];

    const stateData = leads.reduce((acc: any[], lead) => {
      if (!lead.uf) return acc;
      const existing = acc.find(a => a.name === lead.uf);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: lead.uf, value: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value).slice(0, 5);

    // Salesperson performance calculation
    const salespersonData = leads.reduce((acc: any[], lead) => {
      if (!lead.userId) return acc;
      const existing = acc.find(a => a.userId === lead.userId);
      if (existing) {
        existing.total += 1;
        if (lead.contacted) existing.contacted += 1;
        if (lead.email) existing.enriched += 1;
      } else {
        const profile = profiles.find(p => p.id === lead.userId);
        acc.push({
          userId: lead.userId,
          name: profile?.fullname || profile?.email?.split('@')[0] || 'Desconhecido',
          email: profile?.email || 'N/A',
          total: 1,
          contacted: lead.contacted ? 1 : 0,
          enriched: lead.email ? 1 : 0
        });
      }
      return acc;
    }, []).sort((a, b) => b.total - a.total);

    return { total, enriched, pending, failed, hasContact, statusData, stateData, salespersonData };
  }, [leads, totalLeadCount, profiles]);

  const { total, enriched, hasContact, statusData, stateData, salespersonData } = stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
        <div className="relative">
          {isCearaFan && (
            <div className="absolute -left-12 -top-12 sm:-left-20 sm:-top-16 pointer-events-none select-none animate-ceara-float z-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Cear%C3%A1_Sporting_Club_logo.png/410px-Cear%C3%A1_Sporting_Club_logo.png"
                className="w-24 sm:w-32 opacity-30 drop-shadow-2xl"
                alt="Ceará SC"
              />
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight relative z-10">Visão Geral</h2>
          <p className="text-slate-500 text-sm mt-1 relative z-10">Saúde e progresso da sua base de dados.</p>
        </div>
        <button
          onClick={() => exportLeadsToCSV(leads)}
          disabled={leads.length === 0}
          className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50 text-xs font-black shadow-sm"
        >
          <Download size={16} />
          EXPORTAR BASE
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Leads" value={total} icon={<TrendingUp className="text-blue-500" />} />
        <StatCard title="Enriquecidos" value={enriched} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="Contatos Obtidos" value={hasContact} icon={<Clock className="text-amber-500" />} />
        <StatCard title="Taxa de Sucesso" value={total > 0 ? `${Math.round((enriched / total) * 100)}%` : '0%'} icon={<TrendingUp className="text-indigo-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6">Status da Operação</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6">Desempenho por Vendedor</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {salespersonData.length > 0 ? (
              salespersonData.map((seller) => (
                <div key={seller.userId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[var(--primary)]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-[var(--primary)] font-black">
                      {seller.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{seller.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{seller.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Leads</p>
                      <p className="text-sm font-black text-slate-800">{seller.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Gestão</p>
                      <p className="text-sm font-black text-emerald-600">{seller.contacted}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Users size={40} className="text-slate-200 mb-2" />
                <p className="text-xs font-bold text-slate-400">Nenhum vendedor com leads</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-6">Distribuição Regional (Top 5)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stateData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = React.memo(({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
    <div className="p-3 md:p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

export default React.memo(Dashboard);
