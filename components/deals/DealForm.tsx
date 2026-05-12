'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Deal, PipelineStage, Contact, Company } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DealFormProps {
  deal?: Partial<Deal>;
  defaultStageId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const stageShorts: Record<number, string> = { 1: '01', 2: '02', 3: '03', 4: '04', 5: '05', 6: '06' };

export default function DealForm({ deal, defaultStageId, onSuccess, onCancel }: DealFormProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prob, setProb] = useState(deal?.probability ?? 50);
  const [form, setForm] = useState({
    title:      deal?.title      || '',
    value:      deal?.value?.toString() || '0',
    currency:   deal?.currency   || 'USD',
    stage_id:   deal?.stage_id   || defaultStageId || '',
    contact_id: deal?.contact_id || '',
    company_id: deal?.company_id || '',
    close_date: deal?.close_date || '',
    status:     deal?.status     || 'open',
    notes:      deal?.notes      || '',
  });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('pipeline_stages').select('*').order('position'),
      supabase.from('contacts').select('id,first_name,last_name').order('first_name'),
      supabase.from('companies').select('id,name').order('name'),
    ]).then(([{ data: s }, { data: c }, { data: co }]) => {
      setStages((s || []) as PipelineStage[]);
      setContacts((c || []) as Contact[]);
      setCompanies((co || []) as Company[]);
      if (!form.stage_id && s?.[0]) setForm(p => ({ ...p, stage_id: s[0].id }));
    });
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('El título es requerido'); return; }
    setError(''); setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      title: form.title, value: parseFloat(form.value) || 0, currency: form.currency,
      stage_id: form.stage_id || null, contact_id: form.contact_id || null,
      company_id: form.company_id || null, close_date: form.close_date || null,
      probability: prob, status: form.status, notes: form.notes || null, created_by: user?.id,
    };
    const { data: result, error: err } = deal?.id
      ? await supabase.from('deals').update(payload).eq('id', deal.id).select().single()
      : await supabase.from('deals').insert(payload).select().single();
    if (err) { setError(err.message); setLoading(false); return; }
    if (result && user) {
      await supabase.from('activities').insert({
        type: deal?.id ? 'deal_moved' : 'deal_created',
        title: deal?.id ? `Deal actualizado: ${form.title}` : `Nuevo deal: ${form.title}`,
        deal_id: result.id, created_by: user.id,
      });
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(255,92,92,0.12)', border: '1px solid rgba(255,92,92,0.3)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Stage picker */}
      <div className="field full" style={{ marginBottom: 16 }}>
        <label className="crm-label">Etapa <span className="req">*</span></label>
        <div className="stage-picker">
          {stages.map((s) => (
            <button key={s.id} type="button"
              className={`stage-pill${form.stage_id === s.id ? ' active' : ''}`}
              onClick={() => set('stage_id', s.id)}>
              <span className="stage-num">{stageShorts[s.position] || String(s.position).padStart(2, '0')}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field full">
          <label className="crm-label">Título <span className="req">*</span></label>
          <input className="crm-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nombre del deal" required />
        </div>
        <div className="field">
          <label className="crm-label">Valor</label>
          <div className="input-wrap" style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
            <input type="number" min="0" step="1" className="crm-input" style={{ paddingLeft: 28 }}
              value={form.value} onChange={e => set('value', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="crm-label">Moneda</label>
          <select className="crm-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="field">
          <label className="crm-label">Contacto</label>
          <select className="crm-select" value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
            <option value="">Sin contacto</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="crm-label">Empresa</label>
          <select className="crm-select" value={form.company_id} onChange={e => set('company_id', e.target.value)}>
            <option value="">Sin empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="crm-label">Fecha de cierre</label>
          <input type="date" className="crm-input" value={form.close_date} onChange={e => set('close_date', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Estado</label>
          <select className="crm-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="open">Abierto</option>
            <option value="won">Ganado</option>
            <option value="lost">Perdido</option>
          </select>
        </div>

        {/* Probability slider */}
        <div className="field full">
          <label className="crm-label">Probabilidad</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input type="range" min="0" max="100" value={prob}
              onChange={e => setProb(parseInt(e.target.value))}
              style={{ flex: 1, WebkitAppearance: 'none', appearance: 'none', height: 4, background: `linear-gradient(to right, var(--accent) ${prob}%, var(--bg-elevated) ${prob}%)`, borderRadius: 2, outline: 'none' }}
            />
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, width: 60, textAlign: 'right', letterSpacing: '-0.02em' }}>
              {prob}%
            </span>
          </div>
        </div>

        <div className="field full">
          <label className="crm-label">Notas</label>
          <textarea className="crm-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--border)', gap: 12 }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Los campos con <span style={{ color: 'var(--accent)' }}>*</span> son obligatorios</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {deal?.id ? 'Actualizar deal' : 'Crear deal'}
          </button>
        </div>
      </div>
    </form>
  );
}
