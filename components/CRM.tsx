
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Lead } from '../types';
import { History } from 'lucide-react';
import { exportLeadsToCSV } from '../services/exportService';
import CRMFilters from './crm/CRMFilters';
import KanbanBoard from './crm/KanbanBoard';
import ListView from './crm/ListView';
import LeadEditDrawer from './crm/LeadEditDrawer';

interface CRMProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => Promise<void>;
    onDeleteLead: (leadId: string) => Promise<void>;
    isSaaSAdmin?: boolean;
}

const CRM: React.FC<CRMProps> = ({ leads, onUpdateLead, onDeleteLead, isSaaSAdmin }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedState, setSelectedState] = useState<string>('all');
    const [activeSubTab, setActiveSubTab] = useState<'ready' | 'contacted' | 'pending'>('ready');
    const [nicheFilters, setNicheFilters] = useState<string[]>(() => {
        const saved = localStorage.getItem('crm_niches');
        return saved ? JSON.parse(saved) : [];
    });
    const [newNiche, setNewNiche] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [editValues, setEditValues] = useState<any>({});

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const states = useMemo(() =>
        Array.from(new Set(leads.map(l => l.uf).filter(Boolean))).sort() as string[]
        , [leads]);

    const filteredLeads = useMemo(() => {
        return leads
            .filter(lead => {
                const searchLower = debouncedSearch.toLowerCase();
                const matchesSearch = !debouncedSearch ||
                    lead.razaoSocial.toLowerCase().includes(searchLower) ||
                    lead.cnpj.includes(debouncedSearch) ||
                    (lead.email && lead.email.toLowerCase().includes(searchLower));

                const matchesState = selectedState === 'all' || lead.uf === selectedState;

                const matchesNiche = nicheFilters.length === 0 || nicheFilters.some(n =>
                    (lead.atividadePrincipal && lead.atividadePrincipal.toLowerCase().includes(n.toLowerCase())) ||
                    (lead.razaoSocial && lead.razaoSocial.toLowerCase().includes(n.toLowerCase())) ||
                    (lead.niche && lead.niche.toLowerCase().includes(n.toLowerCase()))
                );

                const matchesTab = (lead.stage !== 'disqualified') && (activeSubTab === 'ready'
                    ? (lead.status === 'enriched' && !lead.contacted)
                    : activeSubTab === 'contacted'
                        ? (lead.status === 'enriched' && lead.contacted)
                        : (lead.status === 'pending' || lead.status === 'failed'));

                return matchesSearch && matchesState && matchesTab && matchesNiche;
            })
            .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
    }, [leads, debouncedSearch, selectedState, activeSubTab, nicheFilters]);

    // Pre-calculate counts for tabs to avoid multiple filters in JSX
    const counts = useMemo(() => ({
        ready: leads.filter(l => l.status === 'enriched' && !l.contacted && l.stage !== 'disqualified').length,
        contacted: leads.filter(l => l.status === 'enriched' && l.contacted && l.stage !== 'disqualified').length,
        pending: leads.filter(l => (l.status === 'pending' || l.status === 'failed') && l.stage !== 'disqualified').length
    }), [leads]);

    const addNiche = useCallback(() => {
        if (!newNiche.trim()) return;
        const final = Array.from(new Set([...nicheFilters, newNiche.trim().toLowerCase()]));
        setNicheFilters(final);
        localStorage.setItem('crm_niches', JSON.stringify(final));
        setNewNiche('');
    }, [newNiche, nicheFilters]);

    const removeNiche = useCallback((n: string) => {
        const updated = nicheFilters.filter(item => item !== n);
        setNicheFilters(updated);
        localStorage.setItem('crm_niches', JSON.stringify(updated));
    }, [nicheFilters]);

    const handleStartEdit = useCallback((lead: Lead) => {
        setEditingId(lead.id);
        setEditValues({ ...lead });
    }, []);

    const handleSave = useCallback(async (lead: Lead) => {
        await onUpdateLead({
            ...lead,
            ...editValues,
            contacted: true
        });
        setEditingId(null);
    }, [editValues, onUpdateLead]);

    const toggleContacted = useCallback(async (lead: Lead) => {
        await onUpdateLead({
            ...lead,
            contacted: !lead.contacted
        });
    }, [onUpdateLead]);

    const leadToEdit = useMemo(() =>
        leads.find(l => l.id === editingId) || null
        , [leads, editingId]);

    const handleExport = useCallback(() => {
        exportLeadsToCSV(filteredLeads);
    }, [filteredLeads]);

    return (
        <div className="space-y-6">
            <CRMFilters
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                selectedState={selectedState} setSelectedState={setSelectedState}
                states={states} newNiche={newNiche} setNewNiche={setNewNiche}
                addNiche={addNiche} isSaaSAdmin={isSaaSAdmin}
                onExport={handleExport}
                showFilters={showFilters} setShowFilters={setShowFilters}
                viewMode={viewMode} setViewMode={setViewMode}
            />

            {nicheFilters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {nicheFilters.map(n => (
                        <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100">
                            {n}
                            <button onClick={() => removeNiche(n)} className="hover:text-red-500">×</button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                {[
                    { id: 'ready', label: 'A Contatar', count: counts.ready, color: 'blue' },
                    { id: 'contacted', label: 'Histórico', count: counts.contacted, color: 'emerald' },
                    { id: 'pending', label: 'Técnico', count: counts.pending, color: 'amber' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`px-6 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeSubTab === tab.id ? `border-${tab.color}-500 text-${tab.color}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab.id === 'contacted' && <History size={14} />}
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {viewMode === 'list' ? (
                <ListView
                    leads={filteredLeads}
                    onEditLead={handleStartEdit}
                    onToggleContacted={toggleContacted}
                />
            ) : (
                <KanbanBoard
                    leads={leads}
                    onEditLead={handleStartEdit}
                    onUpdateLead={onUpdateLead}
                />
            )}

            <LeadEditDrawer
                lead={leadToEdit}
                onClose={() => setEditingId(null)}
                editValues={editValues}
                setEditValues={setEditValues}
                handleSave={handleSave}
                onDeleteLead={onDeleteLead}
            />
        </div>
    );
};

export default React.memo(CRM);
