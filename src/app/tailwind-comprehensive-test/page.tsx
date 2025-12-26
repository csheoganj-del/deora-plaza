import React from 'react';

const TailwindComprehensiveTestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Comprehensive Tailwind CSS Test</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This page demonstrates that Tailwind CSS is working properly throughout the application.
          </p>
        </header>

        {/* Grid Layout Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Colors & Spacing</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded mr-3"></div>
                <span className="text-gray-700">Red 500</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded mr-3"></div>
                <span className="text-gray-700">Blue 500</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded mr-3"></div>
                <span className="text-gray-700">Green 500</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Typography</h2>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Heading</h3>
              <p className="text-gray-700">Regular paragraph text</p>
              <p className="text-sm text-gray-500">Small text</p>
              <p className="text-xs text-gray-400">Extra small text</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Flexbox & Alignment</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Left</span>
              <span className="text-gray-700">Right</span>
            </div>
            <div className="flex justify-center">
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">Centered</div>
            </div>
          </div>
        </div>

        {/* Interactive Elements */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Interactive Elements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300">
                  Primary
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300">
                  Secondary
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300">
                  Danger
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Form Elements</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Text input" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Utilities Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Utility Classes</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">bg-blue-100 text-blue-800 rounded-lg</div>
              <div className="p-4 bg-green-100 text-green-800 rounded-lg">bg-green-100 text-green-800 rounded-lg</div>
              <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">bg-yellow-100 text-yellow-800 rounded-lg</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Responsive Design</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-purple-100 p-4 rounded-lg text-center">Responsive 1</div>
              <div className="flex-1 bg-pink-100 p-4 rounded-lg text-center">Responsive 2</div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-indigo-100 p-3 rounded text-center">Grid {i + 1}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            If you can see all these elements with proper styling, Tailwind CSS is working correctly!
          </p>
          <div className="mt-4">
            <a 
              href="/"
              className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
            >
              Back to Home
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TailwindComprehensiveTestPage;