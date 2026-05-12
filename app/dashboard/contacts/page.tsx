'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Contact } from '@/lib/types';
import Topbar from '@/components/layout/Topbar';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/contacts/ContactForm';
import { getInitials } from '@/lib/utils';
import { Search, Download, MoreHorizontal } from 'lucide-react';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#CCFF00,#6B8500)',
  'linear-gradient(135deg,#5CB3FF,#1E5C99)',
  'linear-gradient(135deg,#FFB020,#8C5C00)',
  'linear-gradient(135deg,#FF5C5C,#8C1F1F)',
  'linear-gradient(135deg,#B388FF,#5B2E99)',
  'linear-gradient(135deg,#4DFFB8,#1F8C66)',
  'linear-gradient(135deg,#FF7AB6,#99214D)',
];
const avatarFor = (id: string | number) => AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];

type SortKey = 'first_name' | 'company' | 'status' | 'email';
type SortDir = 'asc' | 'desc';

const statusTag = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    active:   { cls: 'tag-customer', label: 'Customer' },
    inactive: { cls: '',            label: 'Inactivo'  },
    lead:     { cls: 'tag-lead',    label: 'Lead'      },
  };
  const m = map[status] || map.lead;
  return <span className={`tag ${m.cls}`}><span className="tag-dot" />{m.label}</span>;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'first_name', dir: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const router = useRouter();

  const fetchContacts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('contacts')
      .select('*, company:companies(id,name)')
      .order('created_at', { ascending: false });
    setContacts((data || []) as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const counts = useMemo(() => ({
    all:      contacts.length,
    lead:     contacts.filter(c => c.status === 'lead').length,
    active:   contacts.filter(c => c.status === 'active').length,
    inactive: contacts.filter(c => c.status === 'inactive').length,
  }), [contacts]);

  const filtered = useMemo(() => {
    let rows = contacts.filter(c =>
      (filter === 'all' || c.status === filter) &&
      (query === '' ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()) ||
        c.company?.name?.toLowerCase().includes(query.toLowerCase()))
    );
    rows = [...rows].sort((a, b) => {
      const av = sort.key === 'first_name' ? `${a.first_name} ${a.last_name}` : sort.key === 'company' ? (a.company?.name || '') : sort.key === 'email' ? (a.email || '') : (a.status || '');
      const bv = sort.key === 'first_name' ? `${b.first_name} ${b.last_name}` : sort.key === 'company' ? (b.company?.name || '') : sort.key === 'email' ? (b.email || '') : (b.status || '');
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [contacts, query, filter, sort]);

  const handleSort = (key: SortKey) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const SortHead = ({ k, children, align }: { k: SortKey; children: React.ReactNode; align?: string }) => (
    <th className={`sortable${sort.key === k ? ' sorted' : ''}`} style={{ textAlign: (align || 'left') as 'left' | 'right' }} onClick={() => handleSort(k)}>
      {children}
      <span className="sort-ind">{sort.key === k ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </th>
  );

  return (
    <div>
      <Topbar>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nuevo contacto
        </button>
      </Topbar>

      <div className="crm-content">
        <div className="page-head">
          <div>
            <div className="page-eyebrow">CRM · Base de datos</div>
            <h1 className="page-title">Contactos</h1>
            <p className="page-sub">{contacts.length} contactos · Restaurantes, dark kitchens y cadenas en LATAM</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary"><Download size={14} /> Exportar CSV</button>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>+ Nuevo contacto</button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="search-input">
            <Search size={14} />
            <input placeholder="Buscar por nombre, empresa o ciudad…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          {[
            { id: 'all',      label: 'Todos' },
            { id: 'lead',     label: 'Lead' },
            { id: 'active',   label: 'Customer' },
            { id: 'inactive', label: 'Inactivo' },
          ].map(f => (
            <button key={f.id} className={`filter-chip${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="count">{counts[f.id as keyof typeof counts]}</span>
            </button>
          ))}
          <button className="filter-chip" style={{ marginLeft: 'auto' }}>Más filtros</button>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <SortHead k="first_name">Contacto</SortHead>
                <SortHead k="company">Empresa</SortHead>
                <SortHead k="status">Estado</SortHead>
                <th>Ciudad</th>
                <SortHead k="email">Email</SortHead>
                <th>Owner</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>Cargando…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                  {query ? `Sin resultados para "${query}"` : 'No hay contactos. ¡Crea el primero!'}
                </td></tr>
              )}
              {filtered.map(contact => (
                <tr key={contact.id} onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}>
                  <td>
                    <div className="contact-cell">
                      <div className="avatar-sm" style={{ background: avatarFor(contact.id) }}>
                        {getInitials(`${contact.first_name} ${contact.last_name}`)}
                      </div>
                      <div>
                        <div className="cell-strong">{contact.first_name} {contact.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-strong">{contact.company?.name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{contact.job_title || ''}</div>
                  </td>
                  <td>{statusTag(contact.status)}</td>
                  <td className="cell-muted">CDMX</td>
                  <td className="cell-muted" style={{ fontSize: 12 }}>{contact.email || '—'}</td>
                  <td>
                    <div className="avatar-sm" style={{ background: avatarFor(contact.id.charCodeAt(0) || 0), width: 26, height: 26, fontSize: 10 }}>
                      MM
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 6 }}
                      onClick={e => { e.stopPropagation(); setEditing(contact); setShowModal(true); }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, color: 'var(--text-tertiary)', fontSize: 12 }}>
          <div>Mostrando {filtered.length} de {contacts.length} contactos</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5 }}>← Anterior</button>
            <span>Página <strong style={{ color: 'var(--text-primary)' }}>1</strong> de 1</span>
            <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5 }}>Siguiente →</button>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar contacto' : 'Nuevo contacto'} size="lg">
        <ContactForm
          contact={editing || undefined}
          onSuccess={() => { setShowModal(false); fetchContacts(); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
