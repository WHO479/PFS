'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { Deal } from '@/lib/types';
import { TrendingUp, ArrowRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  open: 'Abierto',
  won: 'Ganado',
  lost: 'Perdido',
};

export default function RecentDeals({ deals }: { deals: Deal[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Deals recientes</h3>
        </div>
        <Link href="/dashboard/deals" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {deals.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No hay deals aún</p>
        )}
        {deals.map(deal => (
          <Link key={deal.id} href={`/dashboard/deals`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition group">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition truncate">{deal.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{deal.stage?.name || '—'}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.value, deal.currency)}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[deal.status]}`}>
                {statusLabels[deal.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
