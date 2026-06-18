const formatShortNumber = (value) => {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${number / 1000000} Jt`;
  if (number >= 1000) return `${number / 1000} Rb`;
  return String(number);
};

export const SimpleBarChart = ({
  data = [],
  series = [],
  emptyMessage = "Belum ada data.",
  heightClass = "h-[300px]",
}) => {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) =>
      series.map((serie) => Number(item[serie.dataKey]) || 0),
    ),
  );

  if (!data.length || !series.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${heightClass}`}>
      <div className="mb-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-200">
        {series.map((serie) => (
          <div key={serie.dataKey} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: serie.color }}
            />
            {serie.label}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
        <div
          className="grid h-full min-w-full items-end gap-3"
          style={{
            gridTemplateColumns: `repeat(${data.length}, minmax(42px, 1fr))`,
          }}
        >
          {data.map((item, index) => (
            <div
              key={item.date || item.label || index}
              className="flex h-full min-w-0 flex-col justify-end gap-2"
              style={{
                borderLeft:
                  index > 0
                    ? '1px solid rgba(148,163,184,0.35)'
                    : 'none',
              }}
              title={series
                .map(
                  (serie) =>
                    `${serie.label}: ${serie.valueFormatter ? serie.valueFormatter(item[serie.dataKey]) : item[serie.dataKey]}`,
                )
                .join('\n')}
            >
              {/* Bar track with horizontal grid lines */}
              <div className="relative flex min-h-0 flex-1 items-end justify-center gap-1 rounded-t-lg bg-slate-100/70 px-1 pt-3 dark:bg-slate-800/60">
                {/* Horizontal grid lines overlay (every 25%) */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-t-lg"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, rgba(148,163,184,0.4) 0px, rgba(148,163,184,0.4) 1px, transparent 1px, transparent 25%)',
                  }}
                />
                {series.map((serie) => {
                  const value = Number(item[serie.dataKey]) || 0;
                  const percent = Math.max(3, (value / maxValue) * 100);

                  return (
                    <div
                      key={serie.dataKey}
                      className="relative z-10 w-full rounded-t-md transition-[height] duration-300"
                      style={{
                        height: `${percent}%`,
                        backgroundColor: serie.color,
                      }}
                      aria-label={`${serie.label} ${formatShortNumber(value)}`}
                    />
                  );
                })}
              </div>
              <div className="truncate text-center text-[10px] font-bold text-gray-500 dark:text-gray-300">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SimpleDonutChart = ({
  data = [],
  size = 190,
  strokeWidth = 28,
  emptyMessage = "Belum ada data.",
}) => {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = [
    "#2563eb",
    "#16a34a",
    "#f97316",
    "#7c3aed",
    "#0891b2",
    "#dc2626",
  ];

  if (!data.length || total <= 0) {
    return (
      <div className="text-gray-400 text-sm font-medium">{emptyMessage}</div>
    );
  }

  const segments = data.reduce(
    (result, item, index) => {
      const value = Number(item.value) || 0;
      const dash = (value / total) * circumference;

      return {
        offset: result.offset + dash,
        items: [
          ...result.items,
          {
            id: item.id ?? item.label ?? index,
            color: colors[index % colors.length],
            dash,
            offset: result.offset,
          },
        ],
      };
    },
    { offset: 0, items: [] },
  ).items;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Komposisi stok gudang"
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {segments.map((segment) => (
          <circle
            key={segment.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {data.slice(0, 6).map((item, index) => (
          <div
            key={item.id ?? item.label}
            className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600 dark:bg-slate-800 dark:text-gray-200"
          >
            <span
              className="mr-1 inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            {item.label}: {item.value}
          </div>
        ))}
      </div>
    </div>
  );
};
