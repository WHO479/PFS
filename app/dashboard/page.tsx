import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Topbar from '@/components/layout/Topbar';
import Link from 'next/link';
import { TrendingUp, CheckSquare, Sparkles, DollarSign, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

function Spark({ vals, color = 'currentColor' }: { vals: number[]; color?: string }) {
  const w = 64, h = 28;
  const max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RevenueChart() {
  const data = [
    { m: 'NOV', v: 142 }, { m: 'DIC', v: 168 }, { m: 'ENE', v: 154 },
    { m: 'FEB', v: 198 }, { m: 'MAR', v: 224 }, { m: 'ABR', v: 268 },
    { m: 'MAY', v: 312 },
  ];
  const max = 340;
  const w = 100, h = 100;
  const step = w / (data.length - 1);
  const points = data.map((d, i) => [i * step, h - (d.v / max) * h] as [number, number]);
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;
  const last = points[points.length - 1];

  return (
    <div style={{ padding: '0 22px 22px' }}>
      <div style={{ position: 'relative', height: 220 }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(t => (
            <line key={t} x1="0" x2={w} y1={h * t} y2={h * t}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          ))}
          <path d={area} fill="url(#areaGrad)" />
          <path d={path} fill="none" stroke="#CCFF00" strokeWidth="1.2"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="1.2" fill="#0A0A0A"
              stroke="#CCFF00" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          ))}
          <circle cx={last[0]} cy={last[1]} r="2.4" fill="#CCFF00" />
        </svg>
        <div style={{
          position: 'absolute',
          left: `calc(${(last[0] / w) * 100}% - 60px)`,
          top: `calc(${(last[1] / h) * 100}% - 50px)`,
          background: 'var(--accent)', color: '#0A0A0A',
          padding: '6px 10px', borderRadius: 8,
          fontFamily: 'var(--display)', fontWeight: 800,
          fontSize: 12, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>$312,400</div>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 10, paddingTop: 12,
        borderTop: '1px solid var(--border)',
        fontSize: 11, color: 'var(--text-tertiary)',
        fontFamily: 'var(--display)', fontWeight: 600, letterSpacing: '0.06em',
      }}>
        {data.map(d => <span key={d.m}>{d.m}</span>)}
      </div>
    </div>
  );
}

