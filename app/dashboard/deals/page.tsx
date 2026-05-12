'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { createClient } from '@/lib/supabase/client';
import type { Deal, PipelineStage } from '@/lib/types';
import Topbar from '@/components/layout/Topbar';
import Modal from '@/components/ui/Modal';
import DealForm from '@/components/deals/DealForm';
import { Plus, GripVertical, ArrowRight } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  lead:        '#5CB3FF',
  contacted:   '#B388FF',
  demo:        '#FFB020',
  proposal:    '#FF7AB6',
  negotiation: '#FF5C5C',
  won:         '#CCFF00',
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#CCFF00,#6B8500)',
  'linear-gradient(135deg,#5CB3FF,#1E5C99)',
  'linear-gradient(135deg,#FFB020,#8C5C00)',
  'linear-gradient(135deg,#FF5C5C,#8C1F1F)',
  'linear-gradient(135deg,#B388FF,#5B2E99)',
];

function fmtFull(v: number) { return '$' + v.toLocaleString('en-US'); }
function fmtK(v: number) { return '$' + (v / 1000).toFixed(v >= 100000 ? 0 : 1) + 'K'; }

function DealCard({ deal, isDragging, onEdit, onDelete }: {
  deal: Deal; isDragging?: boolean;
  onEdit: (d: Deal) => void; onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };

  return (
    <div ref={setNodeRef} style={style}
      className={`deal-card${isDragging ? ' dragging' : ''}`}>
      <div className="deal-card-head">
        <h4 className="deal-company">{deal.company?.name || deal.title}</h4>
        <button {...attributes} {...listeners} style={{ color: 'var(--text-quaternary)', cursor: 'grab', touchAction: 'none' }}>
          <GripVertical size={14} />
        </button>
      </div>
      <div className="deal-amount">{fmtFull(deal.value)}</div>
      <p className="deal-product">{deal.title}</p>
      {deal.status === 'won' && (
        <div style={{ marginBottom: 10 }}>
          <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-dim)', borderColor: 'rgba(204,255,0,0.28)' }}>Ganado</span>
        </div>
      )}
      <div className="deal-foot">
        <div className="left">
          <div className="avatar-sm" style={{
            background: AVATAR_COLORS[deal.id.charCodeAt(0) % AVATAR_COLORS.length],
            width: 22, height: 22, fontSize: 9,
          }}>MM</div>
          <span style={{ fontSize: 11 }}>MM</span>
        </div>
        <span className="deal-prob">{deal.probability}%</span>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, deals, onAdd, onEdit, onDelete }: {
  stage: PipelineStage;
  deals: Deal[];
  onAdd: (stageId: string) => void;
  onEdit: (d: Deal) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const stageColor = STAGE_COLORS[stage.name.toLowerCase().replace('é', 'e').replace('ó', 'o').replace('ó', 'o')] ||
    STAGE_COLORS[Object.keys(STAGE_COLORS)[stage.position - 1]] || '#888';
  const total = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="kanban-col">
      <div className="kanban-col-head">
        <div className="kanban-col-title">
          <span className="kanban-col-bar" style={{ background: stageColor }} />
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 700 }}>
            {String(stage.position).padStart(2, '0')}
          </span>
          <span>{stage.name}</span>
        </div>
        <button className="kanban-col-add" onClick={() => onAdd(stage.id)}>
          <Plus size={12} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px', gap: 8 }}>
        <span className="kanban-col-count">{deals.length}</span>
        {total > 0 && <span className="kanban-col-value">{fmtK(total)}</span>}
      </div>
      <div
        ref={setNodeRef}
        className={`kanban-cards${isOver ? ' drop-over' : ''}`}
      >
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '24px 12px', textAlign: 'center', color: 'var(--text-quaternary)', fontSize: 12 }}>
            Arrastra deals aquí
          </div>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [defaultStageId, setDefaultStageId] = useState('');
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from('pipeline_stages').select('*').order('position'),
      supabase.from('deals').select('*, stage:pipeline_stages(id,name,color,position), contact:contacts(id,first_name,last_name), company:companies(id,name)').order('position').order('created_at'),
    ]);
    setStages((s || []) as PipelineStage[]);
    setDeals((d || []) as Deal[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const supabase = createClient();
    const ch = supabase.channel('deals-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const getDealsForStage = (stageId: string) => deals.filter(d => d.stage_id === stageId && d.status === 'open');

  function onDragStart({ active }: DragStartEvent) {
    setActiveDeal(deals.find(d => d.id === active.id) || null);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const ad = deals.find(d => d.id === activeId);
    if (!ad) return;
    const overStage = stages.find(s => s.id === overId);
    if (overStage && ad.stage_id !== overId) {
      setDeals(prev => prev.map(d => d.id === activeId ? { ...d, stage_id: overId } : d));
    }
    const overDeal = deals.find(d => d.id === overId);
    if (overDeal && overDeal.stage_id && overDeal.stage_id !== ad.stage_id) {
      setDeals(prev => prev.map(d => d.id === activeId ? { ...d, stage_id: overDeal.stage_id } : d));
    }
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveDeal(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const ad = deals.find(d => d.id === activeId);
    if (!ad) return;
    const overStage = stages.find(s => s.id === overId);
    const overDeal = deals.find(d => d.id === overId);
    const targetStageId = overStage?.id || overDeal?.stage_id || ad.stage_id;
    if (!targetStageId) return;
    if (ad.stage_id !== targetStageId) {
      const supabase = createClient();
      await supabase.from('deals').update({ stage_id: targetStageId }).eq('id', activeId);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const stg = stages.find(s => s.id === targetStageId);
        await supabase.from('activities').insert({ type: 'deal_moved', title: `Deal movido a: ${stg?.name}`, description: ad.title, deal_id: activeId, created_by: user.id });
      }
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este deal?')) return;
    const supabase = createClient();
    await supabase.from('deals').delete().eq('id', id);
    fetchData();
  }

  const allDeals = deals.filter(d => d.status === 'open');
  const grandTotal = allDeals.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar>
        <button className="btn btn-primary" onClick={() => { setEditingDeal(null); setDefaultStageId(stages[0]?.id || ''); setShowModal(true); }}>
          <Plus size={14} /> Nuevo deal
        </button>
      </Topbar>

      <div style={{ padding: '32px 28px 12px' }}>
        <div className="page-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="page-eyebrow">Sales pipeline · Q2 2026</div>
            <h1 className="page-title">Pipeline</h1>
            <p className="page-sub">
              {allDeals.length} deals activos · valor total{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--display)' }}>{fmtFull(grandTotal)}</span>
            </p>
          </div>
          <div className="page-actions">
            <div className="segmented">
              <button className="active">Todos</button>
              <button>DR</button>
              <button>AS</button>
              <button>MV</button>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingDeal(null); setDefaultStageId(stages[0]?.id || ''); setShowModal(true); }}>
              <Plus size={14} /> Nuevo deal
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Cargando pipeline…</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
          <div style={{ flex: 1, overflowX: 'auto', padding: '0 28px 40px' }}>
            <div className="kanban">
              {stages.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={getDealsForStage(stage.id)}
                  onAdd={(sid) => { setEditingDeal(null); setDefaultStageId(sid); setShowModal(true); }}
                  onEdit={(deal) => { setEditingDeal(deal); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeDeal ? (
              <div style={{ transform: 'rotate(-1deg) scale(1.03)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="deal-card">
                  <div className="deal-card-head"><h4 className="deal-company">{activeDeal.company?.name || activeDeal.title}</h4></div>
                  <div className="deal-amount">{fmtFull(activeDeal.value)}</div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingDeal ? 'Editar deal' : 'Nuevo deal'} size="lg">
        <DealForm
          deal={editingDeal || undefined}
          defaultStageId={defaultStageId}
          onSuccess={() => { setShowModal(false); fetchData(); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
