import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userName = 'Mario';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    userName = profile?.full_name || user.email?.split('@')[0] || 'Mario';
  }

  return (
    <div className="crm-app">
      <Sidebar userName={userName} />
      <main className="crm-main">{children}</main>
    </div>
  );
}
