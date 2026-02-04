
import React, { useState } from 'react';
import { Magnet, Search, Loader2, Sparkles, CheckCircle2, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { firecrawlService } from '../services/firecrawlService';
import { extractLeadsFromText, identifyNicheFromContent } from '../services/geminiService';
import { Lead } from '../types';

interface AssociationScraperProps {
    onLeadsFound: (leads: Partial<Lead>[]) => void;
}

const AssociationScraper: React.FC<AssociationScraperProps> = ({ onLeadsFound }) => {
    const [webUrl, setWebUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [manualText, setManualText] = useState('');
    const [scrapedText, setScrapedText] = useState('');
    const [mode, setMode] = useState<'url' | 'manual' | 'instagram'>('url');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [customNiche, setCustomNiche] = useState('');
    const [keywords, setKeywords] = useState('');

    const handleCapture = async () => {
        const currentUrl = mode === 'url' ? webUrl : instagramUrl;
        if (!currentUrl && !manualText && mode !== 'instagram') return;
        if (mode === 'instagram' && !currentUrl) return;

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            let textToProcess = manualText;

            if (mode === 'url' && webUrl) {
                setStatus('Lendo conteúdo da página...');
                try {
                    const markdown = await firecrawlService.scrapeUrl(webUrl);
                    if (!markdown) throw new Error('Não foi possível ler a URL. Tente o modo manual.');
                    textToProcess = markdown;
                    setScrapedText(markdown);
                } catch (scrapeErr: any) {
                    const isLimit = scrapeErr.message?.includes('402') || scrapeErr.message?.includes('limit');
                    if (isLimit) {
                        setError('Limite do Firecrawl atingido. Mudando para modo manual...');
                        setMode('manual');
                        setIsLoading(false);
                        return;
                    }
                    throw scrapeErr;
                }
            }

            if (mode === 'instagram') {
                setStatus('Analisando perfil do Instagram...');
                // Try to scrape profile
                const profileMarkdown = await firecrawlService.scrapeUrl(instagramUrl);
                if (profileMarkdown) setScrapedText(profileMarkdown);

                setStatus('Identificando nicho e localidade...');
                const profileInfo = await identifyNicheFromContent(profileMarkdown || instagramUrl);

                // Use custom niche if provided, otherwise use AI detection
                const detectedNiche = (profileInfo as any)?.niche || instagramUrl.split('/').filter(Boolean).pop()?.replace(/[^a-zA-Z]/g, ' ') || 'Empresas similares';
                const niche = customNiche || detectedNiche;
                const location = (profileInfo as any)?.location || '';

                setStatus(`Buscando leads no nicho: ${niche}${location ? ` em ${location}` : ''}...`);
                const searchQuery = `${keywords ? `${keywords} ` : ''}${niche}${location ? ` em ${location}` : ''}`;
                const searchResults = await firecrawlService.searchByNiche(searchQuery);

                if (searchResults.length === 0) {
                    throw new Error('Não encontramos leads similares para este nicho no momento.');
                }

                setStatus('IA formatando leads encontrados...');
                const extracted = await extractLeadsFromText(JSON.stringify(searchResults));
                setResults(extracted);
                setStatus(`Sucesso! ${extracted.length} leads relacionados ao perfil encontrados.`);
                setIsLoading(false);
                return;
            }

            setStatus('IA extraindo nomes de empresas...');
            const foundLeads = await extractLeadsFromText(textToProcess);

            if (!foundLeads || foundLeads.length === 0) {
                throw new Error('A IA não conseguiu identificar empresas. Tente copiar e colar o texto manualmente.');
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
        const currentUrl = mode === 'url' ? webUrl : instagramUrl;
        const formattedLeads = results.map(r => ({
            razaoSocial: r.razaoSocial || r.name,
            website: r.website || r.url,
            status: 'pending' as const,
            source: mode === 'instagram' ? `Instagram Discovery: ${instagramUrl}` : `Web Capture: ${webUrl}`,
            cnpj: 'Pendente' // We'll need background enricher to find this
        }));
        onLeadsFound(formattedLeads);
        setResults([]);
        if (mode === 'url') setWebUrl('');
        else setInstagramUrl('');
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
                <div className="flex flex-wrap justify-center gap-4 mb-2">
                    <button
                        onClick={() => setMode('url')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'url' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        Captura via URL
                    </button>
                    <button
                        onClick={() => setMode('instagram')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'instagram' ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        Instagram Discovery
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        Captura Manual (Texto)
                    </button>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {mode === 'url' ? (
                        <>
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">URL da Associação ou Lista</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                    <input
                                        type="url"
                                        placeholder="https://exemplo.com.br/associados"
                                        value={webUrl}
                                        onChange={(e) => setWebUrl(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-2xl focus:outline-none focus:border-[var(--primary)] transition-all font-bold"
                                    />
                                </div>
                                <button
                                    onClick={handleCapture}
                                    disabled={isLoading || !webUrl}
                                    className="bg-[var(--primary)] text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 font-black uppercase text-xs tracking-widest shadow-lg shadow-[var(--primary)]/20"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Magnet size={18} />}
                                    CAPTURAR
                                </button>
                            </div>
                        </>
                    ) : mode === 'instagram' ? (
                        <>
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Link do Perfil do Instagram (Ex: Restaurante)</label>
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500">
                                        <Sparkles size={20} />
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://instagram.com/perfil_exemplo"
                                        value={instagramUrl}
                                        onChange={(e) => setInstagramUrl(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-2xl focus:outline-none focus:border-pink-500 transition-all font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Refinar Nicho (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Aluguel de Câmeras"
                                            value={customNiche}
                                            onChange={(e) => setCustomNiche(e.target.value)}
                                            className="w-full px-4 py-3 bg-[var(--bg-main)]/30 border border-[var(--border)] rounded-xl focus:outline-none focus:border-pink-500/50 transition-all text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Palavras-Chave (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: São Paulo, Cinema, Estúdio"
                                            value={keywords}
                                            onChange={(e) => setKeywords(e.target.value)}
                                            className="w-full px-4 py-3 bg-[var(--bg-main)]/30 border border-[var(--border)] rounded-xl focus:outline-none focus:border-pink-500/50 transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCapture}
                                    disabled={isLoading || !instagramUrl}
                                    className="w-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 font-black uppercase text-xs tracking-widest shadow-lg"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    DESCOBRIR LEADS
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic text-center">Nossa IA analisará o perfil e usará seus filtros para buscar empresas similares em todo o Brasil.</p>
                        </>
                    ) : (
                        <>
                            <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Cole o conteúdo da página aqui</label>
                            <div className="space-y-4">
                                <textarea
                                    placeholder="Copie e cole os nomes das empresas, links ou qualquer texto da página da associação..."
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    rows={6}
                                    className="w-full p-6 bg-[var(--bg-main)]/50 border-2 border-[var(--border)] rounded-2xl focus:outline-none focus:border-[var(--primary)] transition-all font-medium text-sm resize-none"
                                />
                                <button
                                    onClick={handleCapture}
                                    disabled={isLoading || !manualText}
                                    className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 font-black uppercase text-xs tracking-widest shadow-lg shadow-[var(--primary)]/20"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    EXTRAIR LEADS COM IA
                                </button>
                            </div>
                        </>
                    )}

                    {status && (
                        <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold animate-pulse px-1">
                            <Loader2 size={14} className="animate-spin" />
                            {status}
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-red-600">
                                <AlertCircle size={20} />
                                <p className="text-sm font-bold">{error}</p>
                            </div>

                            {scrapedText && (
                                <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Conteúdo capturado da página</span>
                                        <button
                                            onClick={() => {
                                                setManualText(scrapedText);
                                                setMode('manual');
                                                setError('');
                                                setScrapedText('');
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all uppercase tracking-tighter"
                                        >
                                            <ArrowRight size={14} /> Usar no Modo Manual
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                        {scrapedText.substring(0, 500)}...
                                    </div>
                                </div>
                            )}
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
