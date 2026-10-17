import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import getErrorMessage from '../../utils/getErrorMessage';
import Button from '../Button';
import Skeleton from '../Skeleton';

export const RecentActivity = () => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/dashboard/activity?limit=10');
      setActivity(res.data?.activity || []);
    } catch (err) {
      console.error('Fetch activity error:', err);
      setError(getErrorMessage(err, 'Failed to load recent activity.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="flex flex-col rounded-lg border border-[#262626] bg-[#111111] p-4 text-xs font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <i className="ri-history-line text-sm text-[#a3a3a3]" />
          <h3 className="font-semibold text-sm text-[#fafafa] tracking-tight">
            Recent Activity
          </h3>
        </div>
        <button
          type="button"
          onClick={fetchActivity}
          className="text-[#737373] hover:text-[#fafafa] p-1 rounded focus-ring transition-colors"
          title="Refresh activity"
          aria-label="Refresh recent activity"
        >
          <i className="ri-refresh-line text-xs" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5 p-2 rounded-md border border-[#262626]/40 bg-[#0a0a0a]/50">
              <div className="flex items-center justify-between">
                <Skeleton width="40%" height="12px" />
                <Skeleton width="20%" height="10px" />
              </div>
              <Skeleton width="90%" height="14px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-400">
          <p>{error}</p>
          <Button variant="secondary" size="xs" onClick={fetchActivity} className="mt-2">
            Retry
          </Button>
        </div>
      ) : activity.length > 0 ? (
        <div className="space-y-2 overflow-y-auto max-h-[380px] pr-0.5">
          {activity.map((item) => {
            const isAi = item.isAi;
            const senderName = isAi ? 'Friday AI' : item.sender?.email || 'Collaborator';
            const projectName = item.project?.name || 'Workspace';
            const projectId = item.project?._id;
            const timeStr = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={item._id}
                onClick={() => {
                  if (projectId) navigate(`/project/${projectId}`);
                }}
                className="group flex flex-col gap-1 rounded-md border border-[#262626] bg-[#0a0a0a] p-2.5 cursor-pointer transition-all duration-150 hover:border-[#404040] hover:bg-[#141414] focus-ring"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (projectId) navigate(`/project/${projectId}`);
                  }
                }}
                aria-label={`Open project ${projectName}`}
              >
                {/* Activity Meta */}
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#737373]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="rounded bg-[#171717] border border-[#262626] px-1 py-0.2 text-[#fafafa] truncate max-w-[120px]">
                      {projectName}
                    </span>
                    <span>·</span>
                    <span className="truncate text-[#a3a3a3]">
                      {isAi && (
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                      {senderName}
                    </span>
                  </div>
                  {timeStr && <span className="shrink-0 text-[#525252]">{timeStr}</span>}
                </div>

                {/* Message snippet */}
                <p className="line-clamp-2 text-xs text-[#a3a3a3] group-hover:text-[#fafafa] transition-colors leading-relaxed break-words">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-8 text-center text-[#737373]">
          <i className="ri-chat-voice-line text-2xl mb-2 text-[#404040]" />
          <p className="text-xs text-[#a3a3a3] font-medium">No recent activity yet</p>
          <p className="text-[11px] text-[#737373] mt-1 max-w-[200px]">
            Send a message in any project workspace to view live team updates here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
