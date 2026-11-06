import { useState, useEffect } from 'react';
import axios from '../../config/axios';

export const SystemStatusChip = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'waking' | 'normal' | 'degraded'

  useEffect(() => {
    let active = true;
    let timer = null;

    const checkHealth = async () => {
      try {
        const res = await axios.get('/health/ready');
        if (!active) return;
        if (res.status === 200) {
          setStatus('normal');
        } else {
          handleFailure();
        }
      } catch {
        if (!active) return;
        handleFailure();
      }
    };

    const handleFailure = () => {
      setStatus('waking');
      timer = setTimeout(async () => {
        try {
          const res = await axios.get('/health/ready');
          if (!active) return;
          if (res.status === 200) {
            setStatus('normal');
          } else {
            setStatus('degraded');
          }
        } catch {
          if (!active) return;
          setStatus('degraded');
        }
      }, 3000);
    };

    checkHealth();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (status === 'checking' || status === 'waking') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass-bg px-2.5 py-0.5 text-[11px] font-mono text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-pulse" />
        {status === 'waking' ? 'Waking up...' : 'Checking health...'}
      </div>
    );
  }

  if (status === 'normal') {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono text-primary shadow-[0_0_10px_rgba(51,188,101,0.2)]"
        title="All system components and datastores are healthy"
        aria-label="System status: All systems normal"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(51,188,101,0.7)]" />
        <span className="hidden sm:inline">All systems normal</span>
        <span className="sm:hidden">Normal</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-mono text-accent"
      title="System running with degraded dependencies"
      aria-label="System status: Degraded"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Degraded
    </div>
  );
};

export default SystemStatusChip;

