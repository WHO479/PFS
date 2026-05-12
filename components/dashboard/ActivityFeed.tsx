'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Activity } from '@/lib/types';
import { Phone, Mail, Users, FileText, CheckSquare, Calendar, Zap } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
  email: { icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  meeting: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  note: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  task: { icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
  deal_created: { icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  deal_moved: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
  contact_created: { icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
};

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {activities.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Sin actividad reciente</p>
        )}
        {activities.map(activity => {
          const cfg = typeConfig[activity.type] || typeConfig.note;
          const Icon = cfg.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className={`p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-snug">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
