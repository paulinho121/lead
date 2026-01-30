
import React, { useState, useRef } from 'react';
import { Lead } from '../types';
import { validateCNPJ, normalizeEmail, normalizePhone } from '../constants';
import { fetchCNPJData } from '../services/enrichmentService';
import { parseUnstructuredText } from '../services/geminiService';
import { exportLeadsToCSV } from '../services/exportService';
import { backgroundEnricher } from '../services/backgroundEnricher';
import { FileUp, Search, CheckCircle2, AlertTriangle, Loader2, Sparkles, Download } from 'lucide-react';

interface EnricherProps {
  onProcessed: (leads: Lead[]) => void;
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
}

const Enricher: React.FC<EnricherProps> = ({ onProcessed, leads, onUpdateLead }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [log, setLog] = useState<{ type: 'info' | 'error' | 'success', msg: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (type: 'info' | 'error' | 'success', msg: string) => {
    setLog(prev => [{ type, msg }, ...prev].slice(0, 50));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setLog([]);
    setStatusMessage('Lendo arquivo PDF...');
    addLog('info', `Iniciando processamento de ${file.name}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
        setProgress(Math.round((i / pdf.numPages) * 30)); // 30% for extraction
      }

      setStatusMessage('Analisando documento com IA...');
      addLog('info', 'Extraindo dados estruturados (CNPJ + Emails)...');

      // Always try Gemini for better extraction if text is available
      const parsedData = await parseUnstructuredText(fullText);

      if (parsedData.length > 0) {
        const extractedLeads: Lead[] = parsedData.map((item: any) => ({
          id: crypto.randomUUID(),
          cnpj: item.cnpj.replace(/[^\d]/g, ''),
          razaoSocial: item.razaoSocial || 'Extraído do PDF',
          email: item.email ? normalizeEmail(item.email) : undefined,
          telefone: item.telefone ? normalizePhone(item.telefone) : undefined,
          status: 'pending' as const,
          source: file.name,
          capturedAt: new Date().toISOString()
        }));

        onProcessed(extractedLeads);
        addLog('success', `${extractedLeads.length} leads identificados com dados de contato.`);
        processLeads(extractedLeads);
        return;
      }

      // Fallback to regex if Gemini fails
      const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14}/g;
      const foundCnpjs = Array.from(new Set(fullText.match(cnpjRegex) || []));

      if (foundCnpjs.length === 0) {
        throw new Error('Nenhum dado válido encontrado no documento.');
      }

      const backupLeads: Lead[] = foundCnpjs
        .filter(cnpj => validateCNPJ(cnpj))
        .map(cnpj => ({
          id: crypto.randomUUID(),
          cnpj: cnpj.replace(/[^\d]/g, ''),
          razaoSocial: 'Aguardando enriquecimento...',
          status: 'pending',
          source: file.name,
          capturedAt: new Date().toISOString(),
        }));

      onProcessed(backupLeads);
      processLeads(backupLeads);

    } catch (error: any) {
      addLog('error', `Falha: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const processLeads = async (leadsToProcess: Lead[]) => {
    setStatusMessage('Enriquecendo dados...');
    setIsProcessing(true);
    let completedCount = 0;

    await backgroundEnricher.processLeads(
      leadsToProcess,
      (updated) => {
        onUpdateLead(updated);
        completedCount++;
        setProgress(30 + Math.round((completedCount / leadsToProcess.length) * 70));
      },
      (type, msg) => {
        addLog(type, msg);
        if (type === 'info') setStatusMessage(msg);
      }
    );

    setStatusMessage('Processamento concluído!');
    setIsProcessing(false);
    addLog('success', 'Ciclo de enriquecimento finalizado.');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Enriquecimento de Leads</h2>
        <p className="text-slate-500 mt-1">Suba um PDF contendo listas de empresas ou notas fiscais.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-6">
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`
              relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
              ${isProcessing ? 'bg-slate-50 border-slate-200 pointer-events-none' : 'hover:border-blue-400 hover:bg-blue-50/30 border-slate-200'}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
            />

            <div className="flex flex-col items-center">
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300
                ${isProcessing ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'}
              `}>
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                ) : (
                  <FileUp className="w-10 h-10 text-slate-400 group-hover:text-blue-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {isProcessing ? 'Processando Documento...' : 'Upload de PDF Corporativo'}
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Arraste seu arquivo aqui ou clique para selecionar. Extrairemos CNPJs e enriqueceremos via BrasilAPI.
              </p>
            </div>

            {isProcessing && (
              <div className="mt-10 max-w-md mx-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-blue-600">{statusMessage}</span>
                  <span className="text-sm font-bold text-slate-400">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm">Tecnologia Inteligente</h4>
              <p className="text-xs text-blue-700 mt-1">
                Nosso motor utiliza Regex para dados estruturados e <strong>Gemini 2.0 Flash</strong> para interpretar listas bagunçadas ou sem formatação clara.
              </p>
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="bg-slate-900 rounded-3xl p-6 text-slate-300 shadow-xl flex flex-col h-[500px]">
          <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Terminal de Processamento</h4>
            </div>
            {leads.length > 0 && !isProcessing && (
              <button
                onClick={() => exportLeadsToCSV(leads)}
                className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                title="Exportar base completa"
              >
                <Download size={12} />
                EXPORTAR CSV
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto space-y-3 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
            {log.length === 0 && (
              <p className="text-slate-600 italic">Aguardando início do processo...</p>
            )}
            {log.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <span className={`
                  ${entry.type === 'error' ? 'text-red-400' : entry.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}
                `}>
                  {entry.type === 'error' ? '✖' : entry.type === 'success' ? '✔' : 'ℹ'} {entry.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enricher;
