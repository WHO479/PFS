'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'var(--body)',
    }}>
      {/* Subtle radial glow behind card */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(204,255,0,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent)', marginBottom: 20,
            boxShadow: '0 0 40px rgba(204,255,0,0.3)',
          }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: '#000', letterSpacing: '-0.04em' }}>P3</span>
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
            PLAN<span style={{ color: 'var(--accent)' }}>3</span>
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginTop: 6, marginBottom: 0 }}>Inicia sesión en tu cuenta</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 20,
          padding: 32,
        }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(255,92,92,0.12)', border: '1px solid rgba(255,92,92,0.3)',
                color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="crm-label">Email</label>
              <input
                type="email"
                className="crm-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="crm-label">Contraseña</label>
              <input
                type="password"
                className="crm-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Iniciar sesión
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
