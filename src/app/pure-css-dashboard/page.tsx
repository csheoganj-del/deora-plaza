export default function PureCSSTest() {
  return (
    <html>
      <head>
        <title>Pure CSS Test</title>
        <style>{`
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
          }
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            margin: 50px auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          .title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
          }
          .subtitle {
            font-size: 1.2rem;
            margin-bottom: 30px;
            text-align: center;
            opacity: 0.9;
          }
          .test-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 30px;
          }
          .test-box {
            height: 60px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          }
          .red { background: #ef4444; }
          .green { background: #10b981; }
          .blue { background: #3b82f6; }
          .yellow { background: #f59e0b; }
          .purple { background: #8b5cf6; }
          .pink { background: #ec4899; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <h1 className="title">Pure CSS Test</h1>
          <p className="subtitle">
            This page uses pure CSS without Tailwind to test basic rendering.
          </p>
          
          <div className="test-grid">
            <div className="test-box red">Red</div>
            <div className="test-box green">Green</div>
            <div className="test-box blue">Blue</div>
            <div className="test-box yellow">Yellow</div>
            <div className="test-box purple">Purple</div>
            <div className="test-box pink">Pink</div>
          </div>
          
          <p style={{marginTop: '30px', textAlign: 'center', fontSize: '14px', opacity: '0.8'}}>
            If you can see this styled page, the issue is specifically with Tailwind CSS compilation.
          </p>
        </div>
      </body>
    </html>
  );
}