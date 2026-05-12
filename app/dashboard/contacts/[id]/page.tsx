'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Contact, Activity, Deal } from '@/lib/types';
import Topbar from '@/components/layout/Topbar';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/contacts/ContactForm';
import { getInitials, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, Star, MoreHorizontal, FileText } from 'lucide-react';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#CCFF00,#6B8500)',
  'linear-gradient(135deg,#5CB3FF,#1E5C99)',
  'linear-gradient(135deg,#FFB020,#8C5C00)',
  'linear-gradient(135deg,#FF5C5C,#8C1F1F)',
  'linear-gradient(135deg,#B388FF,#5B2E99)',
];
const avatarFor = (id: string | number) => AVATAR_COLORS[Number(String(id).charCodeAt(0) || 0) % AVATAR_COLORS.length];

const statusTag = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    active:   { cls: 'tag-customer', label: 'Customer' },
    inactive: { cls: '',            label: 'Inactivo'  },
    lead:     { cls: 'tag-lead',    label: 'Lead'      },
  };
  const m = map[status] || map.lead;
  return <span className={`tag ${m.cls}`}><span className="tag-dot" />{m.label}</span>;
};

const kindIcon: Record<string, string> = {
  deal: '✨', call: '📞', email: '✉', demo: '📅',
  note: '📝', created: '👤', meeting: '📅', task: '✓',
  deal_created: '✨', deal_moved: '✨', contact_created: '👤',
};
const kindLabel: Record<string, string> = {
  deal: 'Deal', call: 'Llamada', email: 'Email', demo: 'Demo',
  note: 'Nota', created: 'Sistema', meeting: 'Reunión', task: 'Tarea',
  deal_created: 'Deal', deal_moved: 'Deal', contact_created: 'Sistema',
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tab, setTab] = useState('all');
  const [showEdit, setShowEdit] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('note');

  const fetchContact = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('contacts').select('*, company:companies(*)').eq('id', id).single();
    setContact(data as Contact);
  }, [id]);

  const fetchActivities = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('activities').select('*').eq('contact_id', id).order('created_at', { ascending: false });
    setActivities((data || []) as Activity[]);
  }, [id]);

  const fetchDeals = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('deals').select('*, stage:pipeline_stages(name,color)').eq('contact_id', id).order('created_at', { ascending: false });
    setDeals((data || []) as Deal[]);
  }, [id]);

  useEffect(() => { fetchContact(); fetchActivities(); fetchDeals(); }, [fetchContact, fetchActivities, fetchDeals]);

  async function handleSaveNote() {
    if (!noteText.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activities').insert({
      type: noteType, title: noteText, contact_id: id, created_by: user?.id,
    });
    setNoteText('');
    fetchActivities();
  }

  const filteredTL = activities.filter(a =>
    tab === 'all' ||
    (tab === 'comms' && ['call', 'email', 'meeting'].includes(a.type)) ||
    tab === a.type
  );

  if (!contact) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-tertiary)' }}>
      Cargando…
    </div>
  );

  const lifetimeValue = deals.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div>
      <Topbar>
        <button className="btn btn-secondary"><Phone size={14} /> Llamar</button>
        <button className="btn btn-secondary"><Mail size={14} /> Email</button>
        <button className="btn btn-primary">+ Nuevo deal</button>
      </Topbar>

      <div className="crm-content">
        <div className="page-head">
          <div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12, padding: '0 8px' }}
              onClick={() => router.push('/dashboard/contacts')}>
              <ArrowLeft size={12} /> Volver a contactos
            </button>
            <div className="page-eyebrow">Contacto · #{contact.id.slice(-4).toUpperCase()}</div>
            <h1 className="page-title">{contact.first_name} {contact.last_name}</h1>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>Editar</button>
          </div>
        </div>

        {/* Hero */}
        <div className="detail-hero">
          <div className="avatar-lg" style={{ background: avatarFor(contact.id) }}>
            {getInitials(`${contact.first_name} ${contact.last_name}`)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="detail-name">{contact.company?.name || contact.first_name}</h2>
            <p className="detail-role">
              {contact.job_title || 'Contacto'} · {contact.first_name} {contact.last_name}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {statusTag(contact.status)}
              <span className="tag"><Star size={10} /> Cuenta clave</span>
              {lifetimeValue > 0 && (
                <span className="tag" style={{ color: 'var(--accent)', background: 'var(--accent-dim)', borderColor: 'rgba(204,255,0,0.28)' }}>
                  🔥 Hot
                </span>
              )}
            </div>
          </div>
          <div className="detail-hero-actions">
            <button className="crm-icon-btn"><Star size={15} /></button>
            <button className="crm-icon-btn"><MoreHorizontal size={15} /></button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-label">Lifetime value</div>
            <div className="detail-stat-value">{formatCurrency(lifetimeValue)}</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-label">Deals abiertos</div>
            <div className="detail-stat-value">{deals.filter(d => d.status === 'open').length}</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-label">Última interacción</div>
            <div className="detail-stat-value" style={{ fontSize: 16 }}>
              {activities[0] ? new Date(activities[0].created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Sin datos'}
            </div>
          </div>
        </div>

        {/* Two-column */}
        <div className="detail-grid">
          {/* Timeline */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Timeline de actividades</h3>
              <div className="segmented">
                {['all', 'comms', 'note', 'deal'].map(t => (
                  <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                    {t === 'all' ? 'Todo' : t === 'comms' ? 'Comms' : t === 'note' ? 'Notas' : 'Deals'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              {/* Quick composer */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <textarea className="crm-textarea" style={{ minHeight: 60, marginBottom: 10 }}
                  placeholder="Escribe una nota, registra una llamada o programa un siguiente paso…"
                  value={noteText} onChange={e => setNoteText(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['note', 'call', 'meeting', 'task'].map(t => (
                      <button key={t} className={`btn btn-ghost btn-sm${noteType === t ? '' : ''}`}
                        style={{ opacity: noteType === t ? 1 : 0.6 }}
                        onClick={() => setNoteType(t)}>
                        {t === 'note' ? '📝 Nota' : t === 'call' ? '📞 Llamada' : t === 'meeting' ? '📅 Reunión' : '✓ Tarea'}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNote}>Guardar</button>
                </div>
              </div>

              {/* Timeline */}
              <div className="timeline">
                {filteredTL.length === 0 && (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin actividades registradas</p>
                )}
                {filteredTL.map((a, i) => (
                  <div key={a.id} className="tl-item">
                    <div className={`tl-dot${i === 0 ? ' accent' : ''}`}>
                      {kindIcon[a.type] || <FileText size={14} />}
                    </div>
                    <div className="tl-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <p className="tl-title">{a.title}</p>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: 4, flexShrink: 0 }}>
                          {kindLabel[a.type] || a.type}
                        </span>
                      </div>
                      <div className="tl-meta">
                        {new Date(a.created_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      {a.description && <div className="tl-note">{a.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Info */}
            <div className="card">
              <div className="card-head"><h3 className="card-title">Información</h3></div>
              <div className="card-body" style={{ paddingTop: 4, paddingBottom: 8 }}>
                <div className="info-list">
                  {contact.email && <div className="info-row"><span className="info-key">Email</span><span className="info-val">{contact.email}</span></div>}
                  {contact.phone && <div className="info-row"><span className="info-key">Teléfono</span><span className="info-val">{contact.phone}</span></div>}
                  {contact.company && <div className="info-row"><span className="info-key">Empresa</span><span className="info-val">{contact.company.name}</span></div>}
                  {contact.job_title && <div className="info-row"><span className="info-key">Cargo</span><span className="info-val">{contact.job_title}</span></div>}
                  <div className="info-row"><span className="info-key">Estado</span><span className="info-val">{contact.status}</span></div>
                </div>
              </div>
            </div>

            {/* Deals */}
            {deals.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <h3 className="card-title">Deals activos</h3>
                  <span className="tag">{deals.length}</span>
                </div>
                <div style={{ padding: '4px 16px 16px' }}>
                  {deals.map((d, i) => (
                    <div key={d.id} style={{ padding: '12px 0', borderBottom: i < deals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{d.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{d.stage?.name} · {d.probability}%</div>
                        </div>
                        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
                          {formatCurrency(d.value)}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${d.probability}%`, background: 'var(--accent)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="card">
                <div className="card-head"><h3 className="card-title">Notas</h3></div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{contact.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar contacto" size="lg">
        <ContactForm
          contact={contact}
          onSuccess={() => { setShowEdit(false); fetchContact(); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
}