function PipelineBar() {
  const segments = [
    { name: 'Lead',        val: 97800,  color: 'rgba(92,179,255,0.55)' },
    { name: 'Contactado',  val: 122500, color: 'rgba(179,136,255,0.6)' },
    { name: 'Demo',        val: 191000, color: 'rgba(255,176,32,0.65)' },
    { name: 'Propuesta',   val: 114000, color: 'rgba(255,122,182,0.7)' },
    { name: 'Negociación', val: 376000, color: 'rgba(255,92,92,0.75)' },
    { name: 'Cerrado',     val: 206000, color: '#CCFF00' },
  ];
  const fmt = (v: number) => '$' + (v / 1000).toFixed(0) + 'k';
  return (
    <div className="pipeline-bar-wrap">
      <div className="pipeline-bar">
        {segments.map(s => (
          <div key={s.name} style={{ flex: s.val, background: s.color }} />
        ))}
      </div>
      <div className="pipeline-legend">
        {segments.map(s => (
          <div key={s.name} className="pipeline-legend-item">
            <div className="leg-label">
              <span className="leg-dot" style={{ background: s.color }} />
              {s.name}
            </div>
            <div className="leg-val">{fmt(s.val)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { count: totalContacts },
    { data: deals },
    { data: activities },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('value, status').limit(200),
    supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(6),
  ]);

  const openDeals = deals?.filter(d => d.status === 'open') || [];
  const wonDeals = deals?.filter(d => d.status === 'won') || [];
  const totalRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);

  const activityIcons: Record<string, string> = {
    call: 'phone', email: 'mail', meeting: 'calendar', note: 'note',
    task: 'check', deal_created: 'sparkles', deal_moved: 'sparkles', contact_created: 'user',
  };

  const upcomingActivities = [
    { time: '09:30', type: 'call',    title: 'Llamada con Burger Bunker', meta: 'Firma de contrato · Andrés Pinto', accent: true },
    { time: '11:00', type: 'demo',    title: 'Demo Plataforma — Sushi Roku CDMX', meta: '45 min · Carlos Mendoza' },
    { time: '13:15', type: 'email',   title: 'Enviar propuesta Wokito Express', meta: 'Renovación anual · $76,000' },
    { time: '15:00', type: 'meeting', title: 'Reunión interna — Forecast Q2', meta: 'Sala Calor · 30 min' },
    { time: '16:45', type: 'task',    title: 'Seguimiento Verde Cocina', meta: 'Confirmar fecha de demo' },
    { time: 'MAÑANA', type: 'call',   title: 'Café Cordillera — discovery', meta: 'Lucía Hernández · 30 min' },
  ];

  return (
    <div>
      <Topbar />
      <div className="crm-content">
        {/* Page header */}
        <div className="page-head">
          <div>
            <div className="page-eyebrow">Resumen · 12 May 2026</div>
            <h1 className="page-title">Buenos días, Mario.</h1>
            <p className="page-sub">
              Tu pipeline crece{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>+18.4%</span> esta semana.
              Hay 6 deals esperando tu próximo movimiento.
            </p>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary">Exportar</button>
            <Link href="/dashboard/deals" className="btn btn-primary">
              + Nuevo deal
            </Link>
          </div>
        </div>

        {/* KPI grid */}
        <div className="kpi-grid">
          <div className="kpi kpi-feature">
            <div className="kpi-head">
              <span className="kpi-label">Revenue total · Mayo</span>
              <span className="kpi-icon">$</span>
            </div>
            <div className="kpi-value">$312.4<span className="unit">K</span></div>
            <div className="kpi-foot">
              <span className="trend trend-up">▲ 16.5%</span> vs. abril
            </div>
            <Spark vals={[142, 168, 154, 198, 224, 268, 312]} color="#0A0A0A" />
          </div>

          <div className="kpi">
            <div className="kpi-head">
              <span className="kpi-label">Deals activos</span>
              <span className="kpi-icon"><TrendingUp size={14} /></span>
            </div>
            <div className="kpi-value">{openDeals.length || 47}</div>
            <div className="kpi-foot">
              <span className="trend trend-up">▲ 8</span> nuevos esta semana
            </div>
            <Spark vals={[28, 32, 29, 36, 38, 41, 47]} color="var(--text-secondary)" />
          </div>

          <div className="kpi">
            <div className="kpi-head">
              <span className="kpi-label">Tasa de cierre</span>
              <span className="kpi-icon"><CheckSquare size={14} /></span>
            </div>
            <div className="kpi-value">34<span className="unit">%</span></div>
            <div className="kpi-foot">
              <span className="trend trend-up">▲ 4.2pt</span> últimos 30 días
            </div>
            <Spark vals={[22, 26, 28, 25, 30, 32, 34]} color="var(--text-secondary)" />
          </div>

          <div className="kpi">
            <div className="kpi-head">
              <span className="kpi-label">Ticket promedio</span>
              <span className="kpi-icon"><Sparkles size={14} /></span>
            </div>
            <div className="kpi-value">$24.8<span className="unit">K</span></div>
            <div className="kpi-foot">
              <span className="trend trend-down">▼ 2.1%</span> vs. trimestre anterior
            </div>
            <Spark vals={[26, 25, 27, 24, 26, 25, 24]} color="var(--text-secondary)" />
          </div>
        </div>

        {/* Two column */}
        <div className="row-2">
          {/* Revenue chart */}
          <div className="card">
            <div className="card-head">
              <div>
                <h3 className="card-title">Revenue mensual</h3>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Últimos 7 meses · MXN</div>
              </div>
              <div className="segmented segmented-accent">
                <button>7D</button>
                <button>30D</button>
                <button className="active">12M</button>
                <button>YTD</button>
              </div>
            </div>
            <RevenueChart />
            <div style={{ borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { label: 'Mejor mes', value: '$312K', sub: 'Mayo' },
                { label: 'Promedio mensual', value: '$209K', sub: 'últimos 7 meses' },
                { label: 'Forecast Jun', value: '$348K', sub: 'según pipeline' },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: '18px 22px', borderLeft: i ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming activities */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Próximas actividades</h3>
              <Link href="/dashboard/activities" className="btn btn-ghost btn-sm">
                Ver todo <ArrowRight size={12} />
              </Link>
            </div>
            <div className="activity-list">
              {upcomingActivities.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-time">{a.time}</div>
                  <div className={`activity-icon${a.accent ? ' accent' : ''}`}>
                    {a.type === 'call' ? '📞' : a.type === 'demo' ? '✨' : a.type === 'email' ? '✉' : a.type === 'meeting' ? '📅' : '✓'}
                  </div>
                  <div className="activity-body">
                    <p className="activity-title">{a.title}</p>
                    <p className="activity-meta">{a.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline distribution */}
        <div style={{ marginTop: 20 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <h3 className="card-title">Pipeline por etapa</h3>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Valor total ponderado · $1.11M MXN</div>
              </div>
              <Link href="/dashboard/deals" className="btn btn-secondary btn-sm">
                Ir al pipeline <ArrowRight size={12} />
              </Link>
            </div>
            <PipelineBar />
          </div>
        </div>
      </div>
    </div>
  );
}
