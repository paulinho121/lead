
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
        let updatedLead = { ...lead };

        const FINISHED_STATUSES = ['Não tem interesse / Recusou', 'Não atende / Telefone Errado', 'Interessado - Agendar Reunião'];

        if (destination.droppableId === 'ready') {
            updatedLead.contacted = false;
        } else if (destination.droppableId === 'contacted') {
            updatedLead.contacted = true;
            // Se veio de finalizados ou não tem status, coloca um status de negociação
            if (!updatedLead.contactResponse || FINISHED_STATUSES.includes(updatedLead.contactResponse)) {
                updatedLead.contactResponse = 'Em Negociação';
            }
        } else if (destination.droppableId === 'finished') {
            updatedLead.contacted = true;
            // Se não for um dos status de finalização, força um padrão positivo
            if (!FINISHED_STATUSES.includes(updatedLead.contactResponse || '')) {
                updatedLead.contactResponse = 'Interessado - Agendar Reunião';
            }
        }

        await onUpdateLead(updatedLead);
    }, [leads, onUpdateLead]);

    const readyLeads = useMemo(() =>
        leads.filter(l => l.status === 'enriched' && !l.contacted)
        , [leads]);

    const contactingLeads = useMemo(() =>
        leads.filter(l => l.status === 'enriched' && l.contacted && !['Não tem interesse / Recusou', 'Não atende / Telefone Errado', 'Interessado - Agendar Reunião'].includes(l.contactResponse || ''))
        , [leads]);

    const finishedLeads = useMemo(() =>
        leads.filter(l => l.status === 'enriched' && l.contacted && ['Não tem interesse / Recusou', 'Não atende / Telefone Errado', 'Interessado - Agendar Reunião'].includes(l.contactResponse || ''))
        , [leads]);

    // Limit to prevent performance issues with DnD and hundreds of items
    // Only the first 100 in each column are draggable/visible in Kanban
    const limitLeads = (list: Lead[]) => list.slice(0, 100);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="w-full relative">
                <div className="flex gap-6 overflow-x-auto pb-12 pt-2 px-4 md:px-8 lg:px-12 custom-scrollbar min-h-[750px] -mx-4 md:-mx-8 lg:-mx-12">
                    <KanbanColumn
                        id="ready"
                        title="A Contatar"
                        leads={limitLeads(readyLeads)}
                        color="blue"
                        onEditLead={onEditLead}
                    />
                    <KanbanColumn
                        id="contacted"
                        title="Em Negociação"
                        leads={limitLeads(contactingLeads)}
                        color="amber"
                        onEditLead={onEditLead}
                    />
                    <KanbanColumn
                        id="finished"
                        title="Finalizados"
                        leads={limitLeads(finishedLeads)}
                        color="emerald"
                        onEditLead={onEditLead}
                    />
                </div>
            </div>
            {(readyLeads.length > 100 || contactingLeads.length > 100 || finishedLeads.length > 100) && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
                    * Exibindo apenas os 100 leads mais recentes por coluna no modo Kanban para performance. Use o modo lista para ver todos os {leads.length} leads.
                </p>
            )}
        </DragDropContext>
    );
};

export default React.memo(KanbanBoard);
