
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import { Mail, Send, Copy, Sparkles, CheckCircle2, AlertCircle, Trash2, ExternalLink, ChevronRight, Eye, MessageCircle, Linkedin, Wand2, Zap } from 'lucide-react';
import { generatePersonalizedScript } from '../services/geminiService';

interface StrategyProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => Promise<void>;
}

const EMAIL_TEMPLATES = [
  {
    id: 'hook-problem',
    name: '🪝 Gancho de Dor',
    badge: 'Foco em Problema',
    perf: '82%',
    subject: 'Pergunta sobre a {razao_social}',
    body: `Olá, tudo bem?

Estava analisando algumas empresas em {municipio} e notei que a {razao_social} [Inserir algo específico que você notou].

Trabalhamos ajudando empresas do setor [Setor] a resolver [Problema Comum]. Acredito que poderíamos ter uma sinergia interessante.

Você teria 5 minutos para um café virtual na próxima terça?

Att,
[Seu Nome]`,
    description: 'Ideal para o primeiro contato. Quebra o gelo com uma dor real.'
  },
  {
    id: 'direct-value',
    name: '🚀 Proposta de Valor',
    badge: 'Foco em ROI',
    perf: '74%',
    subject: 'Oportunidade para {razao_social}',
    body: `Olá time da {razao_social},

Vi que vocês estão sediados em {municipio} e gostaria de apresentar uma solução que tem ajudado nossos parceiros a reduzir [Custo/Tempo] em até [X]%.

Diferente de outras soluções, nós focamos em [Diferencial Único].

Podemos agendar uma breve call de 10 minutos para eu te mostrar como isso se aplica ao seu cenário?

Um abraço,
[Seu Nome]`,
    description: 'Vá direto ao ponto com números e benefícios claros.'
  },
  {
    id: 'partnership',
    name: '🤝 Parceria Estratégica',
    badge: 'Networking',
    perf: '68%',
    subject: 'Parceria: [Sua Empresa] + {razao_social}',
    body: `Bom dia!

Meu nome é [Seu Nome] e acompanho o trabalho da {razao_social} há algum tempo.

Tenho um projeto que acredito complementar muito bem o que vocês já entregam em {uf}. Gostaria de validar se faz sentido pensarmos em algo juntos.

Consegue me dar um retorno sobre sua disponibilidade?

Obrigado!`,
    description: 'Abordagem suave para parcerias de longo prazo.'
  }
];

