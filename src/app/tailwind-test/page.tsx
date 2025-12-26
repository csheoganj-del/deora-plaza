export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tailwind CSS Test</h1>
        <p className="text-gray-600 mb-6">
          If you can see this styled card with gradients, shadows, and proper typography, 
          then Tailwind CSS is working correctly!
        </p>
        
        <div className="space-y-4">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
            Primary Button
          </button>
          
          <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
            Secondary Button
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ Tailwind CSS is working properly!
          </p>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="h-8 bg-red-400 rounded"></div>
          <div className="h-8 bg-yellow-400 rounded"></div>
          <div className="h-8 bg-green-400 rounded"></div>
        </div>
      </div>
    </div>
  );
}