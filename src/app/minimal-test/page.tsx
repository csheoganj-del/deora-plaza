export default function MinimalTest() {
  return (
    <div className="p-8 bg-blue-500 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Minimal Tailwind Test</h1>
      <p className="text-lg mb-6">If you see blue background and white text, Tailwind is working!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500 p-4 rounded">Red</div>
        <div className="bg-green-500 p-4 rounded">Green</div>
        <div className="bg-yellow-500 p-4 rounded">Yellow</div>
      </div>
      
      <div className="mt-8 p-4 bg-white text-black rounded-lg">
        <p className="font-semibold">✅ Tailwind CSS is working!</p>
      </div>
    </div>
  );
}