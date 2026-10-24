import { useState, useEffect, useRef } from 'react';
import Skeleton from '../Skeleton';
import Button from '../Button';

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const useCountUp = (target, duration = 700) => {
  const [displayValue, setDisplayValue] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(target);
      return;
    }
    if (hasAnimatedRef.current) {
      setDisplayValue(target);
      return;
    }
    if (!target) {
      setDisplayValue(0);
      return;
    }

    hasAnimatedRef.current = true;
    let startTime = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplayValue(Math.round(eased * target));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, duration]);

  return displayValue;
};

export const StatCards = ({
  projects = [],
  loadingProjects = false,
  projectStats = { totalFiles: 0, totalLines: 0, loading: false },
  currentUserId,
  error = '',
  onRetry,
}) => {
  if (loadingProjects) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl glass p-4 h-28"
          >
            <div className="flex items-center justify-between">
              <Skeleton width="45%" height="14px" />
              <Skeleton width="28px" height="28px" rounded="rounded-xl" />
            </div>
            <Skeleton width="60%" height="24px" />
            <Skeleton width="80%" height="12px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-accent-deep bg-accent-tint/40 p-4 text-xs text-accent">
        <div className="flex items-center gap-2">
          <i className="ri-error-warning-line text-base text-accent" />
          <span>{error}</span>
        </div>
        {onRetry && (
          <Button variant="secondary" size="xs" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Calculate stats
  const totalProjects = projects.length;
  let ownedCount = 0;
  const uniqueCollaborators = new Set();

  projects.forEach((proj) => {
    const ownerId = proj.owner?._id ? proj.owner._id.toString() : proj.owner?.toString();
    if (ownerId && currentUserId && ownerId === currentUserId) {
      ownedCount++;
    }

    if (Array.isArray(proj.users)) {
      proj.users.forEach((u) => {
        const uId = u?._id ? u._id.toString() : u?.toString();
        if (uId && uId !== currentUserId) {
          uniqueCollaborators.add(uId);
        }
      });
    }
  });

  const memberCount = Math.max(0, totalProjects - ownedCount);
  const ownedPercent = totalProjects > 0 ? Math.round((ownedCount / totalProjects) * 100) : 0;

  const animatedTotalProjects = useCountUp(totalProjects);
  const animatedOwnedCount = useCountUp(ownedCount);
  const animatedTotalFiles = useCountUp(projectStats.totalFiles || 0);
  const animatedTotalLines = useCountUp(projectStats.totalLines || 0);
  const animatedCollaborators = useCountUp(uniqueCollaborators.size);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Projects */}
      <div className="flex flex-col justify-between rounded-2xl glass p-4.5 transition-[border-color,transform] duration-180 hover:border-white/25 hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-xs text-[#a89384]">
          <span className="font-medium">Total Projects</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl glass text-accent shadow-sm">
            <i className="ri-folder-3-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-[#f3e6da] tabular-nums">
            {animatedTotalProjects}
          </div>
          <p className="mt-1 text-[11px] text-[#6e5d50]">
            Active developer workspaces
          </p>
        </div>
      </div>

      {/* 2. Projects Ownership (Owned vs Shared) */}
      <div className="flex flex-col justify-between rounded-2xl glass p-4.5 transition-[border-color,transform] duration-180 hover:border-white/25 hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-xs text-[#a89384]">
          <span className="font-medium">Ownership</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl glass text-[#c4b5a8] shadow-sm">
            <i className="ri-shield-user-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-[#f3e6da] tabular-nums">
              {animatedOwnedCount}
            </span>
            <span className="text-xs font-mono text-[#6e5d50] tabular-nums">/ {totalProjects} owned</span>
          </div>

          {/* Liquid ownership ratio bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-[width] duration-300 ease-out"
              style={{ width: `${ownedPercent}%` }}
              title={`${ownedCount} owned (${ownedPercent}%)`}
            />
          </div>

          <p className="mt-1.5 text-[11px] text-[#6e5d50] tabular-nums">
            {ownedCount} owned · {memberCount} shared
          </p>
        </div>
      </div>

      {/* 3. Files & Lines of Code */}
      <div className="flex flex-col justify-between rounded-2xl glass p-4.5 transition-[border-color,transform] duration-180 hover:border-white/25 hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-xs text-[#a89384]">
          <span className="font-medium">Total Codebase</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl glass text-[#f3e6da] shadow-sm">
            <i className="ri-code-box-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          {projectStats.loading ? (
            <div className="space-y-1.5">
              <Skeleton width="50%" height="24px" />
              <Skeleton width="70%" height="12px" />
            </div>
          ) : (
            <>
              <div className="font-mono text-2xl font-bold tracking-tight text-[#f3e6da] tabular-nums">
                {animatedTotalFiles.toLocaleString()}{' '}
                <span className="text-sm font-normal text-[#a89384]">files</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-[#6e5d50] tabular-nums">
                {animatedTotalLines.toLocaleString()} lines of code
              </p>
            </>
          )}
        </div>
      </div>

      {/* 4. Collaborators */}
      <div className="flex flex-col justify-between rounded-2xl glass p-4.5 transition-[border-color,transform] duration-180 hover:border-white/25 hover:-translate-y-0.5">
        <div className="flex items-center justify-between text-xs text-[#a89384]">
          <span className="font-medium">Collaborators</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl glass text-accent-hover shadow-sm">
            <i className="ri-team-line text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-[#f3e6da] tabular-nums">
            {animatedCollaborators}
          </div>
          <p className="mt-1 text-[11px] text-[#6e5d50] tabular-nums">
            {uniqueCollaborators.size === 1 ? 'Peer collaborator' : 'Peer collaborators across projects'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
