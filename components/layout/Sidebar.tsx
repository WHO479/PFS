'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, TrendingUp, Users, Plus, Activity, Calendar, BarChart2, Settings, ChevronDown
} from 'lucide-react';

const navGroups = [
  {
    label: 'Trabajo',
    items: [
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pipeline',  href: '/dashboard/deals', label: 'Pipeline', icon: TrendingUp, badge: '14' },
      { id: 'contacts',  href: '/dashboard/contacts', label: 'Contactos', icon: Users, badge: '342' },
      { id: 'new-deal',  href: '/dashboard/deals/new', label: 'Nuevo deal', icon: Plus },
    ],
  },
  {
    label: 'Productividad',
    items: [
      { id: 'activity', href: '/dashboard/activities', label: 'Actividades', icon: Activity, badge: '6' },
      { id: 'calendar', href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
      { id: 'reports',  href: '/dashboard/reports', label: 'Reportes', icon: BarChart2 },
    ],
  },
];

export default function Sidebar({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const name = userName || 'Usuario';

  return (
    <aside className="crm-sidebar">
      <div className="crm-brand">
        <div className="crm-brand-mark">P3</div>
        <div className="crm-brand-name">PLAN<span>3</span></div>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="crm-nav-section">
          <div className="crm-nav-label">{group.label}</div>
          {group.items.map(({ id, href, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`crm-nav-item${isActive(href) ? ' active' : ''}`}
              onClick={() => router.push(href)}
            >
              <Icon size={15} strokeWidth={2} className="crm-nav-icon" />
              <span>{label}</span>
              {badge && <span className="crm-nav-badge">{badge}</span>}
            </button>
          ))}
        </div>
      ))}

      <div className="crm-sidebar-foot">
        <button
          className="crm-nav-item"
          onClick={() => router.push('/dashboard/settings')}
        >
          <Settings size={15} strokeWidth={2} className="crm-nav-icon" />
          Ajustes
        </button>
        <button className="crm-user-chip" onClick={handleLogout}>
          <div className="crm-avatar">{initials(name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="crm-user-name">{name}</div>
            <div className="crm-user-role">{userRole || 'SDR · CDMX'}</div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        </button>
      </div>
    </aside>
  );
}
