"use client";

import { useEffect, useState } from "react";

export default function TestEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>({});

  useEffect(() => {
    // This will run in the browser
    console.log("Browser environment check:");
    console.log("- process.env.NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("- process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET");
    
    // Check if window is defined
    console.log("- window defined:", typeof window !== "undefined");
    
    // Check if process is defined
    console.log("- process defined:", typeof process !== "undefined");
    
    // Check process.env
    console.log("- process.env:", process.env);
    
    setEnvInfo({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
      windowDefined: typeof window !== "undefined",
      processDefined: typeof process !== "undefined",
      windowLocation: typeof window !== "undefined" ? window.location.href : "N/A"
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="bg-[#F1F5F9] p-4 rounded">
        <pre>{JSON.stringify(envInfo, null, 2)}</pre>
      </div>
      <p className="mt-4">
        Check the browser console for detailed logs.
      </p>
      <div className="mt-4">
        <h2 className="text-xl font-bold">Troubleshooting Steps:</h2>
        <ol className="list-decimal pl-5 mt-2">
          <li>Check browser console for errors</li>
          <li>Verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set</li>
          <li>Try clearing browser cache and cookies</li>
          <li>Restart the development server</li>
        </ol>
      </div>
    </div>
  );
}

