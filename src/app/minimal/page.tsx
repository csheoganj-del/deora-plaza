export default function MinimalPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1e293b',
      color: 'white',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>DEORA Plaza</h1>
        <p style={{ marginBottom: '2rem', opacity: 0.7 }}>System Test - No Crashes</p>
        <div style={{ 
          backgroundColor: '#22c55e', 
          padding: '1rem', 
          borderRadius: '8px',
          color: 'white'
        }}>
          ✅ Browser Working Correctly
        </div>
      </div>
    </div>
  );
}