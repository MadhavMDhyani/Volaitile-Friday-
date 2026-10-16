export const Skeleton = ({
  className = '',
  width,
  height,
  rounded = 'rounded-md',
}) => {
  return (
    <div
      className={`skeleton-shimmer border border-[#262626]/50 ${rounded} ${className}`}
      style={{
        width: width,
        height: height,
      }}
      aria-hidden="true"
    />
  );
};

export const ProjectCardSkeleton = () => (
  <div className="flex flex-col justify-between rounded-lg border border-[#262626] bg-[#111111] p-5 h-44">
    <div>
      <div className="flex items-center justify-between">
        <Skeleton width="60%" height="20px" />
        <Skeleton width="45px" height="18px" rounded="rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton width="90%" height="12px" />
        <Skeleton width="70%" height="12px" />
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-[#262626] pt-3">
      <Skeleton width="80px" height="14px" />
      <Skeleton width="60px" height="14px" />
    </div>
  </div>
);

export const FileItemSkeleton = () => (
  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-[#262626]/40">
    <Skeleton width="16px" height="16px" rounded="rounded" />
    <Skeleton width="70%" height="14px" />
  </div>
);

export const MessageSkeleton = () => (
  <div className="flex flex-col gap-2 p-3">
    <div className="flex items-center gap-2">
      <Skeleton width="20px" height="20px" rounded="rounded-full" />
      <Skeleton width="120px" height="14px" />
    </div>
    <Skeleton width="80%" height="32px" rounded="rounded-lg" />
  </div>
);

export default Skeleton;
