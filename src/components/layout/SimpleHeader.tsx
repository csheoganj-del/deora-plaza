"use client";

import { useState, useEffect } from "react";
import { Bell, Settings, User } from "lucide-react";

export function SimpleHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 backdrop-blur-xl bg-white/8 border-b border-white/15 px-6 flex items-center justify-between">
      {/* Left side - Welcome */}
      <div>
        <h2 className="text-lg font-semibold text-white">Welcome back!</h2>
        <p className="text-sm text-white/70">Manage your restaurant operations</p>
      </div>

      {/* Right side - Time and Actions */}
      <div className="flex items-center gap-4">
        {/* Current Time */}
        <div className="text-right">
          <div className="text-sm font-medium text-white">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
          <div className="text-xs text-white/70">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}