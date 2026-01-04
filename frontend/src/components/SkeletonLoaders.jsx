import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const CardSkeleton = ({ count = 1 }) => {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-xl shadow-md">
          <Skeleton height={24} className="mb-4" />
          <Skeleton count={3} height={16} className="mb-2" />
          <Skeleton height={40} className="mt-4" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 space-y-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array(cols).fill(0).map((_, i) => (
            <Skeleton key={`header-${i}`} height={20} />
          ))}
        </div>
        {Array(rows).fill(0).map((_, rowI) => (
          <div key={`row-${rowI}`} className="grid gap-4 py-3 border-t" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array(cols).fill(0).map((_, colI) => (
              <Skeleton key={`cell-${rowI}-${colI}`} height={16} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const HeaderSkeleton = () => {
  return (
    <div className="mb-8">
      <Skeleton height={48} className="mb-4" />
      <Skeleton count={2} height={16} />
    </div>
  );
};

export const GridCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-xl shadow-md">
          <Skeleton height={100} className="mb-4 rounded-lg" />
          <Skeleton height={24} className="mb-3" />
          <Skeleton count={2} height={16} />
          <Skeleton height={40} className="mt-4" />
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
