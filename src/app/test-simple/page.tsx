export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">DEORA Plaza</h1>
        <p className="text-white/70 mb-8">System is working correctly!</p>
        <div className="bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-xl">
          ✅ Server is running properly
        </div>
      </div>
    </div>
  );
}