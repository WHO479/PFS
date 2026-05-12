'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/lib/types';
import Topbar from '@/components/layout/Topbar';
import Modal from '@/components/ui/Modal';
import CompanyForm from '@/components/companies/CompanyForm';
import { getInitials } from '@/lib/utils';
import { Plus, Globe, Phone, Users, Pencil, Trash2 } from 'lucide-react';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#CCFF00,#6B8500)',
  'linear-gradient(135deg,#5CB3FF,#1E5C99)',
  'linear-gradient(135deg,#FFB020,#8C5C00)',
  'linear-gradient(135deg,#FF5C5C,#8C1F1F)',
  'linear-gradient(135deg,#B388FF,#5B2E99)',
];
const avatarFor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [contactCounts, setContactCounts] = useState<Record<string, number>>({});

  const fetchCompanies = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies((data || []) as Company[]);
    setFiltered((data || []) as Company[]);
    const { data: contacts } = await supabase.from('contacts').select('company_id').not('company_id', 'is', null);
    const counts: Record<string, number> = {};
    contacts?.forEach(c => { if (c.company_id) counts[c.company_id] = (counts[c.company_id] || 0) + 1; });
    setContactCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  useEffect(() => {
    if (!search) { setFiltered(companies); return; }
    const q = search.toLowerCase();
    setFiltered(companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.domain?.toLowerCase().includes(q)
    ));
  }, [search, companies]);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta empresa?')) return;
    const supabase = createClient();
    await supabase.from('companies').delete().eq('id', id);
    fetchCompanies();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Topbar>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={14} /> Nueva empresa
        </button>
      </Topbar>

      <div style={{ padding: '32px 28px 12px' }}>
        <div className="page-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="page-eyebrow">Directorio corporativo</div>
            <h1 className="page-title">Empresas</h1>
            <p className="page-sub">{companies.length} empresas en el directorio</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
              <Plus size={14} /> Nueva empresa
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="filters" style={{ marginBottom: 24 }}>
          <input
            className="crm-input"
            style={{ width: 280 }}
            placeholder="Buscar empresa, industria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 40px' }}>
        {loading && (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '60px 0' }}>Cargando empresas…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>
            {search ? 'Sin resultados para esa búsqueda' : 'No hay empresas. ¡Crea la primera!'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(company => (
            <div key={company.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar-lg" style={{ background: avatarFor(company.id), width: 44, height: 44, fontSize: 14, borderRadius: 12, flexShrink: 0 }}>
                    {getInitials(company.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{company.name}</div>
                    {company.industry && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{company.industry}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="crm-icon-btn" style={{ width: 28, height: 28, borderRadius: 6 }}
                    onClick={() => { setEditing(company); setShowModal(true); }}>
                    <Pencil size={12} />
                  </button>
                  <button className="crm-icon-btn" style={{ width: 28, height: 28, borderRadius: 6, color: 'var(--danger)' }}
                    onClick={() => handleDelete(company.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {company.domain && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <Globe size={11} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.domain}</span>
                  </div>
                )}
                {company.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <Phone size={11} style={{ flexShrink: 0 }} />
                    {company.phone}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Users size={11} style={{ flexShrink: 0 }} />
                  {contactCounts[company.id] || 0} contactos
                  {company.size && ` · ${company.size} empleados`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar empresa' : 'Nueva empresa'} size="lg">
        <CompanyForm
          company={editing || undefined}
          onSuccess={() => { setShowModal(false); fetchCompanies(); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
