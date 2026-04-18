import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <h1>Relia Intranet</h1>
      <p style={{ color: 'var(--muted)' }}>
        Internal staff dashboard. {user ? `Signed in as ${user.email}.` : 'Not signed in.'}
      </p>
      <section>
        <h2>Sections</h2>
        <ul>
          <li>Team directory (TODO)</li>
          <li>Linear issues (TODO)</li>
          <li>Deploy log (TODO)</li>
          <li>Runbooks (TODO)</li>
        </ul>
      </section>
    </main>
  );
}