const Strategy: React.FC<StrategyProps> = ({ leads, onUpdateLead }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0]);
  const [customBody, setCustomBody] = useState(selectedTemplate.body);
  const [customSubject, setCustomSubject] = useState(selectedTemplate.subject);
  const [previewLeadIndex, setPreviewLeadIndex] = useState(0);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isGenerating, setIsGenerating] = useState(false);

  const readyLeads = useMemo(() =>
    leads.filter(l => l.status === 'enriched' && l.email),
    [leads]);

  const currentLead = readyLeads[previewLeadIndex];

  const replaceVariables = (text: string, lead: Lead) => {
    if (!lead) return text;
    return text
      .replace(/{razao_social}/g, lead.razaoSocial || 'Sua Empresa')
      .replace(/{municipio}/g, lead.municipio || 'sua cidade')
      .replace(/{uf}/g, lead.uf || 'seu estado');
  };

  const handleTemplateChange = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setCustomBody(template.body);
    setCustomSubject(template.subject);
  };

  const copyToClipboard = (text: string) => {
    const finalBody = replaceVariables(text, currentLead);
    navigator.clipboard.writeText(finalBody);
    alert('Copiado para a área de transferência!');
  };

  const openMailClient = (lead: Lead) => {
    const subject = encodeURIComponent(replaceVariables(customSubject, lead));
    const body = encodeURIComponent(replaceVariables(customBody, lead));

    // Auto-update stage to contacted
    if (lead.stage === 'lead' || !lead.stage) {
      onUpdateLead({ ...lead, stage: 'contacted', contacted: true });
    }

    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
  };

  const openWhatsApp = (lead: Lead) => {
    const text = encodeURIComponent(replaceVariables(customBody, lead));

    // Auto-update stage to contacted
    if (lead.stage === 'lead' || !lead.stage) {
      onUpdateLead({ ...lead, stage: 'contacted', contacted: true });
    }

    window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, '')}?text=${text}`);
  };

  const handleAIPersonalize = async () => {
    if (!currentLead) return;
    setIsGenerating(true);
    try {
      const result = await generatePersonalizedScript(currentLead, customBody);
      setCustomBody(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Estratégia B2B</h2>
          <p className="text-slate-500 text-sm mt-1">Transforme leads em oportunidades reais.</p>
        </div>

        {readyLeads.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="md:hidden flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setMobileView('editor')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${mobileView === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Sparkles size={14} /> EDITOR
              </button>
              <button
                onClick={() => setMobileView('preview')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${mobileView === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Eye size={14} /> PREVIEW
              </button>
            </div>
            <div className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl flex flex-col items-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black leading-none">{readyLeads.length}</span>
              <span className="text-[8px] font-black uppercase tracking-wider opacity-80 mt-1">Leads</span>
            </div>
          </div>
        )}
      </header>

      {readyLeads.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-slate-300" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700">Sem leads qualificados no momento</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Você precisa primeiro enriquecer seus leads e garantir que eles tenham um e-mail válido para usar o compositor de estratégias.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Template Selector & Editor */}
          <div className={`lg:col-span-7 space-y-6 ${mobileView === 'preview' ? 'hidden md:block' : 'block'}`}>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={20} />
                Selecione seu Script de Vendas
              </h3>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {EMAIL_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateChange(template)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${selectedTemplate.id === template.id
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-800">{template.name}</div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${template.perf.startsWith('8') ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {template.perf} Conversão
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{template.description}</div>
                    {selectedTemplate.id === template.id && (
                      <div className="absolute bottom-0 right-0 p-1">
                        <CheckCircle2 size={12} className="text-blue-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleAIPersonalize}
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:grayscale"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Wand2 size={16} />
                  )}
                  PERSONALIZAR COM IA
                </button>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 rounded-2xl text-[10px] font-black uppercase">
                  <Zap size={10} /> Alta Conversão
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Assunto do E-mail</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Corpo da Mensagem (Suporta Variáveis)</label>
                  <textarea
                    rows={10}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-mono text-sm leading-relaxed"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">{`{razao_social}`}</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">{`{municipio}`}</span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">{`{uf}`}</span>
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-100">{`{vendedor_nome}`}</span>
                </div>
              </div>
            </div>

            {/* Conversion Strategy Tips */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Zap size={150} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 size={20} />
                  </span>
                  Checklist de Conversão Alta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <ChevronRight size={14} className="text-blue-400" /> Gatilho de Curiosidade
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">O assunto deve ser curto (máx 5 palavras). Assuntos que parecem e-mails internos têm 40% mais abertura.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <ChevronRight size={14} className="text-blue-400" /> A Regra do "Eu" v "Você"
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Use 3x mais a palavra "você/sua" do que "eu/nós". O lead só se importa com o problema dele.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <ChevronRight size={14} className="text-blue-400" /> CTA Único e Claro
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Termine com uma pergunta fechada. "Faz sentido?" ou "Consegue terça às 14h?".</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <ChevronRight size={14} className="text-blue-400" /> Multicanalidade
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Se enviar e-mail, mande um WhatsApp 10 min depois: "Oi, acabei de te mandar um e-mail sobre X".</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Send Area */}
          <div className={`lg:col-span-5 space-y-6 ${mobileView === 'editor' ? 'hidden md:block' : 'block'}`}>
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-8">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview de Conversão</span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {currentLead?.razaoSocial?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 line-clamp-1">{currentLead?.razaoSocial}</div>
                      <div className="text-xs text-slate-500">{currentLead?.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewLeadIndex(prev => Math.max(0, prev - 1))}
                      disabled={previewLeadIndex === 0}
                      className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"
                    >
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <button
                      onClick={() => setPreviewLeadIndex(prev => Math.min(readyLeads.length - 1, prev + 1))}
                      disabled={previewLeadIndex === readyLeads.length - 1}
                      className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assunto:</span>
                    <p className="text-sm font-bold text-slate-700 mt-1">
                      {replaceVariables(customSubject, currentLead)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mensagem:</span>
                    <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {replaceVariables(customBody, currentLead)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-6">
                  <button
                    onClick={() => openWhatsApp(currentLead)}
                    className="flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                  <button
                    onClick={() => openMailClient(currentLead)}
                    className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Mail size={18} /> E-mail
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Dica: Clique em "Enviar Agora" para abrir seu Outlook, Gmail ou Apple Mail padrão com tudo preenchido.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Strategy;
