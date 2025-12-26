export default function TestDashboard() {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#1f2937'
      }}>
        Dashboard Test (No Tailwind)
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{color: '#374151', marginBottom: '10px'}}>Status Check</h2>
        <p style={{color: '#6b7280'}}>
          This page uses inline styles instead of Tailwind CSS.
          If this loads properly, the issue is specifically with Tailwind compilation.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '15px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          Blue Card
        </div>
        <div style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '15px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          Green Card
        </div>
        <div style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          padding: '15px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          Yellow Card
        </div>
      </div>
    </div>
  );
}