export function SetupNotice() {
  return (
    <main className="glass">
      <h1>Setup needed</h1>
      <p>
        Create a <code>.env</code> file next to <code>package.json</code> with your
        Supabase project keys, then restart <code>npm run dev</code>:
      </p>
      <pre>VITE_SUPABASE_URL=https://xxxxx.supabase.co{'\n'}VITE_SUPABASE_ANON_KEY=sb_publishable_...</pre>
      <p><small>Both values are in your Supabase dashboard under Project Settings → API.</small></p>
    </main>
  )
}
