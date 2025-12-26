export default function NoTailwindTest() {
  return (
    <div className="test-container">
      <h1 className="test-title">Pure CSS Test (No Tailwind)</h1>
      
      <div className="test-card">
        <h2 style={{color: '#374151', marginBottom: '0.5rem'}}>Status Check</h2>
        <p style={{color: '#6b7280'}}>
          This page uses pure CSS without any Tailwind directives.
          If this loads quickly, the issue is with Tailwind compilation.
        </p>
      </div>

      <div className="test-grid">
        <div className="test-box bg-blue">Blue Box</div>
        <div className="test-box bg-green">Green Box</div>
        <div className="test-box bg-red">Red Box</div>
      </div>
      
      <div className="test-card" style={{marginTop: '2rem', background: '#dcfce7', border: '1px solid #16a34a'}}>
        <p style={{color: '#15803d', margin: 0, fontWeight: 'bold'}}>
          ✅ Pure CSS is working! If you see this, the issue is specifically with Tailwind.
        </p>
      </div>
    </div>
  );
}