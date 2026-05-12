'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 480, md: 560, lg: 720 };

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" style={{ maxWidth: sizeMap[size] }} onClick={e => e.stopPropagation()}>
        <div className="crm-modal-head">
          <h3 className="crm-modal-title">{title}</h3>
          <button onClick={onClose} className="crm-icon-btn" style={{ width: 32, height: 32, borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>
        <div className="crm-modal-body">{children}</div>
      </div>
    </div>
  );
}
