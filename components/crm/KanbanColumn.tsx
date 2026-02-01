
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Lead } from '../../types';
import KanbanCard from './KanbanCard';
import { Circle } from 'lucide-react';

interface KanbanColumnProps {
    id: string;
    title: string;
    leads: Lead[];
    color: string;
    onEditLead: (lead: Lead) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, leads, color, onEditLead }) => {
    return (
        <div className="flex-shrink-0 w-[300px] sm:w-80 md:w-96 flex flex-col gap-4">
            {/* Column Header */}
            <div className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-0 z-10`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${color}-500 shadow-[0_0_12px_rgba(0,0,0,0.2)] shadow-${color}-500/30`}></div>
                    <h3 className="font-black text-sm text-slate-700 tracking-tight uppercase">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-500">{leads.length}</span>
                </div>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 flex flex-col gap-3 min-h-[500px] transition-colors duration-200 rounded-3xl p-1 ${snapshot.isDraggingOver ? 'bg-slate-100/50 ring-2 ring-dashed ring-slate-200' : ''}`}
                    >
                        {leads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                {(provided) => (
                                    <KanbanCard
                                        lead={lead}
                                        onEdit={onEditLead}
                                        innerRef={provided.innerRef}
                                        draggableProps={provided.draggableProps}
                                        dragHandleProps={provided.dragHandleProps}
                                    />
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}

                        {leads.length === 0 && !snapshot.isDraggingOver && (
                            <div className="py-20 px-6 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Circle size={24} className="text-slate-300" />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum Lead</p>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default KanbanColumn;
