'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Deal, PipelineStage } from '@/lib/types';
import DealCard from './DealCard';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onAddDeal: (stageId: string) => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (id: string) => void;
}

export default function KanbanColumn({ stage, deals, onAddDeal, onEditDeal, onDeleteDeal }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-semibold text-gray-800">{stage.name}</span>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{deals.length}</span>
        </div>
        <button
          onClick={() => onAddDeal(stage.id)}
          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          title="Agregar deal"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Value summary */}
      {totalValue > 0 && (
        <p className="text-xs text-gray-400 font-medium px-1 mb-2">{formatCurrency(totalValue)}</p>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 space-y-2 min-h-[400px] transition-colors ${
          isOver ? 'bg-indigo-50/60 border-2 border-indigo-200 border-dashed' : 'bg-gray-100/60'
        }`}
      >
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              onEdit={onEditDeal}
              onDelete={onDeleteDeal}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div
            onClick={() => onAddDeal(stage.id)}
            className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition text-gray-400 hover:text-indigo-400"
          >
            <Plus size={18} />
            <span className="text-xs mt-1">Agregar deal</span>
          </div>
        )}
      </div>
    </div>
  );
}
