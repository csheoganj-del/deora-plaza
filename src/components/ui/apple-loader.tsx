"use client";

import { useState } from "react";

// Simple Apple Mini Loader for login process only
export function AppleMiniLoader({ isVisible = false }: { isVisible?: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="apple-mini-loader">
      <div className="apple-loader-dot"></div>
    </div>
  );
}

// Hook for managing loading states
export function useAppleLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => {
    document.body.classList.add("route-loading");
    setIsLoading(true);
  };

  const stopLoading = () => {
    document.body.classList.remove("route-loading");
    setIsLoading(false);
  };

  return { isLoading, startLoading, stopLoading };
}