'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Deal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Building2, User, Calendar, Pencil, Trash2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition group cursor-default">
      {/* Drag handle */}
      <div className="flex items-start p-3.5 gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{deal.title}</p>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => onEdit(deal)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                <Pencil size={12} />
              </button>
              <button onClick={() => onDelete(deal.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <p className="text-base font-bold text-indigo-600 mt-1">{formatCurrency(deal.value, deal.currency)}</p>

          {/* Metadata */}
          <div className="mt-2 space-y-1">
            {deal.contact && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <User size={11} className="text-gray-400 shrink-0" />
                <span className="truncate">{deal.contact.first_name} {deal.contact.last_name}</span>
              </div>
            )}
            {deal.company && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Building2 size={11} className="text-gray-400 shrink-0" />
                <span className="truncate">{deal.company.name}</span>
              </div>
            )}
            {deal.close_date && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={11} className="text-gray-400 shrink-0" />
                <span>{format(new Date(deal.close_date), 'dd MMM yyyy', { locale: es })}</span>
              </div>
            )}
          </div>

          {/* Probability bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Probabilidad</span>
              <span className="text-xs font-medium text-gray-600">{deal.probability}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
