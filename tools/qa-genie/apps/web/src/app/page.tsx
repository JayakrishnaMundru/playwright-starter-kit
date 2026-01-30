export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <h1>QA-Genie</h1>
      <p>CLI + simple UI scaffold is installed.</p>
      <p>Next: URL explorer → interview → test generation.</p>
      <ul>
        <li>CLI: <code>npx qa-genie --help</code></li>
        <li>Dev server: <code>npm run dev</code></li>
      </ul>
    </main>
  );
}
