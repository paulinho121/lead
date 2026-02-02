
import React from 'react';
import { Lead } from '../../types';
import { Save, X, Globe, Instagram, Facebook, Search, Mail, Save as SaveIcon, Phone, MessageCircle, Calendar } from 'lucide-react';

interface LeadEditDrawerProps {
    lead: Lead | null;
    onClose: () => void;
    editValues: any;
    setEditValues: (v: any) => void;
    handleSave: (lead: Lead) => Promise<void>;
}

const RESPONSE_OPTIONS = [
    'Interessado - Agendar Reunião',
    'Interessado - Enviar Proposta',
    'Em Negociação',
    'Não tem interesse / Recusou',
    'Sem Orçamento no momento',
    'Não atende / Telefone Errado',
    'Deixei Recado / Retornar depois',
    'Outros'
];

const STAGE_OPTIONS = [
    { id: 'lead', label: 'Lead / Novo', color: 'blue' },
    { id: 'contacted', label: 'Em Contato', color: 'cyan' },
    { id: 'presentation', label: 'Apresentação', color: 'purple' },
    { id: 'negotiation', label: 'Negociação', color: 'amber' },
    { id: 'closed_won', label: 'Fechado (Ganho)', color: 'emerald' },
    { id: 'closed_lost', label: 'Arquivado (Perdido)', color: 'red' }
];

const LeadEditDrawer: React.FC<LeadEditDrawerProps> = ({ lead, onClose, editValues, setEditValues, handleSave }) => {
    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                <SaveIcon size={18} />
                            </div>
                            <h3 className="font-black text-xl text-slate-800">Gestão de Lead</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium truncate max-w-[250px]">{lead.razaoSocial}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { name: 'Google', icon: <Globe size={16} />, url: `https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial)}`, color: 'blue' },
                            { name: 'Instagram', icon: <Instagram size={16} />, url: `https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' instagram')}`, color: 'pink' },
                            { name: 'Facebook', icon: <Facebook size={16} />, url: `https://www.google.com/search?q=${encodeURIComponent(lead.razaoSocial + ' facebook')}`, color: 'indigo' },
                        ].map(item => (
                            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-${item.color}-50 hover:border-${item.color}-200 transition-all group`}>
                                <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-${item.color}-500 group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                            </a>
                        ))}
                        <button onClick={() => { navigator.clipboard.writeText(lead.cnpj); alert('CNPJ Copiado!'); }} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                                <Search size={16} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CNPJ</span>
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <a
                            href={`https://wa.me/${(editValues.telefone || lead.telefone)?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <MessageCircle size={18} /> WHATSAPP
                        </a>
                        <a
                            href={`tel:${(editValues.telefone || lead.telefone)?.replace(/\D/g, '')}`}
                            className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Phone size={18} /> LIGAR AGORA
                        </a>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <section>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Estágio do Funil</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-[var(--primary)] outline-none transition-all"
                                    value={editValues.stage || ''}
                                    onChange={e => setEditValues({ ...editValues, stage: e.target.value })}
                                >
                                    <option value="">Automático</option>
                                    {STAGE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                </select>
                            </section>
                            <section>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Próximo Contato</label>
                                <div className="relative group/input">
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        value={editValues.nextContactDate || ''}
                                        onChange={e => setEditValues({ ...editValues, nextContactDate: e.target.value })}
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                </div>
                            </section>
                        </div>

                        <section>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Status/Resposta</label>
                            <select
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none transition-all"
                                value={editValues.contactResponse || ''}
                                onChange={e => setEditValues({ ...editValues, contactResponse: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {RESPONSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </section>

                        {editValues.stage === 'closed_lost' && (
                            <section className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black uppercase text-red-500 mb-2 block px-1 tracking-widest">Motivo da Perda (Obrigatório)</label>
                                <select
                                    className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-sm font-bold focus:border-red-500 outline-none transition-all"
                                    value={editValues.lostReason || ''}
                                    onChange={e => setEditValues({ ...editValues, lostReason: e.target.value })}
                                >
                                    <option value="">Selecione o motivo...</option>
                                    <option value="Preço / Orçamento Alto">Preço / Orçamento Alto</option>
                                    <option value="Sem Perfil / CNAE Errado">Sem Perfil / CNAE Errado</option>
                                    <option value="Fechou com Concorrência">Fechou com Concorrência</option>
                                    <option value="Não conseguimos contato">Não conseguimos contato</option>
                                    <option value="Já possui solução similar">Já possui solução similar</option>
                                    <option value="Telefone / Email Inválido">Telefone / Email Inválido</option>
                                    <option value="Outros / Não informado">Outros / Não informado</option>
                                </select>
                            </section>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <section>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Telefone de Contato</label>
                                <div className="relative group/input">
                                    <input
                                        type="text"
                                        className="w-full p-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-[var(--primary)] outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                        value={editValues.telefone || ''}
                                        onChange={e => setEditValues({ ...editValues, telefone: e.target.value })}
                                    />
                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[var(--primary)] transition-colors" size={18} />
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">E-mail de Contato</label>
                                <div className="relative group/input">
                                    <input
                                        type="email"
                                        className="w-full p-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-[var(--primary)] outline-none transition-all"
                                        placeholder="exemplo@empresa.com.br"
                                        value={editValues.email || ''}
                                        onChange={e => setEditValues({ ...editValues, email: e.target.value })}
                                    />
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[var(--primary)] transition-colors" size={18} />
                                </div>
                            </section>
                        </div>

                        <label className="flex items-center gap-2 mt-1 cursor-pointer group px-1">
                            <input type="checkbox" checked={editValues.emailNotFound} onChange={e => setEditValues({ ...editValues, emailNotFound: e.target.checked })} className="w-4 h-4 rounded text-[var(--primary)]" />
                            <span className="text-xs font-bold text-slate-500 group-hover:text-[var(--primary)] transition-colors">Marcar e-mail como não encontrado</span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <section>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Instagram</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-pink-500 outline-none transition-all"
                                    placeholder="@usuario"
                                    value={editValues.instagram || ''}
                                    onChange={e => setEditValues({ ...editValues, instagram: e.target.value })}
                                />
                            </section>
                            <section>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Facebook</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                                    placeholder="perfil"
                                    value={editValues.facebook || ''}
                                    onChange={e => setEditValues({ ...editValues, facebook: e.target.value })}
                                />
                            </section>
                        </div>

                        <section>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block px-1 tracking-widest">Observações</label>
                            <textarea
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold min-h-[120px] focus:border-amber-500 outline-none transition-all resize-none"
                                value={editValues.observations || ''}
                                onChange={e => setEditValues({ ...editValues, observations: e.target.value })}
                            />
                        </section>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => handleSave(lead)}
                        className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <SaveIcon size={20} />
                        SALVAR E FINALIZAR GESTÃO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadEditDrawer;
