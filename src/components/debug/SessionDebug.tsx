"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export function SessionDebug() {
  const { data: session, status } = useSupabaseSession();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-black/80 text-white text-xs rounded-lg max-w-xs z-50 font-mono">
      <div className="font-bold mb-1">Session Debug</div>
      <div>Status: {status}</div>
      {session?.user && (
        <>
          <div>ID: {session.user.id?.slice(0, 8)}...</div>
          <div>Role: {session.user.role}</div>
          <div>Unit: {session.user.businessUnit}</div>
        </>
      )}
    </div>
  );
}
