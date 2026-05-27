import Skeleton from "@mui/joy/Skeleton";

const tableHeaderWidths = [72, 96, 84, 100, 78, 92];

export const DashboardSkeleton = () => (
  <div className="space-y-6 w-full animate-pulse">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={250} height={16} />
      </div>
      <Skeleton
        variant="rectangular"
        width={200}
        height={40}
        sx={{ borderRadius: "12px" }}
      />
    </div>

    {/* Ringkasan Cards Skeleton (3 Kotak) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
        >
          <Skeleton variant="circular" width={56} height={56} />
          <div className="flex-1">
            <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={120} height={28} />
          </div>
        </div>
      ))}
    </div>

    {/* Grafik/Area Bawah Skeleton */}
    <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[300px]">
      <Skeleton variant="text" width={150} height={24} sx={{ mb: 4 }} />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={200}
        sx={{ borderRadius: "12px" }}
      />
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-6 w-full animate-pulse">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <Skeleton variant="text" width={200} height={32} />
      <div className="flex gap-3 w-full md:w-auto">
        <Skeleton
          variant="rectangular"
          width={200}
          height={40}
          sx={{ borderRadius: "12px", flex: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width={120}
          height={40}
          sx={{ borderRadius: "12px" }}
        />
      </div>
    </div>

    {/* Tabel Skeleton */}
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Tabel */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 flex gap-4">
        {tableHeaderWidths.map((width, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={width}
            height={16}
          />
        ))}
      </div>

      {/* Baris Tabel (5 Baris) */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="p-4 border-b border-gray-50 flex items-center gap-4"
        >
          <Skeleton
            variant="rectangular"
            width={32}
            height={32}
            sx={{ borderRadius: "8px", shrink: 0 }}
          />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="20%" height={12} />
          </div>
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton
            variant="rectangular"
            width={32}
            height={32}
            sx={{ borderRadius: "8px", shrink: 0 }}
          />
        </div>
      ))}
    </div>
  </div>
);
