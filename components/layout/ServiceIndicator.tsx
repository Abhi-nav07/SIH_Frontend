"use client";
import { useEffect, useState } from "react";
import { WifiOff, Activity } from "lucide-react";

export function ServiceIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg">
      <WifiOff size={16} />
      <span>Browser Offline - Operating in Local Cache Mode</span>
    </div>
  );
}
