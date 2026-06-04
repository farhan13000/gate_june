export default function SkeletonLoader({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse bg-[#F3F4F6]" />
      ))}
    </div>
  );
}
