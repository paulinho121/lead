
import React, { useState } from 'react';
import { Magnet, Search, Loader2, Sparkles, CheckCircle2, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { firecrawlService } from '../services/firecrawlService';
import { extractLeadsFromText } from '../services/geminiService';
import { Lead } from '../types';

interface AssociationScraperProps {
    onLeadsFound: (leads: Partial<Lead>[]) => void;
}

const AssociationScraper: React.FC<AssociationScraperProps> = ({ onLeadsFound }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');

    const handleCapture = async () => {
        if (!url) return;
        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            setStatus('Lendo conteúdo da página...');
            const markdown = await firecrawlService.scrapeUrl(url);

            if (!markdown) {
                throw new Error('Não foi possível ler o conteúdo desta URL. Verifique se o link está correto.');
            }

            setStatus('IA extraindo nomes de empresas...');
            const foundLeads = await extractLeadsFromText(markdown);

            if (!foundLeads || foundLeads.length === 0) {
                throw new Error('A IA não conseguiu identificar empresas nesta página. Tente uma URL mais específica.');
            }

            setResults(foundLeads);
            setStatus(`Sucesso! ${foundLeads.length} empresas encontradas.`);
        } catch (err: any) {
            setError(err.message || 'Erro ao capturar leads');
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    const importLeads = () => {
        const formattedLeads = results.map(r => ({
            razaoSocial: r.razaoSocial || r.name,
            website: r.website || r.url,
            status: 'pending' as const,
            source: `Web Capture: ${url}`,
            cnpj: 'Pendente' // We'll need background enricher to find this
        }));
        onLeadsFound(formattedLeads);
        setResults([]);
        setUrl('');
        setStatus('Leads enviados para a fila de enriquecimento!');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Capturador Web AI</h2>
                    <p className="text-[var(--text-muted)] text-sm mt-1 font-medium italic opacity-80">Extraia listas de empresas de associações, catálogos ou sites governamentais.</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-2xl border border-amber-500/20">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Powered by Firecrawl & Gemini</span>
                </div>
            </header>

            <div className="bg-[var(--bg-card)] rounded-[32px] p-8 shadow-xl border border-[var(--border)] glass-morphism space-y-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">URL da Associação ou Lista</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                            <input
                                type="url"
                                placeholder="https://exemplo.com.br/associados"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-2xl focus:outline-none focus:border-[var(--primary)] transition-all font-bold"
                            />
                        </div>
                        <button
                            onClick={handleCapture}
                            disabled={isLoading || !url}
                            className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 font-black uppercase text-xs tracking-widest shadow-lg shadow-[var(--primary)]/20"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Magnet size={18} />}
                            CAPTURAR
                        </button>
                    </div>
                    {status && (
                        <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold animate-pulse px-1">
                            <Loader2 size={14} className="animate-spin" />
                            {status}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-1">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {results.length > 0 && (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={18} />
                            Resultados Encontrados ({results.length})
                        </h3>
                        <button
                            onClick={importLeads}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                        >
                            ENVIAR PARA FILA DE ENRIQUECIMENTO
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex items-center justify-between group hover:border-[var(--primary)]/40 transition-all">
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800 dark:text-white text-xs truncate uppercase tracking-tight">{item.razaoSocial || item.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold truncate">{item.website || item.url || 'Site não informado'}</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <Plus size={14} className="text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && results.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Magnet size={40} />
                    </div>
                    <p className="font-black text-sm uppercase tracking-[4px]">Aguardando URL para mineração</p>
                    <p className="text-xs font-bold mt-2 italic max-w-xs">Insira o link de uma página que contenha nomes ou logos de empresas.</p>
                </div>
            )}
        </div>
    );
};

export default AssociationScraper;
