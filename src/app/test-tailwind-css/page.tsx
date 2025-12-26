export default function TailwindCSSTestPage() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "2rem", 
      backgroundColor: "#f3f4f6",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h1 style={{ 
          fontSize: "2.25rem", 
          fontWeight: "bold", 
          color: "#111827",
          marginBottom: "1rem"
        }}>
          Tailwind CSS Test Page
        </h1>
        
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "0.5rem", 
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid #e5e7eb"
        }}>
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600", 
            marginBottom: "1rem",
            color: "#1f2937"
          }}>
            Basic Tests
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.5rem" }}>
                Colors (Tailwind classes should style these):
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div className="w-16 h-16 bg-red-500 rounded"></div>
                <div className="w-16 h-16 bg-blue-500 rounded"></div>
                <div className="w-16 h-16 bg-green-500 rounded"></div>
              </div>
            </div>
            
            <div>
              <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.5rem" }}>
                Typography (Tailwind classes):
              </p>
              <p className="text-xs">Extra Small</p>
              <p className="text-sm">Small</p>
              <p className="text-base">Base</p>
              <p className="text-lg font-bold">Large Bold</p>
            </div>
            
            <div>
              <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.5rem" }}>
                Spacing (Tailwind classes):
              </p>
              <div className="p-4 bg-blue-100 rounded">Padding Test</div>
              <div className="mt-4 p-4 bg-green-100 rounded">Margin Test</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-500 text-white p-6 rounded-lg text-center" style={{
          backgroundColor: "#10b981",
          color: "white",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
            ✅ If the colored boxes above are styled, Tailwind is working!
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.9 }}>
            This box uses inline styles as a fallback
          </p>
        </div>
      </div>
    </div>
  );
}
