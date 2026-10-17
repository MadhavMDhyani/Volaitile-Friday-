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
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#111111] px-2.5 py-0.5 text-[11px] font-mono text-[#737373]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#525252] animate-pulse" />
        Checking health...
      </div>
    );
  }

  if (status === 'normal') {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400"
        title="All system components and datastores are healthy"
        aria-label="System status: All systems normal"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        All systems normal
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-mono text-amber-400"
      title="System running with degraded dependencies"
      aria-label="System status: Degraded"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Degraded
    </div>
  );
};

export default SystemStatusChip;
