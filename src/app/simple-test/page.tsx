export default function SimpleTest() {
  return (
    <div className="p-8 bg-red-500 text-white">
      <h1 className="text-4xl font-bold">Simple Tailwind Test</h1>
      <p className="mt-4 text-lg">If you see red background and white text, Tailwind is working!</p>
      <div className="mt-6 p-4 bg-blue-600 rounded-lg">
        <p>This should be blue with rounded corners</p>
      </div>
    </div>
  );
}