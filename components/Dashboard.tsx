
import React from 'react';
import { Lead } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, XCircle, Clock, TrendingUp, Download } from 'lucide-react';
import { exportLeadsToCSV } from '../services/exportService';

interface DashboardProps {
  leads: Lead[];
}

const Dashboard: React.FC<DashboardProps> = ({ leads }) => {
  const total = leads.length;
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500 mt-1">Estatísticas de enriquecimento e saúde da base de dados.</p>
        </div>
        <button
          onClick={() => exportLeadsToCSV(leads)}
          disabled={leads.length === 0}
          className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm font-semibold shadow-sm"
        >
          <Download size={18} />
          Exportar Base
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Leads" value={total} icon={<TrendingUp className="text-blue-500" />} />
        <StatCard title="Enriquecidos" value={enriched} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="Contatos Obtidos" value={hasContact} icon={<Clock className="text-amber-500" />} />
        <StatCard title="Taxa de Sucesso" value={total > 0 ? `${Math.round((enriched / total) * 100)}%` : '0%'} icon={<TrendingUp className="text-indigo-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart */}
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
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-slate-500 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Region Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-6">Top 5 Estados (Leads)</h3>
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
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
    </div>
    <div className="p-3 bg-slate-50 rounded-xl">
      {icon}
    </div>
  </div>
);

export default Dashboard;
