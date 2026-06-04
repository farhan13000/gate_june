interface HeatmapPoint {
  date: string;
  count: number;
}

interface HeatmapGridProps {
  data: HeatmapPoint[];
}

export default function HeatmapGrid({ data }: HeatmapGridProps) {
  const max = Math.max(1, ...data.map((point) => point.count));

  return (
    <div className="dashboard-scrollbar overflow-x-auto">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {data.map((point) => {
          const alpha = point.count === 0 ? 0.06 : 0.18 + (point.count / max) * 0.58;
          return (
            <div
              key={point.date}
              title={`${point.date}: ${point.count}`}
              className="h-3 w-3 border border-[#E5E7EB]"
              style={{ backgroundColor: `rgba(13, 110, 253, ${alpha})` }}
            />
          );
        })}
      </div>
    </div>
  );
}
