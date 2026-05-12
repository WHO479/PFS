'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import type { Activity } from '@/lib/types';
import { Phone, Mail, Calendar, FileText, CheckSquare, Zap, Plus, Loader2 } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  call: { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Llamada' },
  email: { icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Email' },
  meeting: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Reunión' },
  note: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Nota' },
  task: { icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-100', label: 'Tarea' },
  deal_created: { icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Deal creado' },
  deal_moved: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Deal movido' },
  contact_created: { icon: Zap, color: 'text-green-600', bg: 'bg-green-100', label: 'Contacto creado' },
};

interface ActivityTimelineProps {
  activities: Activity[];
  contactId?: string;
  dealId?: string;
  onRefresh: () => void;
}

export default function ActivityTimeline({ activities, contactId, dealId, onRefresh }: ActivityTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'note', title: '', description: '' });

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activities').insert({
      type: form.type,
      title: form.title,
      description: form.description || null,
      contact_id: contactId || null,
      deal_id: dealId || null,
      created_by: user?.id,
    });
    setForm({ type: 'note', title: '', description: '' });
    setShowForm(false);
    setLoading(false);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Actividades</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          <Plus size={14} /> Agregar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddActivity} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            >
              {Object.entries(typeConfig).filter(([k]) => ['call','email','meeting','note','task'].includes(k)).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Título de actividad"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <textarea
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
            <button type="submit" disabled={loading} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-1.5">
              {loading && <Loader2 size={12} className="animate-spin" />} Guardar
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        {activities.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Sin actividades registradas</p>}
        {activities.map((activity, i) => {
          const cfg = typeConfig[activity.type] || typeConfig.note;
          const Icon = cfg.icon;
          return (
            <div key={activity.id} className="flex gap-3 relative">
              {i < activities.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
              )}
              <div className={`mt-1 p-2 rounded-lg shrink-0 z-10 ${cfg.bg}`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="pb-5 min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{activity.title}</p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                {activity.description && <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>}
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1.5 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
