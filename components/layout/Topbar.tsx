'use client';

import { Search, Plus, Bell } from 'lucide-react';

interface TopbarProps {
  children?: React.ReactNode;
}

export default function Topbar({ children }: TopbarProps) {
  return (
    <header className="crm-topbar">
      <div className="crm-search">
        <Search size={14} />
        <input placeholder="Buscar contactos, deals, empresas…" />
        <span className="crm-kbd">⌘K</span>
      </div>
      <div className="crm-topbar-actions">
        {children}
        <button className="crm-icon-btn">
          <Plus size={16} />
        </button>
        <button className="crm-icon-btn">
          <Bell size={16} />
          <span className="crm-dot" />
        </button>
      </div>
    </header>
  );
}
