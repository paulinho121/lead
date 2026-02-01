
import React, { useMemo, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Lead } from '../../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
    leads: Lead[];
    onEditLead: (lead: Lead) => void;
    onUpdateLead: (lead: Lead) => Promise<void>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onEditLead, onUpdateLead }) => {

    const onDragEnd = useCallback(async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const lead = leads.find(l => l.id === draggableId);
        if (!lead) return;

        // Optimistic Update logic
        let updatedLead = {
            ...lead,
            stage: destination.droppableId as any,
            contacted: destination.droppableId !== 'lead'
        };

        // Logic to update status based on stage
        if (destination.droppableId === 'closed_won') {
            updatedLead.contactResponse = 'Interessado - Agendar Reunião';
        } else if (destination.droppableId === 'closed_lost') {
            updatedLead.contactResponse = 'Não tem interesse / Recusou';
        }

        await onUpdateLead(updatedLead);
    }, [leads, onUpdateLead]);

    const getLeadsByStage = (stage: string) => {
        return leads.filter(l => {
            if (stage === 'lead') return !l.stage || l.stage === 'lead';
            return l.stage === stage;
        });
    };

    const columns = [
        { id: 'lead', title: 'Lead / Novo', color: 'blue' },
        { id: 'contacted', title: 'Em Contato', color: 'cyan' },
        { id: 'presentation', title: 'Apresentação', color: 'purple' },
        { id: 'negotiation', title: 'Negociação', color: 'amber' },
        { id: 'closed_won', title: 'Ganhos', color: 'emerald' },
        { id: 'closed_lost', title: 'Perdidos', color: 'slate' },
    ];

    // Limit to prevent performance issues with DnD and hundreds of items
    // Only the first 100 in each column are draggable/visible in Kanban
    const limitLeads = (list: Lead[]) => list.slice(0, 100);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="w-full relative">
                <div className="flex gap-6 overflow-x-auto pb-12 pt-2 px-4 md:px-8 lg:px-12 custom-scrollbar min-h-[750px] -mx-4 md:-mx-8 lg:-mx-12">
                    {columns.map(col => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            leads={limitLeads(getLeadsByStage(col.id))}
                            color={col.color as any}
                            onEditLead={onEditLead}
                        />
                    ))}
                </div>
            </div>
            {(getLeadsByStage('lead').length > 100 || getLeadsByStage('contacted').length > 100) && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
                    * Exibindo apenas os 100 leads mais recentes por coluna no modo Kanban para performance. Use o modo lista para ver todos os {leads.length} leads.
                </p>
            )}
        </DragDropContext>
    );
};

export default React.memo(KanbanBoard);
