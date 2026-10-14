import { useEffect, useState } from "react";

export interface SystemStats {
  cpuPercent: number | null;
  gpuPercent: number | null;
  ramUsedGB: number | null;
  ramTotalGB: number | null;
  vramUsedGB: number | null;
  vramTotalGB: number | null;
}

export function useSystemStats(): SystemStats | null {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    let active = true;
    let busy = false;

    const load = async () => {
      if (busy || !window.dishlink?.systemStats) return;

      busy = true;

      try {
        const result = await window.dishlink.systemStats();

        if (active) {
          setStats(result);
        }
      } catch {
        if (active) {
          setStats(null);
        }
      } finally {
        busy = false;
      }
    };

    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return stats;
}
