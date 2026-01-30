
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import { Mail, Send, Copy, Sparkles, CheckCircle2, AlertCircle, Trash2, ExternalLink, ChevronRight, Eye } from 'lucide-react';

interface StrategyProps {
  leads: Lead[];
}

const EMAIL_TEMPLATES = [
  {
    id: 'hook-problem',
    name: '🪝 Gancho de Dor (Conversão Alta)',
    subject: 'Pergunta sobre a {razao_social}',
    body: `Olá, tudo bem?

Estava analisando algumas empresas em {municipio} e notei que a {razao_social} [Inserir algo específico que você notou].

Trabalhamos ajudando empresas do setor [Setor] a resolver [Problema Comum]. Acredito que poderíamos ter uma sinergia interessante.

Você teria 5 minutos para um café virtual na próxima terça?

Att,
[Seu Nome]`,
    description: 'Ideal para o primeiro contato. Foca em um problema específico.'
  },
  {
    id: 'direct-value',
    name: '🚀 Proposta de Valor Direta',
    subject: 'Oportunidade para {razao_social}',
    body: `Olá time da {razao_social},

Vi que vocês estão sediados em {municipio} e gostaria de apresentar uma solução que tem ajudado nossos parceiros a reduzir [Custo/Tempo] em até [X]%.

Diferente de outras soluções, nós focamos em [Diferencial Único].

Podemos agendar uma breve call de 10 minutos para eu te mostrar como isso se aplica ao seu cenário?

Um abraço,
[Seu Nome]`,
    description: 'Vá direto ao ponto se o seu produto resolve um problema óbvio.'
  },
  {
    id: 'partnership',
    name: '🤝 Parceria Estratégica',
    subject: 'Parceria: [Sua Empresa] + {razao_social}',
    body: `Bom dia!

Meu nome é [Seu Nome] e acompanho o trabalho da {razao_social} há algum tempo.

Tenho um projeto que acredito complementar muito bem o que vocês já entregam em {uf}. Gostaria de validar se faz sentido pensarmos em algo juntos.

Consegue me dar um retorno sobre sua disponibilidade?

Obrigado!`,
    description: 'Abordagem mais suave, focada em networking e parcerias.'
  }
];

const Strategy: React.FC<StrategyProps> = ({ leads }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0]);
  const [customBody, setCustomBody] = useState(selectedTemplate.body);
  const [customSubject, setCustomSubject] = useState(selectedTemplate.subject);
  const [previewLeadIndex, setPreviewLeadIndex] = useState(0);

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
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Estratégia de Conversão</h2>
          <p className="text-slate-500 mt-1">Transforme leads enriquecidos em oportunidades de negócio.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex flex-col items-center">
            <span className="text-2xl font-black">{readyLeads.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Prontos para Envio</span>
          </div>
        </div>
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
          <div className="lg:col-span-7 space-y-6">
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
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedTemplate.id === template.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10'
                        : 'border-slate-100 hover:border-slate-200'
                      }`}
                  >
                    <div className="font-bold text-slate-800">{template.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{template.description}</div>
                  </button>
                ))}
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
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">{`{razao_social}`}</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">{`{municipio}`}</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">{`{uf}`}</span>
                </div>
              </div>
            </div>

            {/* Conversion Strategy Tips */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Copy size={120} />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={24} />
                Dicas do Estrategista B2B
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                <div>
                  <h4 className="font-bold text-white mb-2">A Regra dos 2 Segundos</h4>
                  <p>O assunto deve ser curto e despertar curiosidade genuína. Evite palavras como "Venda", "Oferta" ou "Oportunidade Única" que acionam filtros de spam.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Padrão de Variáveis</h4>
                  <p>Sempre use a Razão Social ou Nome Fantasia. Humanizar o e-mail aumenta a taxa de resposta em até 4x em comparação a e-mails genéricos.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Call to Action (CTA)</h4>
                  <p>Faça apenas uma pergunta clara no final. Ex: "Você teria 10 minutos?" em vez de pedir para ver um PDF, clicar em link e agendar call ao mesmo tempo.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Follow-up</h4>
                  <p>A maioria das vendas B2B acontece entre o 4º e o 7º contato. Não desista se não receber resposta no primeiro e-mail.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Send Area */}
          <div className="lg:col-span-5 space-y-6">
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
                    onClick={() => copyToClipboard(customBody)}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    <Copy size={16} /> Copiar Texto
                  </button>
                  <button
                    onClick={() => openMailClient(currentLead)}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Send size={16} /> Enviar Agora
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
