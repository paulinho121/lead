
import React from 'react';
import { Search, SlidersHorizontal, Download, Globe, Layout, List } from 'lucide-react';

interface CRMFiltersProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    selectedState: string;
    setSelectedState: (v: string) => void;
    states: string[];
    newNiche: string;
    setNewNiche: (v: string) => void;
    addNiche: () => void;
    isSaaSAdmin?: boolean;
    onExport: () => void;
    showFilters: boolean;
    setShowFilters: (v: boolean) => void;
    viewMode: 'list' | 'kanban';
    setViewMode: (v: 'list' | 'kanban') => void;
}

const CRMFilters: React.FC<CRMFiltersProps> = ({
    searchTerm, setSearchTerm, selectedState, setSelectedState, states,
    newNiche, setNewNiche, addNiche, isSaaSAdmin, onExport,
    showFilters, setShowFilters, viewMode, setViewMode
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tight">CRM de Leads</h2>
                    <p className="text-[var(--text-muted)] text-xs md:text-sm">Gerencie seus contatos e conversões.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white border border-[var(--border)] rounded-2xl p-1 shadow-sm">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-slate-50'}`}>
                            <List size={18} />
                        </button>
                        <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-slate-50'}`}>
                            <Layout size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`md:hidden p-3 rounded-2xl border transition-all ${showFilters ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--text-main)] border-[var(--border)]'}`}
                    >
                        <SlidersHorizontal size={20} />
                    </button>
                </div>
            </div>

            <div className={`flex flex-col gap-3 transition-all ${showFilters ? 'scale-y-100 opacity-100' : 'hidden md:flex md:flex-row md:items-center'}`}>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input
                        type="text"
                        placeholder="Empresa ou CNPJ..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Nicho..."
                            className="flex-1 sm:w-32 px-4 py-3 bg-white border border-[var(--border)] rounded-2xl outline-none text-sm"
                            value={newNiche}
                            onChange={(e) => setNewNiche(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                        />
                        <button onClick={addNiche} className="bg-[var(--primary)] text-white px-5 py-3 rounded-2xl text-xs font-black hover:bg-[var(--primary-hover)] transition-all">OK</button>
                    </div>

                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full sm:w-32 px-4 py-3 bg-white border border-[var(--border)] rounded-2xl outline-none text-sm font-bold h-fit cursor-pointer"
                    >
                        <option value="all">Filtro UF</option>
                        {states.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>

                    {isSaaSAdmin && (
                        <button onClick={onExport} className="w-full sm:w-auto py-3 px-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                            <Download size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CRMFilters;
