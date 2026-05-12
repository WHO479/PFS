'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Contact, Company } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ContactFormProps {
  contact?: Partial<Contact>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: contact?.first_name || '',
    last_name:  contact?.last_name  || '',
    email:      contact?.email      || '',
    phone:      contact?.phone      || '',
    job_title:  contact?.job_title  || '',
    company_id: contact?.company_id || '',
    status:     contact?.status     || 'lead',
    notes:      contact?.notes      || '',
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.from('companies').select('*').order('name').then(({ data }) => setCompanies((data || []) as Company[]));
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...form, company_id: form.company_id || null, created_by: user?.id };
    const { error: err } = contact?.id
      ? await supabase.from('contacts').update(payload).eq('id', contact.id)
      : await supabase.from('contacts').insert(payload);
    if (err) { setError(err.message); setLoading(false); return; }
    if (!contact?.id && user) {
      await supabase.from('activities').insert({ type: 'contact_created', title: `Contacto creado: ${form.first_name} ${form.last_name}`, created_by: user.id });
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

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field">
          <label className="crm-label">Nombre <span className="req">*</span></label>
          <input className="crm-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
        </div>
        <div className="field">
          <label className="crm-label">Apellido <span className="req">*</span></label>
          <input className="crm-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
        </div>
        <div className="field">
          <label className="crm-label">Email</label>
          <input type="email" className="crm-input" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Teléfono</label>
          <input className="crm-input" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Puesto</label>
          <input className="crm-input" value={form.job_title} onChange={e => set('job_title', e.target.value)} />
        </div>
        <div className="field">
          <label className="crm-label">Empresa</label>
          <select className="crm-select" value={form.company_id} onChange={e => set('company_id', e.target.value)}>
            <option value="">Sin empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="crm-label">Estado</label>
          <select className="crm-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="lead">Lead</option>
            <option value="active">Customer</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <div className="field full">
          <label className="crm-label">Notas</label>
          <textarea className="crm-textarea" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginTop: 4, borderTop: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Los campos con <span style={{ color: 'var(--accent)' }}>*</span> son obligatorios</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {contact?.id ? 'Actualizar' : 'Crear contacto'}
          </button>
        </div>
      </div>
    </form>
  );
}
