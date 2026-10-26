import { useState, useEffect } from 'react';
import axios from '../../config/axios';

export const SystemStatusChip = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'normal' | 'degraded'

  useEffect(() => {
    let active = true;

    axios
      .get('/health/ready')
      .then((res) => {
        if (!active) return;
        if (res.status === 200) {
          setStatus('normal');
        } else {
          setStatus('degraded');
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus('degraded');
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-mono text-[#a89384] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6e5d50] animate-pulse" />
        Checking health...
      </div>
    );
  }

  if (status === 'normal') {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-mono text-[#c4b5a8] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
        title="All system components and datastores are healthy"
        aria-label="System status: All systems normal"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
        <span className="hidden sm:inline">All systems normal</span>
        <span className="sm:hidden">Normal</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-accent-hover/30 bg-accent-tint/30 px-2.5 py-0.5 text-[11px] font-mono text-accent-hover backdrop-blur-md"
      title="System running with degraded dependencies"
      aria-label="System status: Degraded"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-hover" />
      Degraded
    </div>
  );
};

export default SystemStatusChip;
