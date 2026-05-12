'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const industries = ['Tecnología', 'Finanzas', 'Salud', 'Educación', 'Manufactura', 'Retail', 'Consultoría', 'Inmobiliaria', 'Otro'];
const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

interface CompanyFormProps {
  company?: Partial<Company>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name:     company?.name     || '',
    domain:   company?.domain   || '',
    industry: company?.industry || '',
    size:     company?.size     || '',
    phone:    company?.phone    || '',
    address:  company?.address  || '',
    website:  company?.website  || '',
    notes:    company?.notes    || '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      domain: form.domain || null, industry: form.industry || null, size: form.size || null,
      phone: form.phone || null, address: form.address || null, website: form.website || null,
      notes: form.notes || null, created_by: user?.id,
    };
    const { error: err } = company?.id
      ? await supabase.from('companies').update(payload).eq('id', company.id)
      : await supabase.from('companies').insert(payload);
    if (err) { setError(err.message); setLoading(false); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(255,92,92,0.12)', border: '1px solid rgba(255,92,92,0.3)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field full">
          <label className="crm-label">Nombre de empresa <span className="req">*</span></label>
          <input className="crm-input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div className="field">
          <label className="crm-label">Dominio</label>
          <input className="crm-input" placeholder="empresa.com" value={form.domain} onChange={e => set('domain', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Sitio web</label>
          <input className="crm-input" placeholder="https://" value={form.website} onChange={e => set('website', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Industria</label>
          <select className="crm-select" value={form.industry} onChange={e => set('industry', e.target.value)}>
            <option value="">Seleccionar</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="crm-label">Tamaño</label>
          <select className="crm-select" value={form.size} onChange={e => set('size', e.target.value)}>
            <option value="">Seleccionar</option>
            {sizes.map(s => <option key={s} value={s}>{s} empleados</option>)}
          </select>
        </div>
        <div className="field">
          <label className="crm-label">Teléfono</label>
          <input className="crm-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Dirección</label>
          <input className="crm-input" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="field full">
          <label className="crm-label">Notas</label>
          <textarea className="crm-textarea" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--border)', gap: 12 }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Los campos con <span style={{ color: 'var(--accent)' }}>*</span> son obligatorios</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {company?.id ? 'Actualizar empresa' : 'Crear empresa'}
          </button>
        </div>
      </div>
    </form>
  );
}
