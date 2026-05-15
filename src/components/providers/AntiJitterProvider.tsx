"use client";

import { useAntiJitter } from "@/hooks/useAntiJitter";

interface AntiJitterProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function AntiJitterProvider({ children, enabled = true }: AntiJitterProviderProps) {
  useAntiJitter(enabled);
  
  return <>{children}</>;
}