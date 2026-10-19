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
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-mono text-[#a3a3a3] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#737373] animate-pulse" />
        Checking health...
      </div>
    );
  }

  if (status === 'normal') {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 backdrop-blur-md shadow-[inset_0_1px_0_rgba(110,231,183,0.2)]"
        title="All system components and datastores are healthy"
        aria-label="System status: All systems normal"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        All systems normal
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-mono text-amber-400 backdrop-blur-md shadow-[inset_0_1px_0_rgba(252,211,77,0.2)]"
      title="System running with degraded dependencies"
      aria-label="System status: Degraded"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Degraded
    </div>
  );
};

export default SystemStatusChip;
