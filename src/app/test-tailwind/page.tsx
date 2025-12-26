export default function TestTailwindPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full transform transition-all hover:scale-105">
                <div className="h-16 w-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg animate-bounce">
                    <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-2 font-sans">
                    Tailwind CSS is Working!
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    If you can see this card with a bouncing checkmark, blue circle, and shadows, then Tailwind CSS is correctly configured.
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                    Click Me
                </button>
            </div>
        </div>
    );
}
